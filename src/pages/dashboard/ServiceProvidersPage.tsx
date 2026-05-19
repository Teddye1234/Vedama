import React, { useState } from 'react';
import { Plus, Search, Wrench, CheckCircle, Hammer, AlertTriangle, TrendingDown, Clipboard, Edit2, FileText, Check } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useToastStore } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import Badge, { statusToBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import FileUpload from '../../components/ui/FileUpload';
import { ServiceRequest } from '../../types';

export default function ServiceProvidersPage() {
  const { 
    serviceRequests, 
    serviceProviders, 
    tenants, 
    addServiceRequest, 
    updateServiceRequest, 
    addAuditLog, 
    confirmWorkCompletion 
  } = useDataStore();
  
  const { addToast } = useToastStore();
  const user = useAuthStore(s => s.user);

  const [activeTab, setActiveTab] = useState<'requests' | 'providers'>('requests');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);

  // Form states for Add Request
  const [addCategory, setAddCategory] = useState<'masonry' | 'plumbing' | 'electrical' | 'painting' | 'carpentry' | 'general'>('general');
  const [addPriority, setAddPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [addResponsibility, setAddResponsibility] = useState<'tenant' | 'landlord'>('landlord');
  const [addVideoUrl, setAddVideoUrl] = useState('https://assets.vedama.co.ke/videos/sink-leak.mp4');
  const [addDescription, setAddDescription] = useState('');
  const [addTenantId, setAddTenantId] = useState('');

  // Form states for Manage/Edit Request
  const [editCategory, setEditCategory] = useState<'masonry' | 'plumbing' | 'electrical' | 'painting' | 'carpentry' | 'general'>('general');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [editResponsibility, setEditResponsibility] = useState<'tenant' | 'landlord'>('landlord');
  const [editDescription, setEditDescription] = useState('');
  const [editQuotedAmount, setEditQuotedAmount] = useState(0);
  const [editStatus, setEditStatus] = useState<any>('open');
  const [editProviderId, setEditProviderId] = useState('');
  const [editInvoiceUrl, setEditInvoiceUrl] = useState('');
  const [editInvoiceName, setEditInvoiceName] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');

  // Tab and Search
  const [searchTerm, setSearchTerm] = useState('');

  // Metric aggregates
  const totalRequests = serviceRequests.length;
  const activeJobs = serviceRequests.filter(r => r.status === 'assigned' || r.status === 'in_progress').length;
  const completedJobs = serviceRequests.filter(r => r.status === 'completed').length;
  const totalRepairOutflows = serviceRequests
    .filter(r => r.status === 'completed' || r.status === 'in_progress')
    .reduce((sum, r) => sum + (r.quotedAmount || 0), 0);

  const filteredRequests = serviceRequests.filter(r => 
    r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProviders = serviceProviders.filter(p => 
    p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add Request Submit
  const handleNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTenantId) {
      addToast('Please select a tenant for the issue', 'warning');
      return;
    }
    
    const tenant = tenants.find(t => t.id === addTenantId);
    
    const newRequest: ServiceRequest = {
      id: `SR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      tenantId: addTenantId,
      tenantName: tenant?.name || 'Unknown Client',
      propertyId: tenant?.propertyId || 'unknown',
      category: addCategory,
      description: addDescription,
      priority: addPriority,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      videoUrl: addVideoUrl,
      responsibility: addResponsibility,
    };

    addServiceRequest(newRequest);

    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'CREATE_MAINTENANCE_ORDER',
      module: 'ServiceProviders',
      details: `Created new caretaker repair order ${newRequest.id} for ${newRequest.tenantName}.`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast('Service request registered and routed to providers category!', 'success');
    setIsAddModalOpen(false);
    setAddDescription('');
  };

  // Open Manage Request Modal
  const openManageModal = (req: ServiceRequest) => {
    setActiveRequest(req);
    setEditCategory(req.category);
    setEditPriority(req.priority);
    setEditResponsibility(req.responsibility || 'landlord');
    setEditDescription(req.description);
    setEditQuotedAmount(req.quotedAmount || 0);
    setEditStatus(req.status);
    setEditProviderId(req.assignedProviderId || '');
    setEditInvoiceUrl(req.invoiceUrl || '');
    setEditInvoiceName(req.invoiceUrl ? req.invoiceUrl.split('/').pop() || 'quote_estimate.pdf' : '');
    setEditVideoUrl(req.videoUrl || '');
    setIsManageModalOpen(true);
  };

  // Submit Manage Request Changes
  const handleManageRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;

    const provider = serviceProviders.find(p => p.id === editProviderId);
    const amount = Number(editQuotedAmount);

    const updates: Partial<ServiceRequest> = {
      category: editCategory,
      priority: editPriority,
      responsibility: editResponsibility,
      description: editDescription,
      quotedAmount: amount > 0 ? amount : undefined,
      status: editStatus,
      assignedProviderId: editProviderId || undefined,
      assignedProviderName: provider ? provider.company : undefined,
      invoiceUrl: editInvoiceUrl || undefined,
      videoUrl: editVideoUrl || undefined,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    // If status is completed but no confirmations exist yet, auto-confirm for demo ease
    if (editStatus === 'completed') {
      updates.isConfirmedByTenant = true;
      updates.isConfirmedByLandlord = true;
      updates.paymentVoucherId = `VOU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }

    updateServiceRequest(activeRequest.id, updates);

    addAuditLog({
      id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      action: 'UPDATE_MAINTENANCE_ORDER',
      module: 'ServiceProviders',
      details: `Updated service request ${activeRequest.id}. Status: ${editStatus.toUpperCase()}. Quoted: ${formatCurrency(amount)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    addToast(`Service order ${activeRequest.id} successfully updated!`, 'success');
    setIsManageModalOpen(false);
  };

  const handleAssignProviderDirect = (id: string, category: string) => {
    const provider = serviceProviders.find(p => p.category.toLowerCase() === category.toLowerCase()) || serviceProviders[0];
    updateServiceRequest(id, { 
      status: 'assigned', 
      assignedProviderId: provider.id, 
      assignedProviderName: provider.company,
      updatedAt: new Date().toISOString()
    });
    addToast(`Auto-assigned matching ${category.toUpperCase()} contractor: ${provider.company}`, 'info');
  };

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Service & Maintenance Hub</h1>
          <p className="text-text-secondary text-lg">Manage caretaker service orders, approve contractor quotations, and disburse repair payments.</p>
        </div>
        <button 
          onClick={() => {
            setAddTenantId(tenants[0]?.id || '');
            setIsAddModalOpen(true);
          }} 
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full"
        >
          <Plus size={18} /> New Request
        </button>
      </div>

      {/* METRICS DASHBOARD PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card animate-slide-up delay-100 transition-all hover:shadow-card-lg hover:-translate-y-0.5">
          <div className="text-text-secondary font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clipboard size={14} className="text-text-muted" /> Total Requests
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">{totalRequests}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-status-warning/20 shadow-card animate-slide-up delay-200 transition-all hover:shadow-card-lg hover:-translate-y-0.5">
          <div className="text-status-warning font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Hammer size={14} /> Active Repairs
          </div>
          <div className="text-2xl font-heading font-bold text-status-warning">{activeJobs}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-status-success/20 shadow-card animate-slide-up delay-300 transition-all hover:shadow-card-lg hover:-translate-y-0.5">
          <div className="text-status-success font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle size={14} /> Jobs Completed
          </div>
          <div className="text-2xl font-heading font-bold text-status-success">{completedJobs}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card animate-slide-up delay-400 transition-all hover:shadow-card-lg hover:-translate-y-0.5">
          <div className="text-text-secondary font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingDown size={14} className="text-status-danger" /> Total Paid Out
          </div>
          <div className="text-2xl font-heading font-bold text-vedama-emerald">{formatCurrency(totalRepairOutflows)}</div>
        </div>
      </div>

      <div className="flex p-1 bg-surface-bg rounded-2xl w-fit animate-slide-up delay-100 border border-surface-border mb-6">
        <button 
          className={`py-2.5 px-8 rounded-xl font-bold transition-all duration-300 text-xs uppercase tracking-wider ${activeTab === 'requests' ? 'bg-white text-vedama-emerald shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/50'}`}
          onClick={() => setActiveTab('requests')}
        >
          Service Requests
        </button>
        <button 
          className={`py-2.5 px-8 rounded-xl font-bold transition-all duration-300 text-xs uppercase tracking-wider ${activeTab === 'providers' ? 'bg-white text-vedama-emerald shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/50'}`}
          onClick={() => setActiveTab('providers')}
        >
          Contractor Registry
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border mb-8 animate-slide-up delay-400">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'requests' ? "Search client name, type..." : "Search company name, category..."} 
            className="w-full pl-12 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'requests' ? (
        <div className="card-static overflow-hidden animate-slide-up delay-200 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-surface-bg border-b border-surface-border">
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">ID / Date</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Tenant Name</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Category & Issue</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Assigned Vendor</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Quote Value</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Invoice Doc</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Status</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-hover transition-colors text-xs">
                    <td className="table-cell py-4">
                      <div className="font-mono font-bold text-vedama-gold mb-1">{req.id.toUpperCase()}</div>
                      <div className="text-text-muted">{formatDate(req.createdAt)}</div>
                    </td>
                    <td className="table-cell py-4">
                      <div className="font-semibold text-text-primary text-sm">{req.tenantName}</div>
                      <div className="text-[10px] mt-1 font-bold flex gap-1 items-center">
                        <span className={`px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] ${req.responsibility === 'tenant' ? 'bg-status-warning-bg text-status-warning' : 'bg-vedama-emerald/10 text-vedama-emerald'}`}>
                          {req.responsibility ? req.responsibility.toUpperCase() : 'LANDLORD'} RESPONSIBILITY
                        </span>
                      </div>
                    </td>
                    <td className="table-cell py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-vedama-emerald bg-vedama-emerald/5 px-2 py-0.5 rounded border border-vedama-emerald/10">{req.category}</span>
                        {req.priority === 'urgent' && <Badge variant="danger">URGENT</Badge>}
                        {req.priority === 'high' && <Badge variant="warning">HIGH</Badge>}
                      </div>
                      <div className="text-text-primary font-medium max-w-[220px] truncate">{req.description}</div>
                      {req.videoUrl && (
                        <a href={req.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-vedama-gold hover:underline font-bold flex items-center gap-1 mt-1.5">
                          🎥 Caretaker Issue Video
                        </a>
                      )}
                    </td>
                    <td className="table-cell py-4 font-semibold text-text-primary">{req.assignedProviderName || 'Contractor Unassigned'}</td>
                    <td className="table-cell py-4 font-bold text-sm text-text-primary">
                      {req.quotedAmount ? formatCurrency(req.quotedAmount) : <span className="text-text-muted font-normal italic">Pending Quote</span>}
                    </td>
                    <td className="table-cell py-4">
                      {req.invoiceUrl ? (
                        <a href={req.invoiceUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-vedama-emerald hover:underline flex items-center gap-1">
                          <FileText size={12} /> View Estimate
                        </a>
                      ) : (
                        <span className="text-[10px] text-text-muted italic">No Invoice attached</span>
                      )}
                    </td>
                    <td className="table-cell py-4">
                      <Badge variant={statusToBadge(req.status)}>{req.status.replace('_', ' ').toUpperCase()}</Badge>
                    </td>
                    <td className="table-cell py-4 text-right space-x-2">
                      <button 
                        onClick={() => openManageModal(req)}
                        className="px-2.5 py-1.5 bg-vedama-emerald/10 hover:bg-vedama-emerald hover:text-white text-vedama-emerald rounded-full font-bold text-[10px] transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 size={10} /> Manage Order
                      </button>
                      
                      {req.status === 'open' && (
                        <button 
                          onClick={() => handleAssignProviderDirect(req.id, req.category)}
                          className="px-2.5 py-1.5 bg-surface-bg hover:bg-surface-border text-text-primary border border-surface-border rounded-full font-bold text-[10px] transition-all"
                        >
                          Auto-Assign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-static overflow-hidden animate-slide-up delay-200 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-bg border-b border-surface-border">
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Provider Info</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Contact</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Category</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Performance</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Status</th>
                  <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-surface-hover transition-colors text-xs">
                    <td className="table-cell py-4">
                      <div className="font-bold text-text-primary text-sm">{provider.company}</div>
                      <div className="text-text-muted mt-1">{provider.name}</div>
                    </td>
                    <td className="table-cell py-4">
                      <div className="font-medium text-text-primary">{provider.phone}</div>
                      <div className="text-[10px] text-text-muted mt-1">{provider.email}</div>
                    </td>
                    <td className="table-cell py-4">
                      <span className="px-2.5 py-1 bg-surface-border text-text-secondary rounded-full font-bold text-[10px] uppercase tracking-wider">{provider.category}</span>
                    </td>
                    <td className="table-cell py-4">
                      <div className="flex items-center text-sm font-bold text-vedama-gold mb-1">
                        ★ {provider.rating} <span className="text-text-muted font-normal text-xs ml-1">avg</span>
                      </div>
                      <div className="text-text-muted">{provider.jobsCompleted} jobs completed</div>
                    </td>
                    <td className="table-cell py-4">
                      <Badge variant={statusToBadge(provider.status)}>{provider.status.toUpperCase()}</Badge>
                    </td>
                    <td className="table-cell py-4 text-right">
                      <button 
                        onClick={() => addToast(`Modifying profiles for ${provider.company} is direct via contractor portal!`, 'info')}
                        className="text-sm font-semibold text-vedama-emerald hover:text-vedama-gold transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. NEW SERVICE REQUEST MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Maintenance service Request" size="md">
        <form className="space-y-5" onSubmit={handleNewRequest}>
          <div className="text-xs space-y-4">
            <div>
              <label className="label">Select Client / Tenant Profile</label>
              <select 
                value={addTenantId} 
                onChange={(e) => setAddTenantId(e.target.value)} 
                className="input-field" 
                required
              >
                <option value="">-- Select Tenant --</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name} (Unit {t.unitNumber})</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select 
                  value={addCategory} 
                  onChange={(e) => setAddCategory(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="masonry">Masonry</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="painting">Painting</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="label">Priority Level</label>
                <select 
                  value={addPriority} 
                  onChange={(e) => setAddPriority(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="low">Low (Standard)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Urgent)</option>
                  <option value="urgent">Critical Distress</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Financial Responsibility</label>
                <select 
                  value={addResponsibility} 
                  onChange={(e) => setAddResponsibility(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="landlord">Landlord Escrow Split</option>
                  <option value="tenant">Tenant Direct Invoice Bill</option>
                </select>
              </div>
              
              <div>
                <label className="label">Caretaker Visual Proof Video URL</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={addVideoUrl} 
                  onChange={(e) => setAddVideoUrl(e.target.value)} 
                  placeholder="https://assets.vedama.co.ke/videos/sink.mp4" 
                />
              </div>
            </div>

            <div>
              <label className="label">Issue Description & Repairs Specifications</label>
              <textarea 
                className="input-field min-h-[100px]" 
                value={addDescription} 
                onChange={(e) => setAddDescription(e.target.value)} 
                placeholder="Give descriptive issue details (e.g. Master bathroom sink is cracked and dripping under the seal, caretaker has shut the mains)..." 
                required
              ></textarea>
            </div>
          </div>
          
          <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">Create Request</button>
          </div>
        </form>
      </Modal>

      {/* 2. MANAGE / EDIT MAINTENANCE REQUEST MODAL */}
      <Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title="Manage Service Order & Upload Quotation" size="md">
        {activeRequest && (
          <form className="space-y-5" onSubmit={handleManageRequestSubmit}>
            <div className="bg-surface-bg p-4 rounded-2xl border border-surface-border text-xs space-y-2.5">
              <h4 className="font-bold text-text-primary uppercase tracking-wider text-[9px] mb-1">Caretaker Report Details</h4>
              <div className="flex justify-between">
                <span className="text-text-secondary">Order ID:</span>
                <span className="font-mono font-bold text-text-primary">{activeRequest.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Reporting Client:</span>
                <span className="font-semibold text-text-primary">{activeRequest.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Original Issue:</span>
                <span className="font-medium text-text-primary text-right max-w-[200px] truncate">{activeRequest.description}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="label">Edit Issue Category</label>
                <select 
                  value={editCategory} 
                  onChange={(e) => setEditCategory(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="masonry">Masonry</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="painting">Painting</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="label">Edit Priority Level</label>
                <select 
                  value={editPriority} 
                  onChange={(e) => setEditPriority(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="low">Low (Standard)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Urgent)</option>
                  <option value="urgent">Critical Distress</option>
                </select>
              </div>

              <div>
                <label className="label">Financial Responsibility</label>
                <select 
                  value={editResponsibility} 
                  onChange={(e) => setEditResponsibility(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="landlord">Landlord Escrow Split</option>
                  <option value="tenant">Tenant Direct Invoice Bill</option>
                </select>
              </div>

              <div>
                <label className="label">Caretaker Proof Video URL</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editVideoUrl} 
                  onChange={(e) => setEditVideoUrl(e.target.value)} 
                />
              </div>

              <div className="col-span-2">
                <label className="label">Assign Matching Contractor / Vendor</label>
                <select 
                  value={editProviderId} 
                  onChange={(e) => setEditProviderId(e.target.value)} 
                  className="input-field"
                >
                  <option value="">-- No contractor assigned --</option>
                  {serviceProviders.map(p => (
                    <option key={p.id} value={p.id}>{p.company} ({p.category.toUpperCase()} · ★{p.rating})</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 bg-vedama-emerald/5 p-3.5 rounded-xl border border-vedama-emerald/10 space-y-4">
                <label className="label font-bold text-vedama-emerald uppercase tracking-wider text-[9px]">🛠️ Contractor quotation details</label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Repairs Quotation Amount (KES)</label>
                    <input 
                      type="number" 
                      className="input-field font-bold text-vedama-emerald" 
                      placeholder="e.g. 15000"
                      value={editQuotedAmount}
                      onChange={(e) => setEditQuotedAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2">
                    <FileUpload 
                      label="📁 Attach Signed Contractor Invoice / Quote PDF" 
                      onUploadComplete={(url) => setEditInvoiceUrl(url)}
                      defaultUrl={editInvoiceUrl}
                      defaultName={editInvoiceName}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="label">Work Status State</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="open">Open (Caretaker Raised)</option>
                  <option value="assigned">Assigned (Contractor Appointed)</option>
                  <option value="quoted">Quoted (Invoice uploaded, awaiting landlord signoff)</option>
                  <option value="approved">Approved (Billing split cleared)</option>
                  <option value="in_progress">In Progress (Active repairs on site)</option>
                  <option value="completed">Completed (Confirmed & Released)</option>
                  <option value="closed">Closed (Reconciled)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="label">Caretaker Issue Description</label>
                <textarea 
                  className="input-field min-h-[80px]" 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  required
                ></textarea>
              </div>
            </div>

            <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setIsManageModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary !rounded-full shadow-md">Save Service changes</button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
