import React, { useState } from 'react';
import { 
  Plus, Search, AlertTriangle, UserPlus, ShieldAlert, CreditCard, 
  Edit2, Calendar, FileText, CheckCircle, Users, Briefcase, MapPin, Mail, Phone, Sparkles,
  Camera, Landmark, User 
} from 'lucide-react';
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
    processMonthlyLandlordVouchers,
    landlords,
    clients,
    addLandlord,
    addClient,
    sendRentReminder
  } = useDataStore();
  
  const { addToast } = useToastStore();
  const user = useAuthStore(s => s.user);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Active Tab state
  const [activeMgmtTab, setActiveMgmtTab] = useState<'tenants' | 'landlords' | 'clients'>('tenants');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddLandlordOpen, setIsAddLandlordOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePaymentTenant, setActivePaymentTenant] = useState<Tenant | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditTenant, setActiveEditTenant] = useState<Tenant | null>(null);

  // Form states for Add Tenant
  const [addLeaseUrl, setAddLeaseUrl] = useState('');
  const [addLeaseName, setAddLeaseName] = useState('');
  const [addAvatar, setAddAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [addLandlordId, setAddLandlordId] = useState('');
  const [addClientId, setAddClientId] = useState('');

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
  const [editAvatar, setEditAvatar] = useState('');
  const [editLandlordId, setEditLandlordId] = useState('');
  const [editClientId, setEditClientId] = useState('');
  
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
    setEditAvatar(tenant.avatar || '');
    setEditLandlordId(tenant.landlordId || '');
    setEditClientId(tenant.clientId || '');
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
      leaseAgreementUrl: editLeaseUrl,
      avatar: editAvatar,
      landlordId: editLandlordId,
      clientId: editClientId
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
      leaseAgreementUrl: addLeaseUrl,
      avatar: addAvatar,
      landlordId: addLandlordId,
      clientId: addClientId
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
    setAddAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    setAddLandlordId('');
    setAddClientId('');
  };

  const handleAddLandlord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const otherInfo = formData.get('otherInfo') as string;
    const avatar = formData.get('avatar') as string || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';

    if (!name || !phone) {
      addToast('Please fill in Name and Phone number', 'warning');
      return;
    }

    addLandlord({
      id: `l-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name,
      email,
      phone,
      properties: [],
      totalRevenue: 0,
      pendingPayment: 0,
      avatar,
      address,
      otherInfo
    });

    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'ADD_NEW_LANDLORD',
      module: 'PropertyMgmt',
      details: `Registered new landlord partner: ${name}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast(`Landlord ${name} onboarded successfully!`, 'success');
    setIsAddLandlordOpen(false);
  };

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const otherInfo = formData.get('otherInfo') as string;
    const avatar = formData.get('avatar') as string || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';

    if (!name || !phone) {
      addToast('Please fill in Name and Phone number', 'warning');
      return;
    }

    addClient({
      id: `c-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name,
      email,
      phone,
      avatar,
      address,
      otherInfo,
      createdAt: new Date().toISOString().split('T')[0]
    });

    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'ADD_NEW_CLIENT',
      module: 'PropertyMgmt',
      details: `Registered new land-buyer client: ${name}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast(`Buyer Client ${name} onboarded successfully!`, 'success');
    setIsAddClientOpen(false);
  };

  const getPropTitle = (id: string) => {
    return properties.find(p => p.id === id)?.title || 'Private Property Asset';
  };

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Rental & Entity Directories</h1>
          <p className="text-text-secondary text-lg">Onboard clients, manage property landlords, record rents, and enforce compliance workflows.</p>
        </div>
        {activeMgmtTab === 'tenants' && (
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
        )}
        {activeMgmtTab === 'landlords' && (
          <button 
            onClick={() => setIsAddLandlordOpen(true)} 
            className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full"
          >
            <UserPlus size={18} /> Add Landlord
          </button>
        )}
        {activeMgmtTab === 'clients' && (
          <button 
            onClick={() => setIsAddClientOpen(true)} 
            className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full"
          >
            <UserPlus size={18} /> Add Buyer Client
          </button>
        )}
      </div>

      {/* DYNAMIC MGMT TAB BAR */}
      <div className="flex border-b border-surface-border">
        {[
          { id: 'tenants', label: 'Tenants Directory', icon: <Users size={16} /> },
          { id: 'landlords', label: 'Landlords Registry', icon: <Briefcase size={16} /> },
          { id: 'clients', label: 'Buyer Clients', icon: <Sparkles size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMgmtTab(tab.id as any)}
            className={`py-3.5 px-6 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
              activeMgmtTab === tab.id
                ? 'border-vedama-emerald text-vedama-emerald bg-vedama-emerald/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeMgmtTab === 'tenants' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-slide-up">
            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card transition-all hover:shadow-card-lg hover:-translate-y-1">
              <div className="text-text-secondary font-semibold text-sm uppercase tracking-wider mb-2">Total Tenants</div>
              <div className="text-3xl font-heading font-bold text-vedama-emerald">{tenants.length}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-status-warning/20 shadow-card transition-all hover:shadow-card-lg hover:-translate-y-1">
              <div className="text-status-warning font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> In Arrears
              </div>
              <div className="text-3xl font-heading font-bold text-status-warning">{arrearsCount}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-status-danger/20 shadow-card transition-all hover:shadow-card-lg hover:-translate-y-1">
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

          <div className="card-static overflow-hidden animate-slide-up shadow-card mb-8">
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
                        <div className="flex items-center gap-3">
                          <img 
                            src={tenant.avatar || 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150'} 
                            alt={tenant.name} 
                            className="w-8 h-8 rounded-full object-cover border border-surface-border"
                          />
                          <div>
                            <div className="font-semibold text-text-primary text-sm">{tenant.name}</div>
                            <div className="text-[10px] text-text-muted mt-0.5">{tenant.phone} · {tenant.email || 'No Email'}</div>
                            {(tenant.landlordId || tenant.clientId) && (
                              <div className="flex flex-wrap gap-1 mt-1 text-[8px]">
                                {tenant.landlordId && (
                                  <span className="px-1.5 py-0.5 bg-vedama-emerald/10 text-vedama-emerald rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                                    <Landmark size={8} /> Landlord: {landlords.find(l => l.id === tenant.landlordId)?.name || tenant.landlordId}
                                  </span>
                                )}
                                {tenant.clientId && (
                                  <span className="px-1.5 py-0.5 bg-vedama-gold/15 text-vedama-gold-dark rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                                    <User size={8} /> Buyer Client: {clients.find(c => c.id === tenant.clientId)?.name || tenant.clientId}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
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
                      <td className="table-cell py-4 text-right space-x-2">
                        {tenant.balance > 0 && (
                          <button 
                            onClick={() => {
                              sendRentReminder(tenant.id);
                              addToast(`Rent warning notification served via WhatsApp to ${tenant.name}!`, 'success');
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-200 hover:border-transparent rounded-full font-bold text-[10px] transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <Mail size={10} /> Send Warning
                          </button>
                        )}
                        <button 
                          onClick={() => openPaymentModal(tenant)}
                          className="px-3 py-1.5 bg-vedama-emerald/10 hover:bg-vedama-emerald text-vedama-emerald hover:text-white rounded-full font-bold text-[10px] transition-colors inline-flex items-center gap-1 shadow-sm animate-pulse-slow"
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
            <div className="card-static p-6 border border-status-danger/20 rounded-3xl shadow-card animate-slide-up bg-red-50/10 mb-8">
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

              {/* Caretaker distress checklists */}
              <div className="mt-6 bg-white p-5 rounded-2xl border border-surface-border space-y-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  📋 Caretaker Distress & Pre-Eviction Legal Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-surface-bg border border-surface-border rounded-xl space-y-2">
                    <div className="font-bold text-vedama-emerald flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-vedama-emerald" /> Step 1: Warning Served
                    </div>
                    <p className="text-text-secondary text-[11px]">3-day pre-eviction alert served via automated WhatsApp warning notifications prior to lockout.</p>
                  </div>
                  <div className="p-4 bg-surface-bg border border-surface-border rounded-xl space-y-2">
                    <div className="font-bold text-vedama-emerald flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-vedama-emerald" /> Step 2: Site Audits
                    </div>
                    <p className="text-text-secondary text-[11px]">Caretaker site visit conducted to evaluate distress grounds and offer repayment restructuring terms.</p>
                  </div>
                  <div className="p-4 bg-surface-bg border border-surface-border rounded-xl space-y-2">
                    <div className="font-bold text-vedama-gold flex items-center gap-1.5 animate-pulse-slow">
                      <AlertTriangle size={14} className="text-vedama-gold" /> Step 3: Eviction Lockout
                    </div>
                    <p className="text-text-secondary text-[11px]">Eviction files dispatched to panel advocates strictly after physical warning notices fail to clear.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* LANDLORDS SUB-TAB */}
      {activeMgmtTab === 'landlords' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {landlords.map((landlord) => (
              <div key={landlord.id} className="bg-white p-6 rounded-3xl border border-surface-border shadow-card flex flex-col justify-between hover:shadow-card-lg transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={landlord.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                      alt={landlord.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-vedama-gold"
                    />
                    <div>
                      <h3 className="font-heading font-bold text-text-primary text-base">{landlord.name}</h3>
                      <span className="text-[10px] bg-vedama-gold/10 text-vedama-gold px-2 py-0.5 rounded-full font-bold uppercase">Landlord Partner</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-text-secondary border-t border-surface-border pt-3">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-text-muted" />
                      <span>{landlord.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-text-muted" />
                      <span>{landlord.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-text-muted" />
                      <span>{landlord.address || 'Limuru Road, Farm House 5, Kiambu'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] bg-surface-bg p-2 rounded-lg">
                      <Sparkles size={14} className="text-vedama-gold" />
                      <span>{landlord.otherInfo || 'ID No: 12345678, KRA PIN: A000123456Z'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-surface-border flex justify-between items-center text-xs">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase">Properties Owned</div>
                    <div className="font-bold text-text-primary text-sm">{properties.filter(p => p.landlordId === landlord.id).length} Assets</div>
                  </div>
                  <button 
                    onClick={() => addToast(`WhatsApp message notification sent to landlord ${landlord.name}!`, 'success')}
                    className="px-3 py-1.5 bg-vedama-emerald hover:bg-vedama-emerald-dark text-white rounded-full font-bold text-[10px] shadow-sm transition-all"
                  >
                    Send Statement Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUYER CLIENTS SUB-TAB */}
      {activeMgmtTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {clients.map((client) => (
              <div key={client.id} className="bg-white p-6 rounded-3xl border border-surface-border shadow-card flex flex-col justify-between hover:shadow-card-lg transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={client.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} 
                      alt={client.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-vedama-gold"
                    />
                    <div>
                      <h3 className="font-heading font-bold text-text-primary text-base">{client.name}</h3>
                      <span className="text-[10px] bg-vedama-emerald/10 text-vedama-emerald px-2 py-0.5 rounded-full font-bold uppercase">Buyer Client</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-text-secondary border-t border-surface-border pt-3">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-text-muted" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-text-muted" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-text-muted" />
                      <span>{client.address || 'Thika Greens, Villa 4B, Kiambu County'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] bg-surface-bg p-2 rounded-lg">
                      <Sparkles size={14} className="text-vedama-gold" />
                      <span>{client.otherInfo || 'ID No: 33445566, KRA PIN: A001234567Z'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-surface-border flex justify-between items-center text-xs">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase">Registered Date</div>
                    <div className="font-bold text-text-primary text-sm">{client.createdAt}</div>
                  </div>
                  <button 
                    onClick={() => addToast(`WhatsApp ledger message sent to buyer client ${client.name}!`, 'success')}
                    className="px-3 py-1.5 bg-vedama-emerald hover:bg-vedama-emerald-dark text-white rounded-full font-bold text-[10px] shadow-sm transition-all"
                  >
                    Send Ledger Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. ADD NEW TENANT MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Tenant Profile" size="md">
        <form className="space-y-5" onSubmit={handleAddTenant}>
          
          {/* Avatar Upload Preview & Selection */}
          <div className="flex flex-col items-center justify-center space-y-3 bg-surface-bg p-4 rounded-3xl border border-surface-border">
            <div className="relative group cursor-pointer">
              <img 
                src={addAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt="Tenant Avatar" 
                className="w-20 h-20 rounded-full object-cover border-4 border-vedama-gold shadow-md group-hover:opacity-85 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white w-5 h-5" />
              </div>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Profile Image Selection</span>
              <p className="text-[9px] text-text-secondary mt-0.5">Click any professional preset below or enter/upload custom photo</p>
            </div>
            
            {/* Presets Grid */}
            <div className="grid grid-cols-6 gap-2 w-full pt-1.5 border-t border-dashed">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
              ].map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAddAvatar(imgUrl)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${addAvatar === imgUrl ? 'border-vedama-emerald ring-2 ring-vedama-gold' : 'border-surface-border'}`}
                >
                  <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            {/* Custom Input / Local Uploader */}
            <div className="w-full flex gap-2">
              <input 
                type="text" 
                placeholder="Paste custom photo URL..."
                value={addAvatar}
                onChange={(e) => setAddAvatar(e.target.value)}
                className="input-field !py-1 text-[10px] flex-grow"
              />
              <label 
                className="px-3 py-2 bg-vedama-emerald hover:bg-vedama-emerald-dark text-white text-[8px] font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                Upload File
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setAddAvatar(reader.result);
                          addToast('Local profile image uploaded successfully!', 'success');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

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

            {/* Landlord and Client Linkages */}
            <div className="col-span-2 grid grid-cols-2 gap-4 bg-surface-bg p-3.5 rounded-xl border border-surface-border">
              <div>
                <label className="label font-bold text-text-primary uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1">
                  <Landmark size={12} className="text-vedama-gold" /> Link Landlord Partner
                </label>
                <select 
                  value={addLandlordId} 
                  onChange={(e) => setAddLandlordId(e.target.value)} 
                  className="input-field"
                >
                  <option value="">-- None (No Link) --</option>
                  {landlords.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label font-bold text-text-primary uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1">
                  <User size={12} className="text-vedama-gold" /> Link Buyer Client
                </label>
                <select 
                  value={addClientId} 
                  onChange={(e) => setAddClientId(e.target.value)} 
                  className="input-field"
                >
                  <option value="">-- None (No Link) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
          
          {/* Avatar Upload Preview & Selection */}
          <div className="flex flex-col items-center justify-center space-y-3 bg-surface-bg p-4 rounded-3xl border border-surface-border">
            <div className="relative group cursor-pointer">
              <img 
                src={editAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt="Tenant Avatar" 
                className="w-20 h-20 rounded-full object-cover border-4 border-vedama-gold shadow-md group-hover:opacity-85 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white w-5 h-5" />
              </div>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Profile Image Selection</span>
              <p className="text-[9px] text-text-secondary mt-0.5">Click any professional preset below or enter/upload custom photo</p>
            </div>
            
            {/* Presets Grid */}
            <div className="grid grid-cols-6 gap-2 w-full pt-1.5 border-t border-dashed">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
              ].map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEditAvatar(imgUrl)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${editAvatar === imgUrl ? 'border-vedama-emerald ring-2 ring-vedama-gold' : 'border-surface-border'}`}
                >
                  <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            {/* Custom Input / Local Uploader */}
            <div className="w-full flex gap-2">
              <input 
                type="text" 
                placeholder="Paste custom photo URL..."
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                className="input-field !py-1 text-[10px] flex-grow"
              />
              <label 
                className="px-3 py-2 bg-vedama-emerald hover:bg-vedama-emerald-dark text-white text-[8px] font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                Upload File
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setEditAvatar(reader.result);
                          addToast('Local profile image uploaded successfully!', 'success');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

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

            {/* Landlord and Client Linkages */}
            <div className="col-span-2 grid grid-cols-2 gap-4 bg-surface-bg p-3.5 rounded-xl border border-surface-border">
              <div>
                <label className="label font-bold text-text-primary uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1">
                  <Landmark size={12} className="text-vedama-gold" /> Link Landlord Partner
                </label>
                <select 
                  value={editLandlordId} 
                  onChange={(e) => setEditLandlordId(e.target.value)} 
                  className="input-field"
                >
                  <option value="">-- None (No Link) --</option>
                  {landlords.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label font-bold text-text-primary uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1">
                  <User size={12} className="text-vedama-gold" /> Link Buyer Client
                </label>
                <select 
                  value={editClientId} 
                  onChange={(e) => setEditClientId(e.target.value)} 
                  className="input-field"
                >
                  <option value="">-- None (No Link) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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

      {/* 4. ADD NEW LANDLORD MODAL */}
      <Modal isOpen={isAddLandlordOpen} onClose={() => setIsAddLandlordOpen(false)} title="Onboard New Landlord Partner" size="md">
        <form className="space-y-5" onSubmit={handleAddLandlord}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input name="name" type="text" className="input-field" placeholder="e.g. Peter Kamau" required />
            </div>
            <div className="col-span-1">
              <label className="label">Phone Number</label>
              <input name="phone" type="tel" className="input-field" placeholder="e.g. +254712345678" required />
            </div>
            <div className="col-span-1">
              <label className="label">Email Address</label>
              <input name="email" type="email" className="input-field" placeholder="e.g. pkamau@gmail.com" required />
            </div>
            <div className="col-span-2">
              <label className="label">Physical Address</label>
              <input name="address" type="text" className="input-field" placeholder="e.g. Limuru Road, Kiambu" />
            </div>
            <div className="col-span-2">
              <label className="label">Tax PIN & ID Details</label>
              <input name="otherInfo" type="text" className="input-field" placeholder="e.g. ID: 12345678, KRA PIN: A000123456Z" />
            </div>
            <div className="col-span-2">
              <label className="label">Profile Photo Preset URL</label>
              <select name="avatar" className="input-field">
                <option value="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150">Avatar Male 1</option>
                <option value="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150">Avatar Female 1</option>
                <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150">Avatar Male 2</option>
                <option value="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150">Avatar Female 2</option>
              </select>
            </div>
          </div>
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsAddLandlordOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Register Landlord</button>
          </div>
        </form>
      </Modal>

      {/* 5. ADD NEW CLIENT MODAL */}
      <Modal isOpen={isAddClientOpen} onClose={() => setIsAddClientOpen(false)} title="Onboard New Buyer Client" size="md">
        <form className="space-y-5" onSubmit={handleAddClient}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input name="name" type="text" className="input-field" placeholder="e.g. Benson Njoroge" required />
            </div>
            <div className="col-span-1">
              <label className="label">Phone Number</label>
              <input name="phone" type="tel" className="input-field" placeholder="e.g. +254722334455" required />
            </div>
            <div className="col-span-1">
              <label className="label">Email Address</label>
              <input name="email" type="email" className="input-field" placeholder="e.g. bnjoroge@gmail.com" required />
            </div>
            <div className="col-span-2">
              <label className="label">Physical Address</label>
              <input name="address" type="text" className="input-field" placeholder="e.g. Thika Greens, Villa 4B" />
            </div>
            <div className="col-span-2">
              <label className="label">Tax PIN & ID Details</label>
              <input name="otherInfo" type="text" className="input-field" placeholder="e.g. ID: 88776655, KRA PIN: A001234567Z" />
            </div>
            <div className="col-span-2">
              <label className="label">Profile Photo Preset URL</label>
              <select name="avatar" className="input-field">
                <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150">Avatar Male 1</option>
                <option value="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150">Avatar Female 1</option>
                <option value="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150">Avatar Male 2</option>
                <option value="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150">Avatar Female 2</option>
              </select>
            </div>
          </div>
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsAddClientOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Register Buyer Client</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
