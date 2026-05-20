import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, DollarSign, Wrench, CheckCircle, Landmark, ShieldAlert, Award, FileText, AlertTriangle, Key } from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useAuthStore } from '../stores/authStore';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';
import { useDataStore } from '../stores/dataStore';
import { useToastStore } from '../components/ui/Toast';
import { formatCurrency, formatDate } from '../lib/utils';
import Badge, { statusToBadge } from '../components/ui/Badge';

export default function LandlordPortal() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const { 
    properties, 
    transactions, 
    vouchers, 
    tenants, 
    serviceRequests, 
    updateServiceRequest, 
    confirmWorkCompletion 
  } = useDataStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'maintenance' | 'vouchers'>('overview');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Resolve landlord properties owned by Peter Kamau (l1)
  const myProperties = properties.filter(p => p.id === 'p1' || p.id === 'p2' || p.id === 'prop1' || p.id === 'prop2');
  const myPropertyIds = myProperties.map(p => p.id);

  // Filter tenants and transactions
  const myTenants = tenants.filter(t => myPropertyIds.includes(t.propertyId));
  const myTransactions = transactions.filter(t => myPropertyIds.includes(t.propertyId));

  // Sales totals
  const totalRevenue = myTransactions.reduce((sum, t) => {
    const landlordUnit = properties.find(p => p.id === t.propertyId)?.landlordAgreedPrice || (t.unitPrice * 0.75);
    const landlordTotalTarget = landlordUnit * t.plotCount;
    return sum + Math.min(landlordTotalTarget, t.amountPaid);
  }, 0);

  const pendingPayout = myTransactions.reduce((sum, t) => {
    const landlordUnit = properties.find(p => p.id === t.propertyId)?.landlordAgreedPrice || (t.unitPrice * 0.75);
    const landlordTotalTarget = landlordUnit * t.plotCount;
    const paidToLandlordSoFar = Math.min(landlordTotalTarget, t.amountPaid);
    return sum + (landlordTotalTarget - paidToLandlordSoFar);
  }, 0);

  // Filter service requests for Peter Kamau's properties
  const myServiceRequests = serviceRequests.filter(r => myPropertyIds.includes(r.propertyId));

  // Filter my payout vouchers (payee Peter Kamau)
  const myVouchers = vouchers.filter(v => v.payee === 'Peter Kamau');

  // Any tenant in distress status?
  const distressTenants = myTenants.filter(t => t.status === 'distress');

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

  const getReferenceBlock = (propertyId: string, propertyTitle: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return propertyTitle;
    const blockLetter = prop.id === 'p1' || prop.id === 'prop1' ? 'Block A' : 'Block C';
    return `${prop.title} - ${blockLetter}`;
  };

  const handleApproveRepair = (id: string, cost: number) => {
    updateServiceRequest(id, { 
      status: 'approved',
      approvedBy: 'Peter Kamau (Landlord)',
      updatedAt: new Date().toISOString().split('T')[0]
    });
    addToast(`Repair estimate of ${formatCurrency(cost)} approved. Provider has been instructed.`, 'success');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      
      {/* Top Navbar */}
      <nav className="bg-vedama-emerald border-b border-vedama-emerald-dark px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between sticky top-0 z-50">
        <Logo variant="light" size="md" />
        <div className="flex items-center gap-4 text-white">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
            <Bell size={20} />
            {distressTenants.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-danger rounded-full animate-pulse"></span>
            )}
          </button>
          <div className="h-8 w-px bg-white/20 mx-2"></div>
          <div className="hidden sm:flex flex-col items-end mr-4">
            <span className="text-sm font-bold text-white">Peter Kamau</span>
            <span className="text-xs text-vedama-gold">Landlord Portal</span>
          </div>

          <button 
            onClick={() => setIsChangePasswordOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Change Password"
          >
            <Key size={18} /> <span className="hidden sm:inline">Change Password</span>
          </button>
          
          <div className="h-8 w-px bg-white/20 mx-1"></div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Distress Tenant Warning Banner */}
        {distressTenants.map(t => (
          <div key={t.id} className="mb-6 p-4 bg-red-50 border border-status-danger/30 rounded-2xl flex items-start gap-3 shadow-sm animate-bounce-slow">
            <AlertTriangle className="text-status-danger mt-0.5 shrink-0" size={20} />
            <div>
              <h4 className="text-xs font-bold text-status-danger">⚖️ LEGAL ADVOCACY ROUTING WARNING: 2+ MONTH ARREARS DUE</h4>
              <p className="text-[11px] text-text-primary mt-1 leading-normal">
                Your tenant <strong>{t.name}</strong> (Unit {t.unitNumber}) of <strong>{myProperties.find(p => p.id === t.propertyId)?.title || 'Thika Greens'}</strong> has fallen due for 2 months unpaid with a balance of <strong>{formatCurrency(t.balance)}</strong>. 
                The system has automatically raised and dispatched a distress note to <strong>Muriuki & Partners Advocates</strong> to issue a distress warrant.
              </p>
            </div>
          </div>
        ))}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-primary">Landlord Dashboard</h1>
            <p className="text-text-secondary text-sm">Track tenant leases, action repair quote approvals, and view bank payout clearances.</p>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="text-text-secondary font-semibold text-xs uppercase tracking-wider">Total Sales Inflow</div>
              <div className="p-2 bg-green-50 text-status-success rounded-lg"><DollarSign size={20} /></div>
            </div>
            <div className="text-2xl font-heading font-bold text-text-primary">{formatCurrency(totalRevenue)}</div>
            <div className="text-[10px] text-text-muted mt-2">Accrued land investment sales</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="text-text-secondary font-semibold text-xs uppercase tracking-wider">My Active Leases</div>
              <div className="p-2 bg-status-info-bg text-status-info rounded-lg"><Landmark size={20} /></div>
            </div>
            <div className="text-2xl font-heading font-bold text-text-primary">{myTenants.length} Tenants</div>
            <div className="text-[10px] text-text-muted mt-2">Malindi Oceanview & Thika Greens Units</div>
          </div>

          <div className="bg-vedama-gold/10 p-6 rounded-2xl border border-vedama-gold/30 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="text-vedama-gold-dark font-semibold text-xs uppercase tracking-wider">Accrued Reserve Remaining</div>
              <div className="p-2 bg-white/50 text-vedama-gold-dark rounded-lg"><DollarSign size={20} /></div>
            </div>
            <div className="text-2xl font-heading font-bold text-vedama-gold-dark">{formatCurrency(pendingPayout)}</div>
            <div className="text-[10px] text-vedama-gold-dark/80 mt-2">Subject to installments clearances</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-surface-border mb-6">
          <button 
            className={`py-3 px-6 font-semibold text-xs transition-colors ${
              activeTab === 'overview' 
                ? 'text-vedama-emerald border-b-2 border-vedama-emerald bg-surface-hover/50 font-bold' 
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Tenants & Leases
          </button>
          
          <button 
            className={`py-3 px-6 font-semibold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales' 
                ? 'text-vedama-emerald border-b-2 border-vedama-emerald bg-surface-hover/50 font-bold' 
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('sales')}
          >
            <Landmark size={14} /> Report 4: Sales & Lienholding
          </button>

          <button 
            className={`py-3 px-6 font-semibold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'maintenance' 
                ? 'text-vedama-emerald border-b-2 border-vedama-emerald bg-surface-hover/50 font-bold' 
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('maintenance')}
          >
            <Wrench size={14} /> Repairs & Approvals
          </button>

          <button 
            className={`py-3 px-6 font-semibold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'vouchers' 
                ? 'text-vedama-emerald border-b-2 border-vedama-emerald bg-surface-hover/50 font-bold' 
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('vouchers')}
          >
            <FileText size={14} /> Monthly Payout Vouchers
          </button>
        </div>

        {/* TAB 1: TENANTS OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-sm border border-surface-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border">
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Tenant</th>
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Unit</th>
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Rent (KES)</th>
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Outstanding Balance</th>
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs">
                  {myTenants.map(t => (
                    <tr key={t.id} className="hover:bg-surface-hover">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-text-primary">{t.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">Lease ends: {formatDate(t.leaseEnd)}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm">{t.unitNumber}</td>
                      <td className="py-4 px-6 font-medium">{formatCurrency(t.rentAmount)}</td>
                      <td className="py-4 px-6">
                        <span className={`font-semibold ${t.balance > 0 ? 'text-status-danger' : 'text-text-muted'}`}>
                          {t.balance > 0 ? formatCurrency(t.balance) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={statusToBadge(t.status)}>{t.status.toUpperCase()}</Badge>
                      </td>
                    </tr>
                  ))}
                  {myTenants.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-text-muted">No active tenants found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LIENHOLDING BANK STATEMENT */}
        {activeTab === 'sales' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white border-2 border-vedama-gold/20 rounded-3xl p-6 shadow-card flex flex-col md:flex-row gap-6 items-stretch">
              <div className="md:w-1/3 bg-amber-50/50 p-5 rounded-2xl border border-vedama-gold/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-vedama-gold font-bold text-xs uppercase tracking-wider mb-3">
                    <ShieldAlert size={16} /> Certified Bank Charge
                  </div>
                  <h4 className="text-base font-heading font-bold text-text-primary">Lienholding Bank Statement</h4>
                  <p className="text-[11px] text-text-secondary leading-normal mt-1.5">
                    This land development asset is held under active custody charge by KCB Bank Kenya as Lienholder. All sale proceeds are funneled directly into KCB Escrow Trust Account.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-vedama-gold/20 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-text-secondary text-[10px]">Lienholder Bank:</span>
                    <span className="text-text-primary">KCB Bank Kenya Ltd</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-1">
                    <span className="text-text-secondary text-[10px]">Charge status:</span>
                    <span className="text-status-success flex items-center gap-1 font-bold">● ACTIVE & COMPLIANT</span>
                  </div>
                </div>
              </div>

              <div className="flex-grow space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-bg border border-surface-border rounded-xl">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Charge Trustee Ref</span>
                    <div className="font-mono font-bold text-sm text-text-primary mt-1">KCB-LIEN-T9982</div>
                  </div>
                  <div className="p-4 bg-surface-bg border border-surface-border rounded-xl">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Lien Security Reserve</span>
                    <div className="font-bold text-sm text-text-primary mt-1">KES 25,000,000</div>
                  </div>
                  <div className="p-4 bg-surface-bg border border-surface-border rounded-xl col-span-2 md:col-span-1">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Trustee Escrow A/C</span>
                    <div className="font-mono font-bold text-sm text-vedama-emerald mt-1">NCBA-012239401</div>
                  </div>
                </div>
                <div className="p-4 bg-vedama-emerald/[0.02] border border-vedama-emerald/20 rounded-2xl flex items-center gap-3">
                  <Award className="text-vedama-emerald shrink-0" size={24} />
                  <p className="text-[11px] text-text-secondary leading-normal">
                    <strong>Automatic Split Payout:</strong> Payout releases to KCB Escrow flow seamlessly until Peter Kamau reaches the reserve minimum required. Francis Mathea's board commission splits are fully prioritized thereafter.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-surface-border overflow-hidden shadow-card">
              <div className="p-5 border-b border-surface-border flex justify-between items-center">
                <div>
                  <h3 className="font-heading font-bold text-text-primary">Report 4: Landlord Sales Portal Statement</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Live roster of client sales and transaction balance metrics on your land tracts.</p>
                </div>
                <Badge variant="success">READY FOR RELEASE</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-bg border-b border-surface-border">
                      <th className="py-4 px-6 font-bold text-text-secondary uppercase">Clients</th>
                      <th className="py-4 px-6 font-bold text-text-secondary uppercase">Size bought</th>
                      <th className="py-4 px-6 font-bold text-text-secondary uppercase">Reference block</th>
                      <th className="py-4 px-6 font-bold text-text-secondary uppercase text-right">Amount agreed to sell</th>
                      <th className="py-4 px-6 font-bold text-text-secondary uppercase text-right">Paid amount</th>
                      <th className="py-4 px-6 font-bold text-text-secondary uppercase text-right">Balance due</th>
                      <th className="py-4 px-6 font-bold text-text-secondary uppercase">Dates due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {myTransactions.map(tx => {
                      const prop = properties.find(p => p.id === tx.propertyId);
                      const landlordUnit = prop?.landlordAgreedPrice || (tx.unitPrice * 0.75);
                      const agreedToSell = landlordUnit * tx.plotCount;
                      const paidToLandlord = Math.min(agreedToSell, tx.amountPaid);
                      const landlordBalance = Math.max(0, agreedToSell - paidToLandlord);

                      return (
                        <tr key={tx.id} className="hover:bg-surface-hover">
                          <td className="py-4 px-6 font-semibold text-text-primary">{tx.clientName}</td>
                          <td className="py-4 px-6 font-medium text-text-secondary">{getPlotSizeLabelFromQuantity(tx.plotCount)}</td>
                          <td className="py-4 px-6 font-mono font-bold text-vedama-emerald">{getReferenceBlock(tx.propertyId, tx.propertyTitle)}</td>
                          <td className="py-4 px-6 text-right font-bold text-text-primary">{formatCurrency(agreedToSell)}</td>
                          <td className="py-4 px-6 text-right font-bold text-status-success">{formatCurrency(paidToLandlord)}</td>
                          <td className="py-4 px-6 text-right font-bold text-status-danger">{formatCurrency(landlordBalance)}</td>
                          <td className="py-4 px-6 text-text-secondary font-medium">{formatDate(tx.dueDate)}</td>
                        </tr>
                      );
                    })}
                    {myTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-text-muted font-semibold">
                          No properties sold under your landlord account yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MAINTENANCE REPAIRS & APPROVALS */}
        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-border">
              <h3 className="font-heading font-bold text-text-primary">Interactive Repair Approvals & Confirmations</h3>
              <p className="text-xs text-text-secondary mt-0.5">Approve contractor estimates or confirm work completion for your properties.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border text-text-secondary uppercase">
                    <th className="py-4 px-6 font-bold">Request / Date</th>
                    <th className="py-4 px-6 font-bold">Category</th>
                    <th className="py-4 px-6 font-bold">Issue Description</th>
                    <th className="py-4 px-6 font-bold">Responsibility</th>
                    <th className="py-4 px-6 font-bold">Est Cost</th>
                    <th className="py-4 px-6 font-bold">Status</th>
                    <th className="py-4 px-6 font-bold text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {myServiceRequests.map(req => (
                    <tr key={req.id} className="hover:bg-surface-hover">
                      <td className="py-4 px-6">
                        <div className="font-bold text-text-primary">{req.id.toUpperCase()}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{formatDate(req.createdAt)}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold uppercase text-vedama-gold">{req.category}</td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-text-primary">{req.description}</div>
                        {req.videoUrl && (
                          <a href={req.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-vedama-emerald hover:text-vedama-gold font-bold flex items-center gap-1 mt-1 underline">
                            🎥 Caretaker Video Attached
                          </a>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold uppercase">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] ${req.responsibility === 'tenant' ? 'bg-status-warning-bg text-status-warning' : 'bg-vedama-emerald/10 text-vedama-emerald'}`}>
                          {req.responsibility ? req.responsibility.toUpperCase() : 'LANDLORD'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold">{req.quotedAmount ? formatCurrency(req.quotedAmount) : 'Pending Quote'}</td>
                      <td className="py-4 px-6">
                        <Badge variant={statusToBadge(req.status)}>{req.status.replace('_', ' ').toUpperCase()}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {req.status === 'quoted' && (
                          <button 
                            onClick={() => handleApproveRepair(req.id, req.quotedAmount || 5000)}
                            className="px-3 py-1.5 bg-vedama-emerald text-white font-bold text-[10px] rounded-full hover:bg-vedama-emerald-dark transition-all uppercase tracking-wider"
                          >
                            ✓ Approve Estimate
                          </button>
                        )}
                        {req.status === 'in_progress' && (
                          <div className="flex flex-col gap-1 items-end">
                            <span className="text-[10px] text-text-muted font-bold">
                              {req.isConfirmedByTenant ? '✓ Tenant Confirmed' : '⌛ Awaiting Tenant'}
                            </span>
                            <button 
                              onClick={() => {
                                confirmWorkCompletion(req.id, 'landlord');
                                addToast('You confirmed work completion! Awaiting tenant clearance.', 'info');
                              }}
                              className={`px-3 py-1.5 font-bold text-[10px] rounded-full uppercase tracking-wider transition-all ${req.isConfirmedByLandlord ? 'bg-status-success text-white cursor-default' : 'bg-vedama-gold text-vedama-emerald-dark hover:scale-105'}`}
                              disabled={req.isConfirmedByLandlord}
                            >
                              {req.isConfirmedByLandlord ? '✓ Confirmed by You' : '✓ Confirm Completion'}
                            </button>
                          </div>
                        )}
                        {req.status === 'completed' && (
                          <span className="text-[10px] text-status-success font-bold flex items-center gap-1 justify-end">
                            ✓ Payout Dispatched to Vendor
                          </span>
                        )}
                        {(!['quoted', 'in_progress', 'completed'].includes(req.status)) && (
                          <span className="text-[10px] text-text-muted">No Action Required</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {myServiceRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-muted font-semibold">
                        No maintenance requests filed under your properties.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MONTHLY PAYOUT SETTLEMENT VOUCHERS */}
        {activeTab === 'vouchers' && (
          <div className="space-y-8 animate-fade-in">
            {myVouchers.map(v => (
              <div key={v.id} className="bg-white rounded-3xl border border-surface-border shadow-card p-6 relative overflow-hidden">
                
                {/* Status Stamp */}
                <div className="absolute right-6 top-6 shrink-0">
                  {v.status === 'paid' ? (
                    <div className="border-4 border-status-success/35 text-status-success px-4 py-2 font-heading font-black text-xs uppercase tracking-widest rounded-xl transform rotate-6 animate-scale-in">
                      💸 NCBA BANK CLEARANCE COMPLETED
                    </div>
                  ) : (
                    <div className="border-4 border-status-warning/35 text-status-warning px-4 py-2 font-heading font-black text-xs uppercase tracking-widest rounded-xl transform rotate-6">
                      ⌛ BANK WIRE HELD PENDING APPROVED SIGNATURE
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Disbursement Settlement Receipt</div>
                  <h3 className="text-xl font-heading font-bold text-text-primary mt-1">{v.description}</h3>
                  <div className="text-xs text-text-muted mt-1 font-mono">Reference No: {v.id}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-surface-bg p-5 rounded-2xl border border-surface-border mb-6 text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted font-semibold block uppercase">Total Payee Net Payout</span>
                    <span className="text-lg font-heading font-bold text-vedama-emerald mt-1 block">{formatCurrency(v.amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted font-semibold block uppercase">Beneficiary Landlord</span>
                    <span className="text-sm font-bold text-text-primary mt-1.5 block">Peter Kamau</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted font-semibold block uppercase">Authorized Signature</span>
                    <span className="text-sm font-bold text-text-primary mt-1.5 block">{v.releasedBy ? `${v.releasedBy} (Release Officer)` : 'Pending Board Release'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted font-semibold block uppercase">Bank Clearing Stamp</span>
                    <span className="text-[10px] font-mono text-text-secondary mt-1.5 block truncate">{v.bankReleaseHash || 'Awaiting clearance...'}</span>
                  </div>
                </div>

                {/* EXACT REQUIRED LANDLORD / TENANT RECORD TABLE */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">
                  📋 Landlord / Tenant Record Statement
                </h4>
                <div className="overflow-x-auto border border-surface-border rounded-2xl overflow-hidden mb-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-bg border-b border-surface-border text-text-secondary font-bold">
                        <th className="py-3 px-4 w-12">No</th>
                        <th className="py-3 px-4">Name (Avenue)</th>
                        <th className="py-3 px-4 font-mono">Reference No</th>
                        <th className="py-3 px-4 text-right">Amount (Gross)</th>
                        <th className="py-3 px-4 text-right text-vedama-emerald">Net Amount (90%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {v.voucherLines?.map(line => (
                        <tr key={line.no} className="hover:bg-surface-hover/30">
                          <td className="py-3 px-4 font-bold text-text-secondary">{line.no}</td>
                          <td className="py-3 px-4 font-semibold text-text-primary">{line.name}</td>
                          <td className="py-3 px-4 font-mono text-text-secondary">{line.refNo}</td>
                          <td className="py-3 px-4 text-right font-semibold text-text-primary">{formatCurrency(line.amount)}</td>
                          <td className="py-3 px-4 text-right font-bold text-vedama-emerald">{formatCurrency(line.netAmount)}</td>
                        </tr>
                      ))}
                      {(!v.voucherLines || v.voucherLines.length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-text-muted font-semibold">
                            No statements consolidated in this billing cycle.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-[10px] text-text-muted bg-vedama-emerald/[0.02] border border-vedama-emerald/20 p-4 rounded-xl">
                  <span>
                    Note: A 10% management commission has been auto-deducted to support administrative upkeep by <strong>Francis Mathea (Founder & CEO)</strong> under Vedama Limited.
                  </span>
                  {v.releasedAt && (
                    <span className="font-semibold text-vedama-emerald font-mono">
                      Cleared: {formatDate(v.releasedAt)}
                    </span>
                  )}
                </div>

              </div>
            ))}
            {myVouchers.length === 0 && (
              <div className="bg-white rounded-3xl border border-surface-border shadow-sm p-12 text-center text-text-muted font-semibold">
                No monthly settlement payouts compiled yet. Run EOM compiles on the Admin desk to generate landlord vouchers.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
