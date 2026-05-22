import React, { useState } from 'react';
import { Plus, Search, Filter, Car, Home, Cpu, Layers, DollarSign, User, FileText, CheckCircle2, AlertCircle, TrendingUp, Landmark, Calculator } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import Badge, { statusToBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Transaction, PlotSize, Payment } from '../../types';

// Helper to convert plot quantity to PlotSize
const getPlotSizeFromQuantity = (qty: number): PlotSize => {
  if (qty === 1) return '50x100';
  if (qty === 2) return '100x100';
  if (qty === 4) return 'half_acre';
  if (qty === 8) return 'full_acre';
  if (qty > 8) return 'multi_acre';
  return '50x100';
};

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

export default function SalesPage() {
  const { 
    transactions, 
    properties, 
    landlords,
    addTransaction, 
    updateTransaction,
    addLedgerEntry,
    addAuditLog 
  } = useDataStore();
  
  const { addToast } = useToastStore();
  const user = useAuthStore(s => s.user);

  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Sale modal states
  const [assetType, setAssetType] = useState<'land' | 'vehicle' | 'house' | 'machine'>('land');
  const [plotCount, setPlotCount] = useState<number>(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  // Custom Asset Inputs
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [customQty, setCustomQty] = useState(1);
  const [customDetails, setCustomDetails] = useState('');
  const [customLandlordId, setCustomLandlordId] = useState('l1');

  // Client Details Input
  const [clientName, setClientName] = useState('');

  // Transaction Management states
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank_transfer' | 'cash' | 'cheque'>('mpesa');
  const [paymentRef, setPaymentRef] = useState('');
  
  // Negotiation states
  const [negotiationOffer, setNegotiationOffer] = useState(0);
  const [negotiationCounter, setNegotiationCounter] = useState(0);
  const [negotiationStatus, setNegotiationStatus] = useState<Transaction['status']>('pending');

  const filteredTx = transactions.filter(tx => 
    tx.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProperty = properties.find(p => p.id === selectedPropertyId);
  const computedGross = activeProperty ? activeProperty.pricePerPlot * plotCount : (customPrice * customQty);
  
  // Real-world splits
  const computedDeposit = computedGross * 0.20; // 20% standard deposit required
  const computedLandlordShare = computedGross * 0.90; // 90% Net landowner share
  const computedCorporateSplit = computedGross * 0.10; // 10% company fee (Francis Mathea CEO)
  const computedLegalDutyFee = 45000; // standard administrative legal escrow holding fees

  const openNewSale = () => {
    setClientName('');
    setSelectedPropertyId(properties[0]?.id || '');
    setPlotCount(1);
    setAssetType('land');
    setCustomTitle('');
    setCustomPrice(0);
    setCustomQty(1);
    setCustomDetails('');
    setCustomLandlordId('l1');
    setIsNewSaleModalOpen(true);
  };

  const handleNewSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName) {
      addToast('Please enter the client name.', 'warning');
      return;
    }

    let propertyId = 'asset';
    let propertyTitle = '';
    let unitPrice = 0;
    let totalAmount = 0;
    let sizeSelected: PlotSize = '50x100';
    let detailsStr = '';
    let landlordId = 'l1';

    if (assetType === 'land') {
      if (!selectedPropertyId) return;
      const property = properties.find(p => p.id === selectedPropertyId);
      if (!property) return;
      
      propertyId = property.id;
      propertyTitle = property.title;
      unitPrice = property.pricePerPlot;
      totalAmount = unitPrice * plotCount;
      sizeSelected = getPlotSizeFromQuantity(plotCount);
      detailsStr = `Land plots: ${getPlotSizeLabelFromQuantity(plotCount)}`;
      landlordId = property.landlordId || 'l1';
    } else {
      if (!customTitle || customPrice <= 0) {
        addToast('Please enter the asset title and valid pricing.', 'warning');
        return;
      }
      propertyTitle = customTitle;
      unitPrice = customPrice;
      totalAmount = customPrice * customQty;
      detailsStr = customDetails;
      sizeSelected = 'multi_acre'; // general
      landlordId = customLandlordId;
    }
    
    const newTx: Transaction = {
      id: `TX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      reference: `VDM-${assetType.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
      propertyId,
      propertyTitle,
      clientId: `CLI-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      clientName,
      plotSize: sizeSelected,
      plotCount: assetType === 'land' ? plotCount : customQty,
      unitPrice,
      totalAmount,
      amountPaid: 0,
      balance: totalAmount,
      status: 'pending',
      depositAmount: totalAmount * 0.2, // 20% deposit standard
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assetType,
      assetDetails: detailsStr
    };

    addTransaction(newTx);

    // Initial audit log
    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'INITIATED_SALE_POS',
      module: 'SalesPOS',
      details: `Initiated ${assetType} sales transaction ${newTx.reference} for ${newTx.clientName} (KES ${totalAmount.toLocaleString()})`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });
    
    addToast(`Sale transaction ${newTx.reference} initiated successfully!`, 'success');
    setIsNewSaleModalOpen(false);
  };

  const openManageModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setPaymentAmount(0);
    setPaymentRef(`MP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
    setNegotiationOffer(tx.offerAmount || tx.totalAmount * 0.95);
    setNegotiationCounter(tx.counterOffer || tx.totalAmount * 0.98);
    setNegotiationStatus(tx.status);
    setIsManageModalOpen(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    if (paymentAmount <= 0) {
      addToast('Please enter a valid payment amount.', 'warning');
      return;
    }

    if (!paymentRef) {
      addToast('Please enter a payment reference code (M-Pesa ID / Wire Ref).', 'warning');
      return;
    }

    const newPayment: Payment = {
      id: `PAY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      transactionId: selectedTx.id,
      amount: paymentAmount,
      method: paymentMethod,
      reference: paymentRef,
      date: new Date().toISOString().split('T')[0],
      status: 'confirmed'
    };

    const updatedPaid = selectedTx.amountPaid + paymentAmount;
    const updatedBalance = Math.max(0, selectedTx.totalAmount - updatedPaid);
    
    let updatedStatus = selectedTx.status;
    if (updatedBalance === 0) {
      updatedStatus = 'fully_paid';
    } else if (updatedPaid >= selectedTx.depositAmount) {
      updatedStatus = 'deposit_paid';
    } else if (updatedPaid > 0) {
      updatedStatus = 'partially_paid';
    }

    const updatedPayments = [...(selectedTx.payments || []), newPayment];

    updateTransaction(selectedTx.id, {
      amountPaid: updatedPaid,
      balance: updatedBalance,
      status: updatedStatus,
      payments: updatedPayments,
      updatedAt: new Date().toISOString()
    });

    // Split payments - priority allocation to landlord:
    // Minimum agreed price for this transaction's plots
    const property = properties.find(p => p.id === selectedTx.propertyId);
    const agreedUnit = property?.landlordAgreedPrice || (selectedTx.unitPrice * 0.75);
    const landlordTotalTarget = agreedUnit * selectedTx.plotCount;
    
    // How much has already been allocated to the landlord before this payment?
    const previousTotalAllocatedToLandlord = Math.min(landlordTotalTarget, selectedTx.amountPaid);
    
    // Out of the new total paid (updatedPaid), how much goes to the landlord?
    const newTotalAllocatedToLandlord = Math.min(landlordTotalTarget, updatedPaid);
    
    // Portion of this payment that goes to the landlord
    const landlordCut = newTotalAllocatedToLandlord - previousTotalAllocatedToLandlord;
    
    // Portion of this payment that goes to company commission
    const companyCut = paymentAmount - landlordCut;

    // Log split transactions directly to ledger
    addLedgerEntry({
      id: `LDG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      transactionId: selectedTx.id,
      type: 'income',
      description: `Installment Payment ${paymentRef} by ${selectedTx.clientName} for ${selectedTx.propertyTitle}`,
      amount: paymentAmount,
      landlordShare: landlordCut,
      companyCommission: companyCut,
      date: new Date().toISOString().split('T')[0],
      status: 'reconciled'
    });

    // Write to audit log
    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'RECORD_POS_PAYMENT',
      module: 'SalesPOS',
      details: `Recorded KES ${paymentAmount.toLocaleString()} installment for ${selectedTx.reference}. Split: KES ${landlordCut.toLocaleString()} (Landowner Priority) | KES ${companyCut.toLocaleString()} (Company Commission Split).`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast(`Payment of KES ${paymentAmount.toLocaleString()} successfully recorded and reconciled!`, 'success');
    
    // Refresh modal focus
    const refreshedTx = {
      ...selectedTx,
      amountPaid: updatedPaid,
      balance: updatedBalance,
      status: updatedStatus,
      payments: updatedPayments
    };
    setSelectedTx(refreshedTx);
    setPaymentAmount(0);
    setPaymentRef(`MP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  };

  const handleSaveNegotiation = () => {
    if (!selectedTx) return;

    updateTransaction(selectedTx.id, {
      status: negotiationStatus,
      offerAmount: Number(negotiationOffer),
      counterOffer: Number(negotiationCounter),
      updatedAt: new Date().toISOString()
    });

    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'UPDATE_NEGOTIATION',
      module: 'SalesPOS',
      details: `Updated negotiation values for deal ${selectedTx.reference}. Offer: KES ${Number(negotiationOffer).toLocaleString()} | Counter: KES ${Number(negotiationCounter).toLocaleString()} | Deal status set to ${negotiationStatus.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast('Negotiation agreement parameters updated successfully!', 'success');
    setIsManageModalOpen(false);
  };

  const getAssetIcon = (type?: string) => {
    switch (type) {
      case 'vehicle': return <Car className="text-vedama-gold" size={16} />;
      case 'house': return <Home className="text-vedama-emerald" size={16} />;
      case 'machine': return <Cpu className="text-amber-600" size={16} />;
      default: return <Layers className="text-emerald-700" size={16} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Land Sales POS</h1>
          <p className="text-text-secondary text-lg">Initiate land deals, splits, generic property escrows, and pay reconciliations.</p>
        </div>
        <button onClick={openNewSale} className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full">
          <Plus size={18} /> New POS Transaction
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up delay-100">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by ref, client, or asset name..." 
            className="w-full pl-12 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2 w-full md:w-auto justify-center !rounded-full">
          <Filter size={18} /> Filter List
        </button>
      </div>

      <div className="card-static overflow-hidden animate-slide-up delay-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header py-4 px-6">Transaction Ref</th>
                <th className="table-header py-4 px-6">Client Info</th>
                <th className="table-header py-4 px-6">Asset Details</th>
                <th className="table-header py-4 px-6">Financial Reconciliation</th>
                <th className="table-header py-4 px-6">Escrow Status</th>
                <th className="table-header py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-hover transition-colors">
                  <td className="table-cell py-4 text-sm">
                    <div className="font-mono font-bold text-vedama-emerald flex items-center gap-1.5">
                      {getAssetIcon(tx.assetType)}
                      {tx.reference}
                    </div>
                    <div className="text-xs text-text-muted mt-1">{formatDate(tx.createdAt)}</div>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-semibold text-text-primary">{tx.clientName}</div>
                    <div className="text-xs text-text-muted mt-1">ID: {tx.clientId}</div>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-semibold text-text-primary max-w-[240px] truncate flex items-center gap-1">
                      {tx.propertyTitle}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {tx.assetType === undefined || tx.assetType === 'land' ? (
                        <span className="font-medium">Size: {getPlotSizeLabelFromQuantity(tx.plotCount)}</span>
                      ) : (
                        <span className="italic text-vedama-gold font-medium">{tx.assetDetails || 'General Inventory Asset'}</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-bold text-text-primary">{formatCurrency(tx.totalAmount)}</div>
                    <div className="text-xs mt-1 space-y-0.5">
                      <div className="text-status-success font-bold">Paid: {formatCurrency(tx.amountPaid)}</div>
                      {tx.balance > 0 ? (
                        <div className="text-status-danger font-bold">Balance: {formatCurrency(tx.balance)}</div>
                      ) : (
                        <div className="text-status-success font-bold bg-green-50 text-[10px] px-1 border rounded inline-block">✓ Fully Reconciled</div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell py-4">
                    <Badge variant={statusToBadge(tx.status)}>{tx.status.replace('_', ' ').toUpperCase()}</Badge>
                  </td>
                  <td className="table-cell py-4 text-right">
                    <button 
                      onClick={() => openManageModal(tx)}
                      className="btn-primary py-2 px-4 text-xs font-bold shadow-sm hover:shadow !rounded-full"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INITIATE NEW POS TRANSACTION MODAL WITH CALCULATOR PREVIEWS */}
      <Modal isOpen={isNewSaleModalOpen} onClose={() => setIsNewSaleModalOpen(false)} title="Initiate New POS Transaction" size="lg">
        <form className="space-y-6" onSubmit={handleNewSale}>
          
          {/* Asset Class Toggles */}
          <div className="space-y-2">
            <label className="label">Asset Classification Type</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'land', label: 'Land Plot', icon: <Layers size={16} /> },
                { id: 'vehicle', label: 'Vehicle', icon: <Car size={16} /> },
                { id: 'house', label: 'House', icon: <Home size={16} /> },
                { id: 'machine', label: 'Machine', icon: <Cpu size={16} /> }
              ].map(btn => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setAssetType(btn.id as any)}
                  className={`py-3 px-3 border rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                    assetType === btn.id 
                      ? 'bg-vedama-emerald border-vedama-emerald text-white shadow-md' 
                      : 'bg-surface-bg border-surface-border text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            {/* General Info */}
            <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-text-primary flex items-center gap-1">
                <User size={14} className="text-vedama-emerald" /> Client & Reference Info
              </h4>
              <div>
                <label className="label">Client Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Peter Kamau Mutua" 
                  required 
                />
              </div>

              {assetType === 'land' ? (
                <>
                  <div>
                    <label className="label">Select Land Estate Project</label>
                    <select 
                      className="input-field" 
                      required 
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                    >
                      <option value="">-- Choose Property --</option>
                      {properties.filter(p => p.status !== 'sold_out').map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({formatCurrency(p.pricePerPlot)}/Plot)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Number of plots (Quantity multiplier)</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="input-field" 
                      value={plotCount}
                      onChange={(e) => setPlotCount(Math.max(1, Number(e.target.value)))}
                      required 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Asset Project Title</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. Toyota Prado 2021 Txg" 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Price per Unit (KES)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={customPrice}
                        onChange={(e) => setCustomPrice(Number(e.target.value))}
                        required 
                      />
                    </div>
                    <div>
                      <label className="label">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="input-field" 
                        value={customQty}
                        onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value)))}
                        required 
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* LIVE COMMISSION SPLIT & ESCROW CALCULATOR PREVIEW */}
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-vedama-gold/25 space-y-3.5">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-vedama-gold-dark flex items-center gap-1.5">
                <Calculator size={14} className="text-vedama-emerald" /> Interactive Split & Fee Calculator
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-text-muted">Gross Retail Price:</span>
                  <span className="font-bold text-text-primary">{formatCurrency(computedGross)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-text-muted">Escrow Deposit Required (20%):</span>
                  <span className="font-bold text-status-danger">{formatCurrency(computedDeposit)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-text-muted">Landowner Net Share (90%):</span>
                  <span className="font-bold text-text-primary">{formatCurrency(computedLandlordShare)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-text-muted">Company Split Fee (10%):</span>
                  <span className="font-bold text-vedama-emerald">{formatCurrency(computedCorporateSplit)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Administrative Legal Fee:</span>
                  <span className="font-bold text-text-secondary">{formatCurrency(computedLegalDutyFee)}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-surface-border text-[10px] space-y-1 mt-2 text-text-secondary">
                <div className="font-bold text-text-primary uppercase tracking-wide text-[8px] flex items-center gap-1 text-vedama-emerald">
                  <Landmark size={12} /> Custody Clearing Bank Hold
                </div>
                <div>Funds are securely held under NCBA Escrow signatures. Payouts automatically credit 90% Net to landowner, and 10% to CEO board.</div>
              </div>
            </div>

            {assetType !== 'land' && (
              <div className="col-span-2">
                <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-text-primary">🤝 Owner & Specifications</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Owner / Consignor</label>
                      <select 
                        className="input-field" 
                        value={customLandlordId}
                        onChange={(e) => setCustomLandlordId(e.target.value)}
                        required
                      >
                        {landlords.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Asset Details / Specifications</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={customDetails}
                        onChange={(e) => setCustomDetails(e.target.value)}
                        placeholder="Chassis No, model, lease terms, etc." 
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
          
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4">
            <button type="button" onClick={() => setIsNewSaleModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Generate Reference & Seal POS</button>
          </div>
        </form>
      </Modal>

      {/* INTERACTIVE TRANSACTION LIFE-CYCLE MANAGER MODAL */}
      <Modal 
        isOpen={isManageModalOpen} 
        onClose={() => setIsManageModalOpen(false)} 
        title={`Reconcile Transaction Desk: ${selectedTx?.reference}`} 
        size="lg"
      >
        {selectedTx && (
          <div className="space-y-6 text-xs">
            
            {/* Header Details Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border text-center space-y-1">
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Gross Transaction Value</div>
                <div className="text-lg font-bold text-text-primary">{formatCurrency(selectedTx.totalAmount)}</div>
              </div>
              <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border text-center space-y-1">
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Reconciled Amount Paid</div>
                <div className="text-lg font-bold text-status-success">{formatCurrency(selectedTx.amountPaid)}</div>
              </div>
              <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border text-center space-y-1">
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Outstanding Arrears Balance</div>
                <div className="text-lg font-bold text-status-danger">{formatCurrency(selectedTx.balance)}</div>
              </div>
            </div>

            {/* Split Ledger Payout Estimates */}
            {(() => {
              const prop = properties.find(p => p.id === selectedTx.propertyId);
              const agreedUnitVal = prop?.landlordAgreedPrice || (selectedTx.unitPrice * 0.75);
              const landlordTotalTargetVal = agreedUnitVal * selectedTx.plotCount;
              
              const allocatedLandlord = Math.min(landlordTotalTargetVal, selectedTx.amountPaid);
              const pendingLandlord = Math.max(0, landlordTotalTargetVal - allocatedLandlord);
              
              const allocatedCommission = Math.max(0, selectedTx.amountPaid - allocatedLandlord);
              const pendingCommission = Math.max(0, (selectedTx.totalAmount - landlordTotalTargetVal) - allocatedCommission);

              return (
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-vedama-gold/25 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-vedama-gold-dark flex items-center gap-1.5">
                    <Landmark size={14} className="text-vedama-emerald" /> Split Payment Disbursement Distribution
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-surface-border space-y-1">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-text-muted">Landowner Payout Share (Priority)</div>
                      <div className="text-sm font-bold text-text-primary">{formatCurrency(allocatedLandlord)}</div>
                      <div className="text-[9px] text-text-muted mt-1">Pending Balance: {formatCurrency(pendingLandlord)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-surface-border space-y-1">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-text-muted">Corporate Commission Split</div>
                      <div className="text-sm font-bold text-vedama-emerald">{formatCurrency(allocatedCommission)}</div>
                      <div className="text-[9px] text-text-muted mt-1">Pending Commission: {formatCurrency(pendingCommission)}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Deal Negotiation Panel */}
              <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-text-primary flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-vedama-gold" /> Deal Status & Negotiation Parameters
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="label">Current Escrow Deal Status</label>
                    <select 
                      className="input-field" 
                      value={negotiationStatus}
                      onChange={(e) => setNegotiationStatus(e.target.value as any)}
                    >
                      <option value="pending">Pending Offer</option>
                      <option value="negotiating">In Negotiation</option>
                      <option value="agreed">Counter Agreed</option>
                      <option value="deposit_paid">Deposit Paid</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="fully_paid">Fully Paid</option>
                      <option value="cancelled">Cancelled / Voided</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Client Offer Amount (KES)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={negotiationOffer}
                      onChange={(e) => setNegotiationOffer(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="label">Vedama Counter Offer Amount (KES)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={negotiationCounter}
                      onChange={(e) => setNegotiationCounter(Number(e.target.value))}
                    />
                  </div>

                  <button 
                    type="button" 
                    onClick={handleSaveNegotiation}
                    className="btn-primary w-full py-2.5 !rounded-full shadow-md font-bold mt-2"
                  >
                    Update Negotiation Parameters
                  </button>
                </div>
              </div>

              {/* Record Payment Installments Panel */}
              <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-text-primary flex items-center gap-1.5 mb-4">
                  <DollarSign size={14} className="text-vedama-emerald" /> Log Installment Payment Escrow
                </h4>

                <form onSubmit={handleRecordPayment} className="space-y-3.5">
                  <div>
                    <label className="label">Installment Amount Paid (KES)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="e.g. 500000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Method</label>
                      <select 
                        className="input-field" 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        required
                      >
                        <option value="mpesa">M-Pesa Paybill</option>
                        <option value="bank_transfer">Bank Wire Transfer</option>
                        <option value="cash">Cash Custody</option>
                        <option value="cheque">Banker's Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Reference / Transaction ID</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. TXN99827B"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full py-2.5 !rounded-full shadow-md bg-vedama-emerald border-vedama-emerald text-white font-bold"
                  >
                    Confirm & Split Payment Escrow
                  </button>
                </form>
              </div>

            </div>

            {/* Installment History Log */}
            <div className="bg-white p-4 rounded-2xl border border-surface-border space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-text-primary flex items-center gap-1.5">
                <FileText size={14} className="text-text-secondary" /> Installments Payment Receipts
              </h4>

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {selectedTx.payments && selectedTx.payments.length > 0 ? (
                  selectedTx.payments.map((p, idx) => (
                    <div key={p.id} className="flex justify-between items-center py-2 px-3 bg-surface-bg rounded-xl border border-surface-border">
                      <div className="flex gap-2 items-center">
                        <CheckCircle2 size={14} className="text-status-success" />
                        <div>
                          <div className="font-semibold text-text-primary">{p.reference} ({p.method.replace('_', ' ').toUpperCase()})</div>
                          <div className="text-[10px] text-text-muted">{p.date}</div>
                        </div>
                      </div>
                      <div className="font-bold text-text-primary">{formatCurrency(p.amount)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-text-muted italic flex items-center justify-center gap-1">
                    <AlertCircle size={14} /> No payment installments recorded for this transaction deal yet.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsManageModalOpen(false)}
                className="btn-secondary py-2.5 px-6 !rounded-full text-xs font-bold"
              >
                Close Transaction Desk
              </button>
            </div>
            
          </div>
        )}
      </Modal>

    </div>
  );
}
