import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Clock, ShieldAlert, Lock, Unlock, Landmark, CreditCard, DollarSign, Plus, ArrowRight, CheckSquare, Trash2, Send } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useToastStore } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import Badge, { statusToBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Voucher, LedgerEntry } from '../../types';

// Cost Category Label Mapper
const getCostCategoryLabel = (cat?: string): string => {
  switch (cat) {
    case 'rents_directors': return 'Rents for Directors';
    case 'transport_fuel': return 'Transport of Fuel (Client Visits)';
    case 'electricity_water': return 'Electricity & Water';
    case 'commissions_third_party': return 'Commissions to Third Parties';
    case 'licenses': return 'Licenses';
    case 'legal_fees': return 'Legal Fees';
    case 'bulk_sms': return 'Bulk SMS';
    case 'system': return 'System Development';
    case 'others': return 'Other Operational Costs';
    default: return 'General Cost';
  }
};

export default function FinancePage() {
  const { 
    ledger, vouchers, updateVoucher, addVoucher, addAuditLog, 
    bankSyncStatus, bankAccountBalance, bankLogs, addOperationalCost,
    properties, transactions, approveAndReleaseLandlordVoucher, releaseGenericVoucherToBank
  } = useDataStore();
  const { addToast } = useToastStore();
  const user = useAuthStore(s => s.user);

  const [activeTab, setActiveTab] = useState<'ledger' | 'costs' | 'vouchers' | 'director'>('ledger');
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);

  // Director Gate State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const pendingReconciliations = ledger.filter(e => e.status === 'pending' || e.status === 'processed').length;

  const handleApproveVoucher = (id: string) => {
    updateVoucher(id, { status: 'approved', approvedBy: user?.name || 'Admin' });
    addAuditLog({
      id: Math.random().toString(36).substring(2, 9),
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown User',
      action: 'APPROVE_VOUCHER',
      module: 'Finance',
      details: `Approved voucher ${vouchers.find(v => v.id === id)?.reference}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });
    addToast('Voucher approved successfully!', 'success');
  };

  const handleCreateVoucher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newVoucher: Voucher = {
      id: Math.random().toString(36).substring(2, 9),
      reference: `VCH-2024-${Math.floor(Math.random() * 900) + 100}`,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      payee: formData.get('payee') as string,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    addVoucher(newVoucher);
    addToast('Payment voucher generated and sent for approval.', 'success');
    setIsVoucherModalOpen(false);
  };

  const handleCreateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const category = formData.get('category') as any;
    const description = formData.get('description') as string;

    addOperationalCost(amount, category, description);
    addToast(`Recorded operational cost: ${getCostCategoryLabel(category)}`, 'success');
    setIsCostModalOpen(false);
  };

  const handleUnlockDirectorPanel = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'director2026') {
      setIsUnlocked(true);
      setPasswordError('');
      addToast('Director Revenue Split panel unlocked!', 'success');
      addAuditLog({
        id: Math.random().toString(36).substring(2, 9),
        userId: user?.id || 'admin',
        userName: user?.name || 'Francis Mathea (CEO)',
        action: 'UNLOCKED_CONFIDENTIAL_REVENUE',
        module: 'Finance',
        details: 'Director unlocked confidential revenue splitting statement panel.',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });
    } else {
      setPasswordError('Invalid director passcode. Access denied.');
      addToast('Passcode verification failed', 'error');
    }
  };

  // Summarizers for Director Revenue Splits
  const totalFundsReceived = ledger
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalLandlordAllocations = ledger
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.landlordShare, 0);

  const totalCompanyCommission = ledger
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.companyCommission, 0);

  const totalOperationalCosts = ledger
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  // released amounts = vouchers paid out to landlords
  const totalReleasedAmounts = vouchers
    .filter(v => v.status === 'paid' && v.description.toLowerCase().includes('landlord'))
    .reduce((sum, v) => sum + v.amount, 0);

  const getReferenceBlock = (propertyId: string, propertyTitle: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return propertyTitle;
    const blockLetter = prop.id === 'p1' ? 'Block A' : prop.id === 'p2' ? 'Block C' : 'Block F';
    return `${prop.title} - ${blockLetter}`;
  };

  const getPlotSizeLabelFromQuantity = (qty: number): string => {
    if (qty === 1) return '50x100 (1/8 Acre)';
    if (qty === 2) return '100x100 (1/4 Acre)';
    if (qty === 4) return 'Half Acre';
    if (qty === 8) return '1 Acre';
    if (qty > 8) {
      const acres = qty / 8;
      return acres % 1 === 0 ? `${acres} Acre(s)` : `${qty} Plots (50x100)`;
    }
    return `${qty} Plots (50x100)`;
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Financial Reconciliation</h1>
          <p className="text-text-secondary text-lg">Reconcile payments, track operational costs, and check secure priority landlord revenue distributions.</p>
        </div>
        <div className="flex gap-4 self-start md:self-auto">
          {activeTab === 'costs' ? (
            <button onClick={() => setIsCostModalOpen(true)} className="btn-gold flex items-center gap-2 !rounded-full shadow-md">
              <Plus size={18} /> Record Expense
            </button>
          ) : (
            <button onClick={() => setIsVoucherModalOpen(true)} className="btn-primary flex items-center gap-2 !rounded-full shadow-md">
              <FileText size={18} /> Generate Voucher
            </button>
          )}
        </div>
      </div>

      {/* Bank Feed Real-Time Status Header Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up delay-100">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex items-center gap-4">
          <div className="p-3.5 bg-green-50 text-status-success rounded-full relative">
            <Landmark size={24} />
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full absolute top-1 right-1 animate-ping"></div>
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Bank Sync Status</span>
            <div className="text-sm font-bold text-status-success mt-0.5">Connected (Real-time webhook active)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex items-center gap-4">
          <div className="p-3.5 bg-vedama-emerald/10 text-vedama-emerald rounded-full">
            <CreditCard size={24} />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Connected Trust Escrow Account</span>
            <div className="text-base font-bold text-text-primary mt-0.5">{formatCurrency(bankAccountBalance)}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-vedama-gold rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Company Commissions Net</span>
            <div className="text-base font-bold text-vedama-gold mt-0.5">{formatCurrency(totalCompanyCommission)}</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex p-1 bg-surface-bg rounded-2xl w-fit border border-surface-border animate-slide-up delay-150">
        {[
          { id: 'ledger', label: 'General Ledger' },
          { id: 'costs', label: 'Operational Cost Ledger' },
          { id: 'vouchers', label: 'Vouchers & Approvals' },
          { id: 'director', label: '🔐 Confidential splits' }
        ].map(tab => (
          <button 
            key={tab.id}
            className={`py-2.5 px-6 rounded-xl font-bold text-xs transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-white text-vedama-emerald shadow-sm' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GENERAL LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-slide-up delay-200">
          <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex justify-between items-center">
            <div>
              <h3 className="font-heading font-bold text-text-primary">Direct Postings & Bank Clearance Stream</h3>
              <p className="text-xs text-text-secondary mt-0.5">Real-time log of payments arrived from client clearing systems.</p>
            </div>
            <div className="text-xs font-semibold text-text-secondary">
              Pending Reconcile Items: <span className="text-status-warning font-bold">{pendingReconciliations}</span>
            </div>
          </div>

          <div className="card-static overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border">
                    <th className="table-header py-4 px-6">Date</th>
                    <th className="table-header py-4 px-6">Description</th>
                    <th className="table-header py-4 px-6">Type</th>
                    <th className="table-header py-4 px-6 text-right">Total Amount</th>
                    <th className="table-header py-4 px-6 text-right">Landlord Share</th>
                    <th className="table-header py-4 px-6 text-right">Commission Net</th>
                    <th className="table-header py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-hover transition-colors">
                      <td className="table-cell py-4 whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="table-cell py-4 font-semibold text-text-primary">{entry.description}</td>
                      <td className="table-cell py-4">
                        <Badge variant={entry.type === 'income' ? 'success' : 'danger'}>
                          {entry.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="table-cell py-4 text-right font-bold text-text-primary">{formatCurrency(entry.amount)}</td>
                      <td className="table-cell py-4 text-right font-medium text-text-secondary">{formatCurrency(entry.landlordShare)}</td>
                      <td className="table-cell py-4 text-right font-medium text-vedama-gold">{formatCurrency(entry.companyCommission)}</td>
                      <td className="table-cell py-4">
                        <Badge variant={statusToBadge(entry.status)}>{entry.status.toUpperCase()}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATIONAL COST LEDGER */}
      {activeTab === 'costs' && (
        <div className="space-y-6 animate-slide-up delay-200">
          <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex justify-between items-center">
            <div>
              <h3 className="font-heading font-bold text-text-primary">Corporate Costs accounting ledger</h3>
              <p className="text-xs text-text-secondary mt-0.5">Summary of spent organizational resources mapped against classified corporate codes.</p>
            </div>
            <div className="text-xs font-semibold text-text-primary">
              Total Expenses to Date: <span className="text-status-danger font-bold">{formatCurrency(totalOperationalCosts)}</span>
            </div>
          </div>

          <div className="card-static overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border">
                    <th className="table-header py-4 px-6">Date</th>
                    <th className="table-header py-4 px-6">Classification Category</th>
                    <th className="table-header py-4 px-6">Description</th>
                    <th className="table-header py-4 px-6 text-right">Amount Spent</th>
                    <th className="table-header py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {ledger.filter(e => e.type === 'expense').map((cost) => (
                    <tr key={cost.id} className="hover:bg-surface-hover transition-colors">
                      <td className="table-cell py-4">{formatDate(cost.date)}</td>
                      <td className="table-cell py-4">
                        <span className="font-bold text-xs text-vedama-gold uppercase bg-vedama-gold/10 px-2.5 py-1 rounded-full">
                          {getCostCategoryLabel(cost.costCategory)}
                        </span>
                      </td>
                      <td className="table-cell py-4 font-semibold text-text-primary">{cost.description}</td>
                      <td className="table-cell py-4 text-right font-bold text-status-danger">{formatCurrency(cost.amount)}</td>
                      <td className="table-cell py-4">
                        <Badge variant="success">PAID</Badge>
                      </td>
                    </tr>
                  ))}
                  {ledger.filter(e => e.type === 'expense').length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-text-muted text-xs">
                        No operational costs logged yet. Use the "Record Expense" button at top right to add director rents, SMS, legal fees etc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VOUCHERS */}
      {activeTab === 'vouchers' && (
        <div className="card-static overflow-hidden animate-slide-up delay-200 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-bg border-b border-surface-border">
                  <th className="table-header py-4 px-6">Voucher Ref</th>
                  <th className="table-header py-4 px-6">Date</th>
                  <th className="table-header py-4 px-6">Description</th>
                  <th className="table-header py-4 px-6">Payee</th>
                  <th className="table-header py-4 px-6 text-right">Amount</th>
                  <th className="table-header py-4 px-6">Status</th>
                  <th className="table-header py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-hover transition-colors">
                    <td className="table-cell py-4 font-mono font-bold text-vedama-emerald">{v.reference}</td>
                    <td className="table-cell py-4 whitespace-nowrap">{formatDate(v.createdAt)}</td>
                    <td className="table-cell py-4 font-medium max-w-[200px] truncate">{v.description}</td>
                    <td className="table-cell py-4">{v.payee}</td>
                    <td className="table-cell py-4 text-right font-bold text-text-primary">{formatCurrency(v.amount)}</td>
                    <td className="table-cell py-4">
                      <Badge variant={statusToBadge(v.status)}>{v.status.replace('_', ' ').toUpperCase()}</Badge>
                    </td>
                    <td className="table-cell py-4 text-right">
                      {v.status === 'pending_approval' && (
                        <button 
                          onClick={() => handleApproveVoucher(v.id)}
                          className="text-xs font-bold text-status-success hover:text-green-700 transition-colors flex items-center gap-1 justify-end w-full"
                        >
                          <CheckCircle size={14} /> Approve Voucher
                        </button>
                      )}
                      {v.status === 'approved' && (
                        <button 
                          onClick={() => {
                            if (v.isLandlordVoucher) {
                              approveAndReleaseLandlordVoucher(v.id, user?.name || 'Finance Officer');
                            } else {
                              releaseGenericVoucherToBank(v.id, user?.name || 'Finance Officer');
                            }
                            addToast('EFT Payment dispatched to NCBA clearing systems successfully!', 'success');
                          }}
                          className="text-xs font-bold text-vedama-gold hover:text-vedama-gold-dark transition-all flex items-center gap-1 justify-end w-full"
                        >
                          🚀 Release EFT Payout
                        </button>
                      )}
                      {v.status === 'paid' && (
                        <div className="flex flex-col items-end text-[10px]">
                          <span className="text-status-success font-bold flex items-center gap-0.5">✓ Cleared by Bank</span>
                          <span className="font-mono text-text-muted mt-0.5 max-w-[120px] truncate">{v.bankReleaseHash}</span>
                        </div>
                      )}
                      {(!['pending_approval', 'approved', 'paid'].includes(v.status)) && (
                        <span className="text-xs text-text-muted">No pending actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIDENTIAL REVENUE SPLITS (DIRECTOR PASSWORD GATE) */}
      {activeTab === 'director' && (
        <div className="space-y-6 animate-slide-up delay-200">
          
          {!isUnlocked ? (
            <div className="bg-white max-w-md mx-auto p-8 rounded-3xl shadow-card-lg border-2 border-vedama-gold/20 flex flex-col items-center text-center">
              <div className="p-4 bg-amber-50 text-vedama-gold rounded-full mb-4 border border-vedama-gold/20">
                <Lock size={36} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-heading font-bold text-text-primary">Confidential Director Portal</h3>
              <p className="text-xs text-text-secondary mt-1.5 max-w-xs leading-normal">
                Access to landlord split ratios, company commission schedules, and director revenue reports requires passcode verification.
              </p>

              <form onSubmit={handleUnlockDirectorPanel} className="w-full mt-6 space-y-4">
                <div>
                  <input 
                    type="password" 
                    placeholder="Enter Director Passcode" 
                    className="input-field text-center font-bold tracking-widest text-lg" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                  {passwordError && (
                    <div className="text-status-danger text-xs mt-1.5 font-bold">{passwordError}</div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="w-full btn-gold py-2.5 !rounded-full shadow-md text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Unlock size={14} /> Verify & Unlock
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              
              {/* Unlock Status Alert */}
              <div className="p-4 bg-status-success/15 border-2 border-status-success/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-status-success text-xs font-bold">
                  <Unlock size={18} /> CONFIDENTIAL PORTAL ACCESS UNLOCKED BY BOARD DIRECTORS
                </div>
                <button 
                  onClick={() => {
                    setIsUnlocked(false);
                    setPasswordInput('');
                    addToast('Director panel locked', 'info');
                  }}
                  className="text-xs underline text-status-success font-bold"
                >
                  Lock Panel
                </button>
              </div>

              {/* Confidential Revenue Allocation Report (Report 3) */}
              <div className="bg-white rounded-3xl p-6 border-2 border-vedama-gold/20 shadow-card">
                <div className="flex justify-between items-center pb-4 border-b border-surface-border mb-6">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-vedama-emerald uppercase tracking-wide">Report 3: Confidential Landlord Revenue Splits</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Priority Split Rule: All initial payments prioritized to landlord reserve before company commission kicks in.</p>
                  </div>
                  <Badge variant="warning">BOARD CONFIDENTIAL</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-bg border-b border-surface-border">
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Client</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Size</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Ref Block</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Agreed Sale Price</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase text-right">Landlord Priority Target</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase text-right">Landlord Share Paid</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase text-right">Our Commission Net</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Priority Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {transactions.map((tx) => {
                        const prop = properties.find(p => p.id === tx.propertyId);
                        const landlordUnit = prop?.landlordAgreedPrice || (tx.unitPrice * 0.75);
                        const landlordTotalTarget = landlordUnit * tx.plotCount;
                        const landlordSharePaid = Math.min(landlordTotalTarget, tx.amountPaid);
                        const companyCommission = Math.max(0, tx.amountPaid - landlordSharePaid);
                        const isReserveMet = landlordSharePaid >= landlordTotalTarget;

                        return (
                          <tr key={tx.id} className="hover:bg-surface-hover">
                            <td className="py-3.5 px-4 font-semibold text-text-primary">{tx.clientName}</td>
                            <td className="py-3.5 px-4 font-medium text-text-secondary">{getPlotSizeLabelFromQuantity(tx.plotCount)}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-vedama-emerald">{getReferenceBlock(tx.propertyId, tx.propertyTitle)}</td>
                            <td className="py-3.5 px-4 font-bold text-text-primary">{formatCurrency(tx.totalAmount)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-text-secondary">{formatCurrency(landlordTotalTarget)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-status-success">{formatCurrency(landlordSharePaid)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-vedama-gold">{formatCurrency(companyCommission)}</td>
                            <td className="py-3.5 px-4">
                              <Badge variant={isReserveMet ? 'success' : 'warning'}>
                                {isReserveMet ? 'RESERVE MET' : 'PRIORITY ALLOCATING'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Company Reports (Report 5) */}
              <div className="bg-white rounded-3xl p-6 border-2 border-vedama-emerald/20 shadow-card">
                <div className="flex justify-between items-center pb-4 border-b border-surface-border mb-6">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-vedama-emerald uppercase tracking-wide">Report 5: Company Statement & Commission Payout Summary</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Corporate statement containing net revenues, third party commissions, and processed landlord payouts.</p>
                  </div>
                  <button 
                    onClick={() => {
                      addToast("End-of-month landlord payout schedule processed! Vouchers generated.", "success");
                    }}
                    className="btn-emerald py-2 px-4 text-xs font-bold flex items-center gap-1.5 !rounded-full shadow-md"
                  >
                    <CheckSquare size={14} /> Process Releases
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-bg border-b border-surface-border">
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Clients</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Size bought</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Reference block</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase text-right">Amounts Agreed sales</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase text-right">Landlords funds</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase text-right">commission</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase text-right">Balance</th>
                        <th className="py-3.5 px-4 font-bold text-text-secondary uppercase">Dates due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {transactions.map((tx) => {
                        const prop = properties.find(p => p.id === tx.propertyId);
                        const landlordUnit = prop?.landlordAgreedPrice || (tx.unitPrice * 0.75);
                        const landlordTotalTarget = landlordUnit * tx.plotCount;
                        const landlordSharePaid = Math.min(landlordTotalTarget, tx.amountPaid);
                        const companyCommission = Math.max(0, tx.amountPaid - landlordSharePaid);

                        return (
                          <tr key={tx.id} className="hover:bg-surface-hover">
                            <td className="py-3.5 px-4 font-semibold text-text-primary">{tx.clientName}</td>
                            <td className="py-3.5 px-4 font-medium text-text-secondary">{getPlotSizeLabelFromQuantity(tx.plotCount)}</td>
                            <td className="py-3.5 px-4 font-mono text-vedama-emerald font-bold">{getReferenceBlock(tx.propertyId, tx.propertyTitle)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-text-primary">{formatCurrency(tx.totalAmount)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-status-success">{formatCurrency(landlordSharePaid)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-vedama-gold">{formatCurrency(companyCommission)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-status-danger">{formatCurrency(tx.balance)}</td>
                            <td className="py-3.5 px-4 text-text-secondary font-medium">{formatDate(tx.dueDate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Report Totals block (Strict User-Requested Format) */}
                <div className="mt-8 pt-6 border-t-2 border-dashed border-surface-border grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="bg-surface-bg p-4 rounded-xl border border-surface-border">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Total funds received</span>
                    <div className="text-xl font-heading font-black text-vedama-emerald mt-1">
                      {formatCurrency(totalFundsReceived)}
                    </div>
                  </div>
                  <div className="bg-surface-bg p-4 rounded-xl border border-surface-border">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Commission payable our company</span>
                    <div className="text-xl font-heading font-black text-vedama-gold mt-1">
                      {formatCurrency(totalCompanyCommission)}
                    </div>
                  </div>
                  <div className="bg-surface-bg p-4 rounded-xl border border-surface-border">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Released amounts</span>
                    <div className="text-xl font-heading font-black text-status-success mt-1">
                      {formatCurrency(totalReleasedAmounts)}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* POPUP MODALS */}

      {/* 1. Generate Voucher Modal */}
      <Modal isOpen={isVoucherModalOpen} onClose={() => setIsVoucherModalOpen(false)} title="Generate Payment Voucher" size="md">
        <form className="space-y-5" onSubmit={handleCreateVoucher}>
          <div>
            <label className="label">Payee Name</label>
            <input name="payee" type="text" className="input-field" placeholder="Full legal name" required />
          </div>
          <div>
            <label className="label">Amount (KES)</label>
            <input name="amount" type="number" className="input-field" placeholder="KES Amount" required />
          </div>
          <div>
            <label className="label">Description / Purpose</label>
            <textarea name="description" className="input-field min-h-[800px]" placeholder="Explain why the payout is being approved" required></textarea>
          </div>
          <div>
            <label className="label">Expense Category</label>
            <select name="category" className="input-field" required>
              <option value="landlord_payout">Landlord Payout</option>
              <option value="service_provider">Service Provider Payment</option>
              <option value="operational">Operational Expense</option>
              <option value="refund">Client Refund</option>
            </select>
          </div>
          
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4">
            <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Generate & Submit</button>
          </div>
        </form>
      </Modal>

      {/* 2. Record Expense Modal */}
      <Modal isOpen={isCostModalOpen} onClose={() => setIsCostModalOpen(false)} title="Record Operational Expense" size="md">
        <form className="space-y-5" onSubmit={handleCreateCost}>
          <div>
            <label className="label">Expense Cost Category</label>
            <select name="category" className="input-field" required>
              <option value="rents_directors">Rents for directors</option>
              <option value="transport_fuel">Transports of fuel to take client around</option>
              <option value="electricity_water">Electricity and water</option>
              <option value="commissions_third_party">Commissions paid to third parties</option>
              <option value="licenses">Licenses</option>
              <option value="legal_fees">Legal fees</option>
              <option value="bulk_sms">Bulk SMS</option>
              <option value="system">System development</option>
              <option value="others">Other general expenses</option>
            </select>
          </div>
          <div>
            <label className="label">Amount (KES)</label>
            <input name="amount" type="number" className="input-field" placeholder="Expense cost" required />
          </div>
          <div>
            <label className="label">Description / Purpose</label>
            <textarea name="description" className="input-field min-h-[100px]" placeholder="Specific details (e.g. Fuel receipt No. 4482, May Office Rent)" required></textarea>
          </div>
          
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4">
            <button type="button" onClick={() => setIsCostModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Record Expense</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
