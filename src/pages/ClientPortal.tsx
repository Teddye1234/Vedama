import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, FileText, CreditCard, Bell, Printer, CheckCircle, ArrowRight, X, Wrench } from 'lucide-react';
import Logo from '../components/ui/Logo';
import Badge, { statusToBadge } from '../components/ui/Badge';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useToastStore } from '../components/ui/Toast';
import { formatCurrency, formatDate } from '../lib/utils';
import Modal from '../components/ui/Modal';

export default function ClientPortal() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { transactions, triggerBankClearance, properties, tenants, serviceRequests, confirmWorkCompletion } = useDataStore();
  const { addToast } = useToastStore();

  const [activeReceiptTx, setActiveReceiptTx] = useState<any>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [selectedTxId, setSelectedTxId] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Find transactions for this logged in client
  // u4 is Mary Njeri
  const myTransactions = transactions.filter(tx => tx.clientId === user?.id || user?.id === 'u4');
  
  // Find tenant record for this client
  const myTenantRecord = tenants.find(t => t.email === user?.email || t.name === user?.name || t.name === 'Mary Njeri' || t.id === 'ten4');

  const handleQuickPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId) {
      addToast('Please select a property or transaction reference', 'warning');
      return;
    }
    if (quickPayAmount <= 0) {
      addToast('Please enter a valid amount', 'warning');
      return;
    }

    const tx = transactions.find(t => t.id === selectedTxId);
    if (!tx) return;

    // Simulate instant bank webhook clearance
    const res = triggerBankClearance(tx.reference, quickPayAmount, 'mpesa');
    if (res.success) {
      addToast(`Payment of ${formatCurrency(quickPayAmount)} processed via webhook!`, 'success');
      setQuickPayAmount(0);
    } else {
      addToast(res.error || 'Clearance failed', 'error');
    }
  };

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
    return `${qty} Plots (50x100)`;
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <nav className="bg-white border-b border-surface-border px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between sticky top-0 z-50">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <button className="p-2 text-text-secondary hover:text-vedama-emerald hover:bg-surface-hover rounded-lg transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-danger rounded-full"></span>
          </button>
          <div className="h-8 w-px bg-surface-border mx-2"></div>
          <div className="hidden sm:flex flex-col items-end mr-4">
            <span className="text-sm font-bold text-text-primary">{user?.name || 'Mary Njeri'}</span>
            <span className="text-xs text-text-muted">Client Account</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-status-danger-bg text-status-danger text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary">My Portfolio</h1>
          <p className="text-text-secondary">Manage your land purchases, payments, and documents.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2"><Home size={24} className="text-vedama-gold" /> My Properties</h2>
            
            {myTransactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-2xl shadow-sm border border-surface-border p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2.5 h-full bg-vedama-emerald"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-surface-border pb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono font-bold text-text-muted bg-surface-bg px-2.5 py-1 rounded-lg">{tx.reference}</span>
                      <Badge variant={statusToBadge(tx.status)}>{tx.status.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                    <h3 className="text-xl font-heading font-bold text-text-primary">{tx.propertyTitle}</h3>
                    <p className="text-xs text-text-secondary mt-1">Plot Size: {getPlotSizeLabelFromQuantity(tx.plotCount)} • Block: {getReferenceBlock(tx.propertyId, tx.propertyTitle)}</p>
                  </div>
                  <div className="mt-4 md:mt-0 text-left md:text-right">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Agreed Price</div>
                    <div className="text-2xl font-bold text-vedama-emerald">{formatCurrency(tx.totalAmount)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Reconciled Progress</h4>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-secondary">Amount Cleared:</span>
                        <span className="font-bold text-status-success">{formatCurrency(tx.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-secondary">Outstanding Balance:</span>
                        <span className="font-bold text-status-danger">{formatCurrency(tx.balance)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2.5 overflow-hidden">
                      <div className="bg-vedama-emerald h-full rounded-full transition-all" style={{ width: `${Math.min(100, (tx.amountPaid / tx.totalAmount) * 100)}%` }}></div>
                    </div>
                    {tx.balance > 0 && (
                      <div className="mt-4 text-xs font-medium bg-status-warning-bg text-status-warning p-2.5 rounded-xl flex justify-between">
                        <span>Installment Due Date:</span>
                        <span>{formatDate(tx.dueDate)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Actions</h4>
                    <div className="space-y-3">
                      {tx.balance > 0 && (
                        <button 
                          onClick={() => {
                            setSelectedTxId(tx.id);
                            setQuickPayAmount(tx.balance);
                            addToast("Filled payout amount. Clear in Quick Pay panel.", "info");
                          }}
                          className="w-full btn-emerald py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CreditCard size={14} /> Clear Installment
                        </button>
                      )}
                      
                      {tx.amountPaid > 0 && (
                        <button 
                          onClick={() => setActiveReceiptTx(tx)}
                          className="w-full btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Printer size={14} /> View Certified Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {myTransactions.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-surface-border">
                <div className="text-text-muted mb-4 font-semibold">You don't have any sealed property acquisition files yet.</div>
                <button onClick={() => navigate('/properties')} className="btn-primary">Browse Properties</button>
              </div>
            )}
            {/* RENTAL TENANCY & MAINTENANCE CONFIRMATION */}
            {myTenantRecord && (
              <div className="bg-white rounded-3xl border border-surface-border shadow-card p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-surface-border pb-4">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-text-primary">🏢 My Rental Tenancy & Statement</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Track your rent payments, interest charges, and active lease details.</p>
                  </div>
                  <Badge variant={statusToBadge(myTenantRecord.status)}>{myTenantRecord.status.toUpperCase()}</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-surface-bg border border-surface-border rounded-xl">
                    <span className="text-[10px] text-text-muted font-bold block uppercase">Unit Number</span>
                    <span className="text-sm font-bold text-text-primary mt-1 block">{myTenantRecord.unitNumber}</span>
                  </div>
                  <div className="p-3 bg-surface-bg border border-surface-border rounded-xl">
                    <span className="text-[10px] text-text-muted font-bold block uppercase">Monthly Rent</span>
                    <span className="text-sm font-bold text-vedama-emerald mt-1 block">{formatCurrency(myTenantRecord.rentAmount)}</span>
                  </div>
                  <div className="p-3 bg-surface-bg border border-surface-border rounded-xl">
                    <span className="text-[10px] text-text-muted font-bold block uppercase">Interest Accrued</span>
                    <span className="text-sm font-bold text-status-danger mt-1 block">{myTenantRecord.interestCharged ? formatCurrency(myTenantRecord.interestCharged) : 'KES 0'}</span>
                  </div>
                  <div className="p-3 bg-surface-bg border border-surface-border rounded-xl">
                    <span className="text-[10px] text-text-muted font-bold block uppercase">Rent Balance Due</span>
                    <span className="text-sm font-bold text-status-danger mt-1 block">{formatCurrency(myTenantRecord.balance)}</span>
                  </div>
                </div>

                {/* Tenant Maintenance Work Confirmation */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3 flex items-center gap-2">
                    <Wrench size={16} className="text-vedama-gold" /> Active Repairs & Work Confirmations
                  </h4>
                  <div className="space-y-4">
                    {serviceRequests.filter(r => r.tenantId === myTenantRecord.id || r.tenantName === myTenantRecord.name).map(req => (
                      <div key={req.id} className="p-4 bg-surface-bg border border-surface-border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] text-text-muted bg-surface-border/50 px-2 py-0.5 rounded">{req.id.toUpperCase()}</span>
                            <span className="text-xs font-bold text-vedama-gold uppercase">{req.category}</span>
                            <Badge variant={statusToBadge(req.status)}>{req.status.toUpperCase()}</Badge>
                          </div>
                          <p className="text-xs text-text-primary mt-1.5 font-medium">{req.description}</p>
                          {req.videoUrl && (
                            <a href={req.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-vedama-emerald hover:text-vedama-gold font-bold flex items-center gap-1 mt-1 underline">
                              🎥 Caretaker Video Attached
                            </a>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {req.status === 'in_progress' ? (
                            <div className="flex flex-col gap-1.5 items-end">
                              <span className="text-[10px] text-text-muted font-bold">
                                {req.isConfirmedByLandlord ? '✓ Landlord Confirmed' : '⌛ Awaiting Landlord'}
                              </span>
                              <button 
                                onClick={() => {
                                  confirmWorkCompletion(req.id, 'tenant');
                                  addToast('You confirmed work completion! Awaiting landlord signoff.', 'success');
                                }}
                                className={`px-3.5 py-1.5 font-bold text-[10px] rounded-full uppercase tracking-wider transition-all ${req.isConfirmedByTenant ? 'bg-status-success text-white cursor-default' : 'bg-vedama-emerald text-white hover:scale-105'}`}
                                disabled={req.isConfirmedByTenant}
                              >
                                {req.isConfirmedByTenant ? '✓ You Confirmed' : '✓ Confirm Completion'}
                              </button>
                            </div>
                          ) : req.status === 'completed' ? (
                            <span className="text-[10px] text-status-success font-bold flex items-center gap-1">
                              ✓ Work Completed
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-muted">Awaiting Contractor Start</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {serviceRequests.filter(r => r.tenantId === myTenantRecord.id || r.tenantName === myTenantRecord.name).length === 0 && (
                      <p className="text-xs text-text-muted italic text-center py-4 bg-surface-bg border border-dashed rounded-2xl">No active repairs reported for your unit.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            
            {/* Quick Pay Panel connected live */}
            <div className="bg-vedama-emerald-dark text-white rounded-3xl p-6 relative overflow-hidden shadow-card">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-vedama-emerald rounded-full opacity-50 blur-2xl"></div>
              <h3 className="text-lg font-heading font-bold mb-4">Quick Pay simulator</h3>
              
              <form className="space-y-4" onSubmit={handleQuickPaySubmit}>
                <div>
                  <label className="block text-xs text-white/80 mb-1.5 font-bold uppercase">Select Reference Block</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-vedama-gold text-xs [&>option]:text-text-primary"
                    value={selectedTxId}
                    onChange={(e) => setSelectedTxId(e.target.value)}
                    required
                  >
                    <option value="">-- Select --</option>
                    {myTransactions.filter(t => t.balance > 0).map(t => (
                      <option key={t.id} value={t.id}>{t.reference} - Bal: {formatCurrency(t.balance)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/80 mb-1.5 font-bold uppercase">Amount (KES)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-vedama-gold text-xs" 
                    placeholder="Enter amount" 
                    value={quickPayAmount || ''}
                    onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/80 mb-1.5 font-bold uppercase">Clearing Gateway Channel</label>
                  <select className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-vedama-gold text-xs [&>option]:text-text-primary">
                    <option value="mpesa">M-PESA Webhook Clear</option>
                    <option value="bank">Bank Transfer Webhook</option>
                  </select>
                </div>
                <button type="submit" className="btn-gold w-full mt-4 !rounded-full shadow-md text-xs py-3 font-bold">Initiate Webhook Payment</button>
              </form>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-surface-border shadow-sm">
              <h3 className="text-base font-heading font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-text-muted"/> Recent Documents</h3>
              <ul className="space-y-3">
                {myTransactions.filter(tx => tx.amountPaid > 0).map(tx => (
                  <li 
                    key={tx.id}
                    onClick={() => setActiveReceiptTx(tx)}
                    className="flex items-center justify-between p-3 hover:bg-surface-hover rounded-xl transition-colors cursor-pointer border border-transparent hover:border-surface-border text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-status-success/10 text-status-success rounded-lg"><FileText size={16} /></div>
                      <div>
                        <div className="font-semibold text-text-primary">Receipt - {tx.reference}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">Cleared Sum: {formatCurrency(tx.amountPaid)}</div>
                      </div>
                    </div>
                    <Printer size={14} className="text-text-muted" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* PRINTABLE RECEIPT DIALOG MODAL */}
      {activeReceiptTx && (
        <Modal 
          isOpen={!!activeReceiptTx} 
          onClose={() => setActiveReceiptTx(null)} 
          title="Official Reconciled Payment Receipt" 
          size="md"
        >
          <div className="bg-white p-6 rounded-2xl border border-surface-border relative overflow-hidden" id="printable-receipt">
            <div className="absolute top-4 right-4 text-status-success border-4 border-dashed border-status-success/20 rounded-full w-20 h-20 flex flex-col items-center justify-center rotate-12 select-none">
              <CheckCircle size={24} />
              <span className="text-[8px] font-bold mt-0.5">PAID</span>
            </div>

            {/* Logo Letterhead */}
            <div className="border-b border-surface-border pb-4 mb-6">
              <div className="text-lg font-heading font-black text-vedama-emerald tracking-wide">VEDAMA COMPANY LIMITED</div>
              <div className="text-[10px] text-text-secondary">Escrow Operations and Title Deeds Management</div>
              <div className="text-[10px] text-text-muted">Tel: +254 712 345678 | Email: receipts@vedama.co.ke</div>
            </div>

            {/* Receipt Specifications */}
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 text-center bg-surface-bg py-1.5 border border-surface-border rounded-lg">OFFICIAL ESCROW PAYMENT RECEIPT</h4>

            <div className="space-y-2 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-text-secondary">Client Name:</span>
                <span className="font-bold text-text-primary">{activeReceiptTx.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Transaction Reference:</span>
                <span className="font-mono font-bold text-vedama-emerald">{activeReceiptTx.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Reference Block:</span>
                <span className="font-semibold text-text-primary">{getReferenceBlock(activeReceiptTx.propertyId, activeReceiptTx.propertyTitle)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Land Size:</span>
                <span className="font-semibold text-text-primary">{getPlotSizeLabelFromQuantity(activeReceiptTx.plotCount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-surface-border font-bold">
                <span className="text-text-secondary">Total Paid (Cleared):</span>
                <span className="text-status-success">{formatCurrency(activeReceiptTx.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-text-secondary">Remaining Balance:</span>
                <span className="text-status-danger">{formatCurrency(activeReceiptTx.balance)}</span>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-[10px] text-green-800 leading-normal flex items-start gap-2">
              <CheckCircle className="shrink-0 mt-0.5" size={14} />
              <div>
                <strong>NCBA Escrow Clearing Confirmation:</strong> Funds verified and processed. Official land registry title allocation holds in active reservation.
              </div>
            </div>

            {/* Signature footer */}
            <div className="mt-8 pt-6 border-t border-surface-border flex justify-between items-end text-[10px] text-text-secondary">
              <div>
                <div>Date Cleared: {formatDate(activeReceiptTx.updatedAt)}</div>
                <div>Hash Code: VDM-TX-{activeReceiptTx.id.toUpperCase()}</div>
              </div>
              <button 
                onClick={() => window.print()}
                className="btn-emerald py-1 px-3 !rounded-full text-[10px] font-bold flex items-center gap-1 shadow"
              >
                <Printer size={10} /> Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
