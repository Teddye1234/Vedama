import React, { useState } from 'react';
import { Plus, Search, AlertTriangle, UserPlus, ShieldAlert, CreditCard, Edit2, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useToastStore } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import Badge, { statusToBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import FileUpload from '../../components/ui/FileUpload';
import { Tenant } from '../../types';

export default function PropertyMgmtPage() {
  const { 
    tenants, 
    properties, 
    addTenant, 
    updateTenant, 
    addAuditLog, 
    addLedgerEntry, 
    runEndOfMonthProcess, 
    processMonthlyLandlordVouchers 
  } = useDataStore();
  
  const { addToast } = useToastStore();
  const user = useAuthStore(s => s.user);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePaymentTenant, setActivePaymentTenant] = useState<Tenant | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditTenant, setActiveEditTenant] = useState<Tenant | null>(null);

  // Form states for Add Tenant
  const [addLeaseUrl, setAddLeaseUrl] = useState('');
  const [addLeaseName, setAddLeaseName] = useState('');

  // Form states for Edit Tenant
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPropertyId, setEditPropertyId] = useState('');
  const [editUnitNumber, setEditUnitNumber] = useState('');
  const [editRentAmount, setEditRentAmount] = useState(0);
  const [editBalance, setEditBalance] = useState(0);
  const [editLeaseStart, setEditLeaseStart] = useState('');
  const [editLeaseEnd, setEditLeaseEnd] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'arrears' | 'distress' | 'vacated'>('active');
  const [editLeaseUrl, setEditLeaseUrl] = useState('');
  const [editLeaseName, setEditLeaseName] = useState('');
  
  // Form states for Record Payment
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'mpesa' | 'bank_transfer' | 'cash'>('mpesa');
  const [payReference, setPayReference] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const distressCount = tenants.filter(t => t.status === 'distress').length;
  const arrearsCount = tenants.filter(t => t.status === 'arrears').length;

  // Open Payment Modal
  const openPaymentModal = (tenant: Tenant) => {
    setActivePaymentTenant(tenant);
    setPayAmount(tenant.balance > 0 ? tenant.balance : tenant.rentAmount);
    setPayMethod('mpesa');
    setPayReference(`TXN${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setPayDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentTenant) return;

    const amount = Number(payAmount);
    if (amount <= 0) {
      addToast('Please enter a valid payment amount', 'warning');
      return;
    }

    const newBalance = Math.max(0, activePaymentTenant.balance - amount);
    
    // Determine new status based on reconciled balance
    let newStatus: 'active' | 'arrears' | 'distress' = 'active';
    if (newBalance > activePaymentTenant.rentAmount) {
      newStatus = 'distress';
    } else if (newBalance > 0) {
      newStatus = 'arrears';
    }

    updateTenant(activePaymentTenant.id, { 
      balance: newBalance, 
      lastPaymentDate: payDate,
      status: newStatus
    });

    // Write to central finance ledger (90% Owner split, 10% Vedama Commission)
    addLedgerEntry({
      id: `LED-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      transactionId: `RENT-${activePaymentTenant.unitNumber}-${Date.now()}`,
      type: 'income',
      costCategory: 'rents_directors',
      description: `Rent payment collected via ${payMethod.toUpperCase()} (${payReference}) - ${activePaymentTenant.name} (Unit ${activePaymentTenant.unitNumber})`,
      amount: amount,
      landlordShare: amount * 0.9, 
      companyCommission: amount * 0.1,
      date: new Date(payDate).toISOString(),
      status: 'processed'
    });

    // Write security audit logs
    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'RECORD_RENT_PAYMENT',
      module: 'PropertyMgmt',
      details: `Recorded rent payment of ${formatCurrency(amount)} for ${activePaymentTenant.name}. Ref Code: ${payReference}. Bal: ${formatCurrency(newBalance)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast(`Successfully recorded ${formatCurrency(amount)} rent payment for ${activePaymentTenant.name}!`, 'success');
    setIsPaymentModalOpen(false);
  };

  // Open Edit Modal
  const openEditModal = (tenant: Tenant) => {
    setActiveEditTenant(tenant);
    setEditName(tenant.name);
    setEditPhone(tenant.phone);
    setEditEmail(tenant.email || '');
    setEditPropertyId(tenant.propertyId);
    setEditUnitNumber(tenant.unitNumber);
    setEditRentAmount(tenant.rentAmount);
    setEditBalance(tenant.balance);
    setEditLeaseStart(tenant.leaseStart);
    setEditLeaseEnd(tenant.leaseEnd);
    setEditStatus(tenant.status);
    setEditLeaseUrl(tenant.leaseAgreementUrl || '');
    setEditLeaseName(tenant.leaseAgreementUrl ? tenant.leaseAgreementUrl.split('/').pop() || 'lease_document.pdf' : '');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditTenant) return;

    updateTenant(activeEditTenant.id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      propertyId: editPropertyId,
      unitNumber: editUnitNumber,
      rentAmount: Number(editRentAmount),
      balance: Number(editBalance),
      leaseStart: editLeaseStart,
      leaseEnd: editLeaseEnd,
      status: editStatus,
      leaseAgreementUrl: editLeaseUrl
    });

    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'EDIT_TENANT_RECORD',
      module: 'PropertyMgmt',
      details: `Modified tenancy profile and financial obligations for ${editName} (Unit ${editUnitNumber}).`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast(`Tenancy files updated for ${editName}!`, 'success');
    setIsEditModalOpen(false);
  };

  // Submit Add Tenant
  const handleAddTenant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const propertyId = formData.get('propertyId') as string;
    const rentAmount = Number(formData.get('rentAmount'));
    const unitNumber = formData.get('unitNumber') as string;
    
    if (!name || !propertyId || !rentAmount || !unitNumber) {
      addToast('Please fill in all tenant requirements', 'warning');
      return;
    }
    
    const newTenant: Tenant = {
      id: `ten-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      name,
      email: (formData.get('email') as string) || '',
      phone: formData.get('phone') as string,
      propertyId,
      unitNumber,
      rentAmount,
      leaseStart: formData.get('leaseStart') as string,
      leaseEnd: new Date(new Date(formData.get('leaseStart') as string).setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      balance: 0,
      status: 'active',
      leaseAgreementUrl: addLeaseUrl
    };

    addTenant(newTenant);

    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'ADD_NEW_TENANT',
      module: 'PropertyMgmt',
      details: `Registered new client tenant ${name} in Unit ${unitNumber} with signed lease deed.`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast(`Tenant ${newTenant.name} registered and legal records indexed!`, 'success');
    setIsAddModalOpen(false);
    setAddLeaseUrl('');
    setAddLeaseName('');
  };

  const getPropTitle = (id: string) => {
    return properties.find(p => p.id === id)?.title || 'Private Property Asset';
  };

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Rental Management</h1>
          <p className="text-text-secondary text-lg">Manage tenants, record direct rent payments, and route legal distress notices.</p>
        </div>
        <button 
          onClick={() => {
            setAddLeaseUrl('');
            setAddLeaseName('');
            setIsAddModalOpen(true);
          }} 
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full"
        >
          <UserPlus size={18} /> Add Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card animate-slide-up delay-100 transition-all hover:shadow-card-lg hover:-translate-y-1">
          <div className="text-text-secondary font-semibold text-sm uppercase tracking-wider mb-2">Total Tenants</div>
          <div className="text-3xl font-heading font-bold text-vedama-emerald">{tenants.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-status-warning/20 shadow-card animate-slide-up delay-200 transition-all hover:shadow-card-lg hover:-translate-y-1">
          <div className="text-status-warning font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> In Arrears
          </div>
          <div className="text-3xl font-heading font-bold text-status-warning">{arrearsCount}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-status-danger/20 shadow-card animate-slide-up delay-300 transition-all hover:shadow-card-lg hover:-translate-y-1">
          <div className="text-status-danger font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Distress (2+ Months)
          </div>
          <div className="text-3xl font-heading font-bold text-status-danger">{distressCount}</div>
        </div>
      </div>

      {/* END-OF-MONTH PROCESSING CONTROLS */}
      <div className="bg-gradient-to-r from-vedama-emerald-dark to-vedama-emerald p-6 rounded-3xl border border-vedama-emerald/20 shadow-card text-white mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
              📅 End-of-Month Automated Processing Controls
            </h2>
            <p className="text-white/80 text-xs mt-1 max-w-xl">
              Billing simulation runs. Executing charges next month's rents, applies a 5% interest fee after the 10th day on outstanding balances, auto-routes distress instructions for accounts in arrears for 2+ months, and compiles monthly consolidated landlord settlement payouts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button 
              onClick={() => {
                runEndOfMonthProcess();
                addToast('EOM Billing & 5% Interest Run completed!', 'success');
              }}
              className="px-5 py-2.5 bg-vedama-gold hover:bg-vedama-gold-dark text-vedama-emerald-dark font-bold text-xs rounded-full shadow-md transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
            >
              ⚡ Run Billing Run (5% Interest)
            </button>
            <button 
              onClick={() => {
                processMonthlyLandlordVouchers();
                addToast('Consolidated Landlord Payout Voucher processed!', 'success');
              }}
              className="px-5 py-2.5 bg-white hover:bg-surface-bg text-vedama-emerald-dark font-bold text-xs rounded-full shadow-md transition-all hover:scale-105 active:scale-95 uppercase tracking-wider border border-white"
            >
              📑 Compile Landlord Vouchers
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border mb-8 animate-slide-up delay-400">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search tenant name or unit..." 
            className="w-full pl-12 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-static overflow-hidden animate-slide-up delay-500 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Tenant Name</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Property & Unit</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Monthly Rent</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Balance Due</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Last Payment</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Lease Doc</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Status</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-surface-hover transition-colors text-xs">
                  <td className="table-cell py-4">
                    <div className="font-semibold text-text-primary text-sm">{tenant.name}</div>
                    <div className="text-[10px] text-text-muted mt-1">{tenant.phone} · {tenant.email || 'No Email'}</div>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-medium text-text-primary">{getPropTitle(tenant.propertyId)}</div>
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">Unit {tenant.unitNumber}</div>
                  </td>
                  <td className="table-cell py-4 font-semibold">{formatCurrency(tenant.rentAmount)}</td>
                  <td className="table-cell py-4">
                    <span className={`font-bold text-sm ${tenant.balance > 0 ? 'text-status-danger' : 'text-status-success'}`}>
                      {formatCurrency(tenant.balance)}
                    </span>
                  </td>
                  <td className="table-cell py-4 text-text-secondary">{tenant.lastPaymentDate ? formatDate(tenant.lastPaymentDate) : 'No payments yet'}</td>
                  <td className="table-cell py-4">
                    {tenant.leaseAgreementUrl ? (
                      <a 
                        href={tenant.leaseAgreementUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] font-bold text-vedama-emerald hover:underline flex items-center gap-1"
                      >
                        <FileText size={12} /> View Lease
                      </a>
                    ) : (
                      <span className="text-[10px] text-text-muted italic">No lease PDF</span>
                    )}
                  </td>
                  <td className="table-cell py-4">
                    <Badge variant={statusToBadge(tenant.status)}>{tenant.status.toUpperCase()}</Badge>
                  </td>
                  <td className="table-cell py-4 text-right space-x-2.5">
                    <button 
                      onClick={() => openPaymentModal(tenant)}
                      className="px-3 py-1.5 bg-vedama-emerald/10 hover:bg-vedama-emerald text-vedama-emerald hover:text-white rounded-full font-bold text-[10px] transition-colors inline-flex items-center gap-1 shadow-sm"
                    >
                      <CreditCard size={10} /> Record Payment
                    </button>
                    <button 
                      onClick={() => openEditModal(tenant)}
                      className="px-3 py-1.5 bg-surface-bg hover:bg-surface-border text-text-primary border border-surface-border rounded-full font-bold text-[10px] transition-colors inline-flex items-center gap-1"
                    >
                      <Edit2 size={10} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEGAL DISTRESS & ADVOCATE REFERRALS */}
      {distressCount > 0 && (
        <div className="card-static p-6 border border-status-danger/20 rounded-3xl shadow-card animate-slide-up delay-600 bg-red-50/10 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="text-status-danger animate-pulse" size={24} />
            <h2 className="text-lg font-heading font-bold text-text-primary">
              ⚖️ Legal Distress & Advocate Referrals Ledger
            </h2>
          </div>
          <p className="text-text-secondary text-xs mb-4">
            The following tenants are in 2+ months unpaid arrears status. Distress notes have been automatically raised and routed to **Muriuki & Partners Advocates** (`+254722888999`).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bg border-b border-surface-border text-xs uppercase text-text-muted font-bold">
                  <th className="py-3 px-4">Tenant Name</th>
                  <th className="py-3 px-4">Unit #</th>
                  <th className="py-3 px-4">Outstanding Balance</th>
                  <th className="py-3 px-4">Distress Date</th>
                  <th className="py-3 px-4">Advocate Firm</th>
                  <th className="py-3 px-4">Legal Instruction</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {tenants.filter(t => t.status === 'distress').map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-red-50/5">
                    <td className="py-3 px-4 font-semibold text-text-primary">{tenant.name}</td>
                    <td className="py-3 px-4 font-mono">{tenant.unitNumber}</td>
                    <td className="py-3 px-4 font-bold text-status-danger">{formatCurrency(tenant.balance)}</td>
                    <td className="py-3 px-4 text-text-secondary">{tenant.distressDate ? formatDate(tenant.distressDate) : 'Pending EOM Run'}</td>
                    <td className="py-3 px-4 font-semibold text-vedama-emerald">{tenant.advocateName || 'Muriuki & Partners Advocates'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-red-100 text-status-danger rounded-full font-bold text-[10px]">
                        DISTRESS WARRANT PENDING
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => addToast(`Advocate referral SMS re-sent to lawyer panel for ${tenant.name}!`, 'info')}
                        className="text-[10px] font-bold text-vedama-emerald hover:text-vedama-gold uppercase tracking-wider"
                      >
                        Re-sent SMS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. ADD NEW TENANT MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New tenant Profile" size="md">
        <form className="space-y-5" onSubmit={handleAddTenant}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input name="name" type="text" className="input-field" placeholder="e.g. Francis Njuguna" required />
            </div>
            <div className="col-span-1">
              <label className="label">Phone Number</label>
              <input name="phone" type="tel" className="input-field" placeholder="e.g. +254712345678" required />
            </div>
            <div className="col-span-1">
              <label className="label">Email Address</label>
              <input name="email" type="email" className="input-field" placeholder="e.g. fnjuguna@gmail.com" />
            </div>
            <div className="col-span-2 bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-3">
              <label className="label font-bold text-text-primary uppercase tracking-wider text-[9px]">🏢 Asset Allocations</label>
              <div className="flex gap-2">
                <select name="propertyId" className="input-field flex-grow" required>
                  <option value="">-- Select Property --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <input name="unitNumber" type="text" className="input-field w-24 text-center" placeholder="Unit #" required />
              </div>
            </div>
            <div className="col-span-1">
              <label className="label">Monthly Rent Amount (KES)</label>
              <input name="rentAmount" type="number" className="input-field" placeholder="e.g. 45000" required />
            </div>
            <div className="col-span-1">
              <label className="label">Lease Agreement Start Date</label>
              <input name="leaseStart" type="date" className="input-field" required />
            </div>
            
            <div className="col-span-2 pt-2 border-t border-surface-border">
              <FileUpload 
                label="📁 Upload Signed Tenancy Lease Deed" 
                onUploadComplete={(url) => setAddLeaseUrl(url)}
                defaultUrl={addLeaseUrl}
                defaultName={addLeaseName}
              />
            </div>
          </div>
          
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Register Tenancy</button>
          </div>
        </form>
      </Modal>

      {/* 2. RECORD RENT PAYMENT MODAL */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Direct Rent Payment" size="md">
        {activePaymentTenant && (
          <form className="space-y-5" onSubmit={handleRecordPaymentSubmit}>
            <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-2 text-xs">
              <h4 className="font-bold text-text-primary uppercase tracking-wider text-[9px] mb-1">Tenancy Arrears Obligation</h4>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Tenant Name:</span>
                <span className="font-bold text-text-primary">{activePaymentTenant.name}</span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Allocated Unit:</span>
                <span className="font-mono text-text-primary">{getPropTitle(activePaymentTenant.propertyId)} · Unit {activePaymentTenant.unitNumber}</span>
              </div>
              <div className="flex justify-between items-center text-text-secondary pt-1 border-t border-dashed">
                <span>Current Balance Due:</span>
                <span className="font-bold text-status-danger text-sm">{formatCurrency(activePaymentTenant.balance)}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="label">Custom Recorded Payment Amount (KES)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Clearing Method</label>
                  <select 
                    className="input-field" 
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    required
                  >
                    <option value="mpesa">M-Pesa Express</option>
                    <option value="bank_transfer">Bank Wire Transfer</option>
                    <option value="cash">Cash / Physical Slip</option>
                  </select>
                </div>

                <div>
                  <label className="label">Transaction Reference Code</label>
                  <input 
                    type="text" 
                    className="input-field text-center font-mono font-bold" 
                    placeholder="e.g. QRD8FD92D"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="label">Clearance Clearing Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary !rounded-full shadow-md">Record & Reconcile Payment</button>
            </div>
          </form>
        )}
      </Modal>

      {/* 3. EDIT TENANCY DETAILS MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Tenancy Files & Arrears" size="md">
        <form className="space-y-5" onSubmit={handleEditTenantSubmit}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required 
              />
            </div>
            <div className="col-span-1">
              <label className="label">Phone Number</label>
              <input 
                type="tel" 
                className="input-field" 
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required 
              />
            </div>
            <div className="col-span-1">
              <label className="label">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="col-span-2 bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-3">
              <label className="label font-bold text-text-primary uppercase tracking-wider text-[9px]">🏢 Asset Allocations</label>
              <div className="flex gap-2">
                <select 
                  className="input-field flex-grow" 
                  value={editPropertyId}
                  onChange={(e) => setEditPropertyId(e.target.value)}
                  required
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  className="input-field w-24 text-center" 
                  value={editUnitNumber}
                  onChange={(e) => setEditUnitNumber(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="col-span-1">
              <label className="label">Monthly Rent Obligation (KES)</label>
              <input 
                type="number" 
                className="input-field" 
                value={editRentAmount}
                onChange={(e) => setEditRentAmount(Number(e.target.value))}
                required 
              />
            </div>

            <div className="col-span-1">
              <label className="label">Arrears Outstanding Balance (KES)</label>
              <input 
                type="number" 
                className="input-field font-bold text-status-danger" 
                value={editBalance}
                onChange={(e) => setEditBalance(Number(e.target.value))}
                required 
              />
            </div>

            <div className="col-span-1">
              <label className="label">Lease Agreement Start Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={editLeaseStart}
                onChange={(e) => setEditLeaseStart(e.target.value)}
                required 
              />
            </div>

            <div className="col-span-1">
              <label className="label">Lease Agreement End Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={editLeaseEnd}
                onChange={(e) => setEditLeaseEnd(e.target.value)}
                required 
              />
            </div>

            <div className="col-span-2">
              <label className="label">Tenancy Active Status</label>
              <select 
                className="input-field" 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                required
              >
                <option value="active">Active (All Clear)</option>
                <option value="arrears">Arrears (Unpaid Balances)</option>
                <option value="distress">Distress (Legal Eviction Pending)</option>
                <option value="vacated">Vacated (Unit Empty)</option>
              </select>
            </div>
            
            <div className="col-span-2 pt-2 border-t border-surface-border">
              <FileUpload 
                label="📁 Update Signed Tenancy Lease Deed" 
                onUploadComplete={(url) => setEditLeaseUrl(url)}
                defaultUrl={editLeaseUrl}
                defaultName={editLeaseName}
              />
            </div>
          </div>
          
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Save Tenancy Updates</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
