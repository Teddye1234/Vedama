import React, { useState } from 'react';
import { FileText, Printer, Search, ArrowRight, UserCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { formatCurrency, formatDate } from '../../lib/utils';

// Helper to get descriptive text label for plot size
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

export default function ReportsPage() {
  const { transactions, properties } = useDataStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'individual'>('summary');
  
  // Individual Report state
  const [selectedTxId, setSelectedTxId] = useState(transactions[0]?.id || '');
  const selectedTx = transactions.find(t => t.id === selectedTxId);

  const getReferenceBlock = (propertyId: string, propertyTitle: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return propertyTitle;
    const blockLetter = prop.id === 'p1' ? 'Block A' : prop.id === 'p2' ? 'Block C' : 'Block F';
    return `${prop.title} - ${blockLetter}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Corporate Reporting Hub</h1>
          <p className="text-text-secondary text-lg">Generate and print summary listings and certified individual client statements.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-surface-border animate-slide-up delay-100">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'summary' 
              ? 'border-vedama-emerald text-vedama-emerald' 
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Report 1: Summary Report
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'individual' 
              ? 'border-vedama-emerald text-vedama-emerald' 
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Report 2: Individual Client Statement
        </button>
      </div>

      {/* REPORT 1: SUMMARY REPORT */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-slide-up delay-200">
          <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex justify-between items-center">
            <div>
              <h3 className="font-heading font-bold text-text-primary">All-Client Active Sales Ledger</h3>
              <p className="text-xs text-text-secondary mt-0.5">Aggregate status list including plot sizes, amounts paid, and due dates.</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5 !rounded-full"
            >
              <Printer size={14} /> Print Summary
            </button>
          </div>

          <div className="card-static overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border">
                    <th className="table-header py-4 px-6">Clients</th>
                    <th className="table-header py-4 px-6">Size Bought</th>
                    <th className="table-header py-4 px-6">Reference Block</th>
                    <th className="table-header py-4 px-6">Amount Paid</th>
                    <th className="table-header py-4 px-6">Balance</th>
                    <th className="table-header py-4 px-6">Dates Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-hover transition-colors">
                      <td className="table-cell py-4 font-semibold text-text-primary">{tx.clientName}</td>
                      <td className="table-cell py-4 font-medium text-text-secondary">
                        {getPlotSizeLabelFromQuantity(tx.plotCount)}
                      </td>
                      <td className="table-cell py-4 font-mono text-xs text-vedama-emerald font-bold">
                        {getReferenceBlock(tx.propertyId, tx.propertyTitle)}
                      </td>
                      <td className="table-cell py-4 font-bold text-status-success">{formatCurrency(tx.amountPaid)}</td>
                      <td className="table-cell py-4 font-bold text-status-danger">{formatCurrency(tx.balance)}</td>
                      <td className="table-cell py-4 text-sm text-text-secondary font-medium">{formatDate(tx.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: INDIVIDUAL CLIENT REPORT */}
      {activeTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-slide-up delay-200">
          
          {/* Client Selector Sidebar */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-card border border-surface-border space-y-4">
            <div>
              <label className="label text-xs uppercase font-bold tracking-wider text-text-muted">Select Active Client</label>
              <select 
                value={selectedTxId} 
                onChange={(e) => setSelectedTxId(e.target.value)}
                className="input-field mt-1.5"
              >
                <option value="">-- Choose Client --</option>
                {transactions.map(t => (
                  <option key={t.id} value={t.id}>{t.clientName} ({t.reference})</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-surface-bg border border-surface-border rounded-xl">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Client Statement Summary</span>
              {selectedTx ? (
                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Client Ref:</span>
                    <span className="font-semibold">{selectedTx.clientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Value:</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(selectedTx.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Paid:</span>
                    <span className="font-semibold text-status-success">{formatCurrency(selectedTx.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Balance Owed:</span>
                    <span className="font-semibold text-status-danger">{formatCurrency(selectedTx.balance)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted mt-1">Please choose a client from the dropdown list to view details.</p>
              )}
            </div>
            
            {selectedTx && (
              <button 
                onClick={() => window.print()}
                className="w-full btn-emerald py-2.5 !rounded-full shadow-md text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Print Certified Statement
              </button>
            )}
          </div>

          {/* Statement View Area */}
          <div className="lg:col-span-2">
            {selectedTx ? (
              <div className="bg-white border-2 border-vedama-emerald/20 rounded-3xl p-8 shadow-card-lg relative overflow-hidden" id="printable-statement">
                
                {/* Certified Stamp Icon */}
                <div className="absolute top-8 right-8 border-4 border-dashed border-status-success/30 text-status-success/40 rounded-full w-24 h-24 flex flex-col items-center justify-center rotate-12 select-none">
                  <CheckCircle2 size={32} />
                  <span className="text-[9px] font-bold mt-0.5">VERIFIED</span>
                </div>

                {/* Letterhead */}
                <div className="border-b-2 border-vedama-emerald pb-6 mb-8">
                  <div className="text-2xl font-heading font-black text-vedama-emerald tracking-wide">VEDAMA COMPANY LIMITED</div>
                  <div className="text-xs text-text-secondary mt-1">Premium Land, Real Estate and Property Management Solutions</div>
                  <div className="text-xs text-text-muted mt-0.5">Nairobi - Malindi - Mombasa | Tel: +254 712 345678 | Email: info@vedama.co.ke</div>
                </div>

                {/* Statement Fields (Strict User-Requested Format) */}
                <div className="grid grid-cols-2 gap-y-4 text-sm font-semibold mb-8 text-text-primary">
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-wider">Name of client:</span>
                    <span className="border-b border-text-muted/40 pb-0.5 flex-grow font-bold text-text-primary">
                      {selectedTx.clientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-wider">Land ref. bought:</span>
                    <span className="border-b border-text-muted/40 pb-0.5 flex-grow font-mono font-bold text-vedama-emerald">
                      {getReferenceBlock(selectedTx.propertyId, selectedTx.propertyTitle)}
                    </span>
                  </div>
                </div>

                {/* Statement Table (Strict User-Requested Columns) */}
                <div className="overflow-hidden border border-surface-border rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-bg border-b border-surface-border">
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase">Date of transaction</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase">Size of land</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase">Agreed price</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase">Paid amount</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase">Balance</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase">Date due.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-xs">
                      {/* Original transaction row */}
                      <tr className="hover:bg-surface-hover">
                        <td className="py-3.5 px-4 font-medium">{formatDate(selectedTx.createdAt)}</td>
                        <td className="py-3.5 px-4 font-semibold text-text-secondary">
                          {getPlotSizeLabelFromQuantity(selectedTx.plotCount)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-text-primary">{formatCurrency(selectedTx.totalAmount)}</td>
                        <td className="py-3.5 px-4 font-bold text-status-success">{formatCurrency(selectedTx.amountPaid)}</td>
                        <td className="py-3.5 px-4 font-bold text-status-danger">{formatCurrency(selectedTx.balance)}</td>
                        <td className="py-3.5 px-4 font-medium text-text-secondary">{formatDate(selectedTx.dueDate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Payments breakdown schedule inside individual statement */}
                {selectedTx.payments.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Reconciled Payment Operations</h4>
                    <div className="bg-surface-bg p-4 rounded-xl border border-surface-border space-y-2.5">
                      {selectedTx.payments.map((p, idx) => (
                        <div key={p.id} className="flex justify-between items-center text-xs text-text-secondary">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-status-success/10 text-status-success flex items-center justify-center font-bold text-[9px]">{idx+1}</span>
                            <span>Cleared via <span className="font-bold uppercase font-mono">{p.method}</span> (Ref: {p.reference})</span>
                          </div>
                          <span className="font-bold text-text-primary">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature footer */}
                <div className="mt-12 pt-8 border-t border-surface-border flex justify-between items-end text-xs text-text-secondary">
                  <div>
                    <div>Generated: {new Date().toLocaleDateString()}</div>
                    <div className="mt-1">System Status: Reconciled & Clear</div>
                  </div>
                  <div className="text-center w-48 border-t border-text-muted/30 pt-1.5 font-bold uppercase tracking-wider text-text-primary text-[10px]">
                    Authorized Signature
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-surface-border rounded-3xl p-12 text-center text-text-muted shadow-card flex flex-col items-center justify-center">
                <FileText size={48} className="text-vedama-emerald/20 mb-3" />
                <h4 className="font-heading font-bold text-text-primary text-base">No Client Statement Loaded</h4>
                <p className="text-xs max-w-sm mt-1">Select an active customer account from the sidebar dropdown selector to construct their statement.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
