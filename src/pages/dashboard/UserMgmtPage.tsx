import React, { useState } from 'react';
import { Plus, Search, Filter, Shield, Mail, Phone, Users, ShieldAlert, CheckCircle, Ban, Edit3, Trash2 } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useToastStore } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../lib/utils';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { User, UserRole } from '../../types';

export default function UserMgmtPage() {
  const { 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    addLandlord, 
    addClient,
    addAuditLog 
  } = useDataStore();

  const { addToast } = useToastStore();
  const currentUser = useAuthStore(s => s.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('client');
  const [formIsActive, setFormIsActive] = useState(true);

  // Stats calculations
  const totalAccounts = users.length;
  const activeAdmins = users.filter(u => u.role === 'admin' && u.isActive).length;
  const financeStaff = users.filter(u => u.role === 'finance' && u.isActive).length;
  const activeLandlords = users.filter(u => u.role === 'landlord' && u.isActive).length;
  const activePortals = users.filter(u => (u.role === 'client' || u.role === 'service_provider') && u.isActive).length;

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesTab = activeTab === 'all' || u.role === activeTab;
    return matchesSearch && matchesTab;
  });

  const openAddModal = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('client');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formEmail || !formPhone) {
      addToast('Please complete all required fields.', 'warning');
      return;
    }

    if (selectedUser) {
      // EDITING USER
      const wasActive = selectedUser.isActive;
      updateUser(selectedUser.id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        isActive: formIsActive
      });

      // Audit Logging
      let logAction = 'UPDATE_USER_PROFILE';
      let details = `Updated profile of user ${formName} (${selectedUser.id}).`;
      
      if (wasActive && !formIsActive) {
        logAction = 'SUSPEND_USER_LOGIN';
        details = `Suspended user account access for ${formName} (${selectedUser.id}).`;
      } else if (!wasActive && formIsActive) {
        logAction = 'ACTIVATE_USER_LOGIN';
        details = `Restored login access and activated user ${formName} (${selectedUser.id}).`;
      }

      addAuditLog({
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Administrator',
        action: logAction,
        module: 'UserManagement',
        details,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });

      addToast(`User ${formName} successfully updated!`, 'success');
    } else {
      // REGISTERING NEW USER
      const userId = `u-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newUser: User = {
        id: userId,
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        isActive: formIsActive,
        createdAt: new Date().toISOString().split('T')[0]
      };

      addUser(newUser);

      // Escrow Entity Auto-Linking
      if (formRole === 'landlord') {
        addLandlord({
          id: userId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          properties: [],
          totalRevenue: 0,
          pendingPayment: 0,
          address: 'Mombasa Road, Nairobi',
          otherInfo: 'KRA PIN: A002938472Y, ID No: 33445522'
        });
      } else if (formRole === 'client') {
        addClient({
          id: userId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          address: 'Limuru Road, Kiambu',
          otherInfo: 'KRA PIN: A004928374M, ID No: 30492817',
          createdAt: new Date().toISOString().split('T')[0]
        });
      }

      addAuditLog({
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Administrator',
        action: 'REGISTER_NEW_USER',
        module: 'UserManagement',
        details: `Registered new system user ${formName} (${userId}) with role ${formRole}.`,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });

      addToast(`User ${formName} successfully registered!`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (confirm(`Are you sure you want to completely remove user ${name}?`)) {
      deleteUser(userId);

      addAuditLog({
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Administrator',
        action: 'DELETE_USER_ACCOUNT',
        module: 'UserManagement',
        details: `Deleted system user account for ${name} (${userId}).`,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });

      addToast(`User ${name} has been removed.`, 'info');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">User Management</h1>
          <p className="text-text-secondary text-lg">Manage system roles, administrative profiles, and escrow access logs.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full"
        >
          <Plus size={18} /> Add New User
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-slide-up delay-100">
        
        <div className="card-static bg-gradient-to-br from-vedama-emerald/10 to-transparent p-5 rounded-2xl border border-vedama-emerald/20 flex flex-col justify-between shadow-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Total accounts</span>
            <span className="p-2 bg-vedama-emerald/10 text-vedama-emerald rounded-xl"><Users size={18} /></span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{totalAccounts}</h2>
            <p className="text-[10px] text-text-muted">Registered in database</p>
          </div>
        </div>

        <div className="card-static bg-gradient-to-br from-vedama-gold/10 to-transparent p-5 rounded-2xl border border-vedama-gold/20 flex flex-col justify-between shadow-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Active Admins</span>
            <span className="p-2 bg-vedama-gold/10 text-vedama-gold rounded-xl"><Shield size={18} /></span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{activeAdmins}</h2>
            <p className="text-[10px] text-text-muted">Systems operations</p>
          </div>
        </div>

        <div className="card-static bg-gradient-to-br from-purple-500/10 to-transparent p-5 rounded-2xl border border-purple-500/20 flex flex-col justify-between shadow-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Finance Agents</span>
            <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><Users size={18} /></span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{financeStaff}</h2>
            <p className="text-[10px] text-text-muted">Direct ledger management</p>
          </div>
        </div>

        <div className="card-static bg-gradient-to-br from-amber-500/10 to-transparent p-5 rounded-2xl border border-amber-500/20 flex flex-col justify-between shadow-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Active Landlords</span>
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Users size={18} /></span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{activeLandlords}</h2>
            <p className="text-[10px] text-text-muted">Asset statement beneficiaries</p>
          </div>
        </div>

        <div className="card-static bg-gradient-to-br from-blue-500/10 to-transparent p-5 rounded-2xl border border-blue-500/20 flex flex-col justify-between shadow-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Active Portals</span>
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><Users size={18} /></span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{activePortals}</h2>
            <p className="text-[10px] text-text-muted">Clients & Service Providers</p>
          </div>
        </div>

      </div>

      {/* Filter Row */}
      <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border mb-8 flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up delay-200">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            className="w-full pl-12 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['all', 'admin', 'finance', 'landlord', 'client', 'service_provider'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all shadow-sm cursor-pointer
                ${activeTab === role 
                  ? 'bg-vedama-emerald text-white' 
                  : 'bg-surface-bg text-text-secondary hover:bg-surface-border'
                }
              `}
            >
              {role === 'all' ? 'All Roles' : role.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="card-static overflow-hidden animate-slide-up delay-300 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header py-4 px-6">Name</th>
                <th className="table-header py-4 px-6">Contact Info</th>
                <th className="table-header py-4 px-6">Role</th>
                <th className="table-header py-4 px-6">Joined Date</th>
                <th className="table-header py-4 px-6">Status</th>
                <th className="table-header py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                  
                  <td className="table-cell py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar fallback */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-vedama-emerald to-vedama-gold shadow-sm">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{u.name}</div>
                        <div className="text-xs text-text-muted font-mono">{u.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="table-cell py-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Mail size={12} className="text-text-muted" /> {u.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Phone size={12} className="text-text-muted" /> {u.phone}
                      </div>
                    </div>
                  </td>

                  <td className="table-cell py-4">
                    <Badge variant={
                      u.role === 'admin' ? 'danger' :
                      u.role === 'finance' ? 'info' :
                      u.role === 'landlord' ? 'warning' : 'success'
                    }>
                      {u.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>

                  <td className="table-cell py-4 text-text-secondary text-sm">
                    {formatDate(u.createdAt)}
                  </td>

                  <td className="table-cell py-4">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-status-success bg-green-50 px-2 py-1 border border-green-200 rounded-full">
                        <CheckCircle size={10} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-status-danger bg-red-50 px-2 py-1 border border-red-200 rounded-full">
                        <Ban size={10} /> Suspended
                      </span>
                    )}
                  </td>

                  <td className="table-cell py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-1.5 rounded-lg border border-surface-border hover:bg-surface-bg text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                        title="Edit User Profile"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 text-status-danger transition-all cursor-pointer"
                        title="Delete User"
                        disabled={u.id === currentUser?.id}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted text-sm">
                    No system users match the active filters or search terms.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? "Modify System User Profile" : "Register New System User Portal"}
        size="md"
      >
        <form className="space-y-4 text-xs" onSubmit={handleSaveUser}>
          
          <div>
            <label className="label">Full Account Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Francis Mathea"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@vedama.co.ke"
                required
              />
            </div>
            <div>
              <label className="label">Contact Mobile Number</label>
              <input 
                type="text" 
                className="input-field" 
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="0712345678"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">System User Role Assignment</label>
              <select
                className="input-field"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                required
              >
                <option value="admin">Administrator (Full Control)</option>
                <option value="finance">Finance Agent (Ledger/Vouchers)</option>
                <option value="landlord">Landowner Beneficiary (Escrow Linked)</option>
                <option value="client">Client Buyer (Direct Sync)</option>
                <option value="service_provider">Service Care Provider (Work Orders)</option>
              </select>
            </div>
            <div>
              <label className="label">Account Status</label>
              <select
                className="input-field"
                value={formIsActive ? "active" : "suspended"}
                onChange={(e) => setFormIsActive(e.target.value === "active")}
                required
              >
                <option value="active">Active & Verified Access</option>
                <option value="suspended">Suspended (Block Login Instantly)</option>
              </select>
            </div>
          </div>

          {formRole === 'landlord' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
              <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Escrow Account Link:</strong> Saving this landowner profile will automatically provision their partner account in the platform statement registry so they can instantly claim property sales commission.
              </p>
            </div>
          )}

          {formRole === 'client' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2">
              <CheckCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-800 leading-relaxed">
                <strong>Buyer Registry Sync:</strong> Creating this buyer client will automatically list them in the clients directory, allowing finance officers to link property sales deeds and payments directly to their profile.
              </p>
            </div>
          )}

          <div className="border-t border-surface-border pt-5 flex justify-end gap-3 mt-5">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">
              {selectedUser ? "Apply Updates" : "Provision Profile"}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
