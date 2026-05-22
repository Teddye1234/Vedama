import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Lock, 
  Shield, 
  AlertCircle, 
  ArrowRight, 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  ShieldAlert, 
  CheckCircle, 
  Ban, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Settings,
  User as UserIcon,
  MapPin,
  Camera,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../components/ui/Toast';
import { useDataStore } from '../../stores/dataStore';
import { formatDate } from '../../lib/utils';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { User, UserRole } from '../../types';
import api from '../../lib/api';

export default function SettingsPage() {
  const { user, requestOtp, verifyAndChangePassword, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();
  const { 
    users, addUser, updateUser, deleteUser, 
    landlords, addLandlord, updateLandlord, 
    clients, addClient, updateClient, 
    addAuditLog 
  } = useDataStore();

  const isAdmin = user?.role === 'admin';
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'security' | 'users'>('profile');

  // =========================================================================
  // STATE FOR MY PROFILE (PROFILE TAB)
  // =========================================================================
  const myLandlord = landlords.find(l => l.email === user?.email || l.id === user?.id);
  const myClient = clients.find(c => c.email === user?.email || c.id === user?.id);

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileIdNo, setProfileIdNo] = useState('');
  const [profileKraPin, setProfileKraPin] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Initialize profile values when user or data changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfileAvatar(user.avatar || '');
      
      const targetRecord = myLandlord || myClient;
      if (targetRecord) {
        setProfileAddress(targetRecord.address || '');
        const otherInfo = targetRecord.otherInfo || '';
        
        const idMatch = otherInfo.match(/ID No:\s*([^,\n]+)/i) || otherInfo.match(/ID Number:\s*([^,\n]+)/i) || otherInfo.match(/ID:\s*([^,\n]+)/i);
        const pinMatch = otherInfo.match(/KRA PIN:\s*([^,\n]+)/i) || otherInfo.match(/PIN:\s*([^,\n]+)/i);
        const bioMatch = otherInfo.match(/Bio:\s*([^,\n]+)/i) || otherInfo.match(/Notes:\s*([^,\n]+)/i);

        setProfileIdNo(idMatch ? idMatch[1].trim() : '');
        setProfileKraPin(pinMatch ? pinMatch[1].trim() : '');
        
        if (bioMatch) {
          setProfileBio(bioMatch[1].trim());
        } else {
          // Remove ID and PIN details to see if anything else is left as general info
          let cleaned = otherInfo
            .replace(/ID No:\s*([^,\n]+)/i, '')
            .replace(/ID Number:\s*([^,\n]+)/i, '')
            .replace(/KRA PIN:\s*([^,\n]+)/i, '')
            .replace(/PIN:\s*([^,\n]+)/i, '')
            .replace(/,\s*,/g, ',')
            .trim();
          if (cleaned.startsWith(',')) cleaned = cleaned.substring(1).trim();
          if (cleaned.endsWith(',')) cleaned = cleaned.substring(0, cleaned.length - 1).trim();
          setProfileBio(cleaned);
        }
      }
    }
  }, [user, landlords, clients]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail || !profilePhone) {
      addToast('Name, Email, and Phone number are required.', 'warning');
      return;
    }

    setIsProfileSaving(true);
    try {
      // 1. Update session user in authStore
      updateProfile({
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        avatar: profileAvatar
      });

      // 2. Update user in users list in dataStore
      if (user?.id) {
        updateUser(user.id, {
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          avatar: profileAvatar
        });
      }

      // Compile otherInfo string
      const otherInfoParts: string[] = [];
      if (profileIdNo) otherInfoParts.push(`ID No: ${profileIdNo}`);
      if (profileKraPin) otherInfoParts.push(`KRA PIN: ${profileKraPin}`);
      if (profileBio) otherInfoParts.push(profileBio);
      const newOtherInfo = otherInfoParts.join(', ');

      // 3. Update client record if applicable
      if (myClient) {
        updateClient(myClient.id, {
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          avatar: profileAvatar,
          address: profileAddress,
          otherInfo: newOtherInfo
        });
      }

      // 4. Update landlord record if applicable
      if (myLandlord) {
        updateLandlord(myLandlord.id, {
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          avatar: profileAvatar,
          address: profileAddress,
          otherInfo: newOtherInfo
        });
      }

      // 5. Add audit log
      addAuditLog({
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: user?.id || 'unknown',
        userName: profileName,
        action: 'UPDATE_PERSONAL_PROFILE',
        module: 'Settings',
        details: `Updated personal profile details, contact information, and avatar.`,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });

      addToast('Profile details updated successfully!', 'success');
    } catch (err) {
      addToast('Failed to save profile updates.', 'error');
    }
    setIsProfileSaving(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      addToast('Image size must be under 2MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High quality crop/draw to 150x150 canvas
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Crop square center
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setProfileAvatar(dataUrl);
          addToast('Profile photo optimized and selected! Click Save Profile to apply.', 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // STATE FOR CHANGE PASSWORD (SECURITY TAB)
  // =========================================================================
  const [otp, setOtp] = useState('');
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPwdLoading, setIsPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Auto-request OTP when Security tab mounts or is selected
  useEffect(() => {
    if (activeSettingsTab === 'security' && user?.email) {
      setPwdError('');
      setOtp('');
      setSandboxOtp(null);
      setNewPassword('');
      setConfirmPassword('');
      handleSendOtp();
    }
  }, [activeSettingsTab, user]);

  // Resend OTP countdown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!user?.email) return;
    setIsPwdLoading(true);
    setPwdError('');
    
    const result = await requestOtp(user.email, user.phone, 'change');
    if (result.success) {
      setResendTimer(60);
      if (result.simulatedOtp) {
        setOtp(result.simulatedOtp);
        setSandboxOtp(result.simulatedOtp);
        addToast(`[Sandbox Mode] OTP code auto-filled: ${result.simulatedOtp}`, 'info');
      } else {
        setSandboxOtp(null);
        addToast('OTP verification code sent to your active email/phone.', 'info');
      }
    } else {
      setPwdError(result.error || 'Failed to dispatch verification OTP.');
    }
    setIsPwdLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (otp.length !== 6) {
      setPwdError('Please enter a valid 6-digit OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    setIsPwdLoading(true);
    if (user?.email) {
      const result = await verifyAndChangePassword(user.email, otp, newPassword);
      if (result.success) {
        addToast('Password updated successfully!', 'success');
        setOtp('');
        setSandboxOtp(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdError(result.error || 'Failed to verify OTP code.');
      }
    }
    setIsPwdLoading(false);
  };

  // =========================================================================
  // STATE FOR USER MANAGEMENT TAB
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole | 'all'>('all');

  // Create/Edit Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Admin Override Reset Password State
  const [isAdminResetOpen, setIsAdminResetOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [isAdminResetting, setIsAdminResetting] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // User Form Fields State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('client');
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [showFormPwd, setShowFormPwd] = useState(false);

  // User Stats
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
    const matchesTab = activeRoleTab === 'all' || u.role === activeRoleTab;
    return matchesSearch && matchesTab;
  });

  const openAddUserModal = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('client');
    setFormPassword('');
    setFormIsActive(true);
    setShowFormPwd(false);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (target: User) => {
    setSelectedUser(target);
    setFormName(target.name);
    setFormEmail(target.email);
    setFormPhone(target.phone);
    setFormRole(target.role);
    setFormPassword('');
    setFormIsActive(target.isActive);
    setShowFormPwd(false);
    setIsUserModalOpen(true);
  };

  const openAdminResetModal = (target: User) => {
    setResetTargetUser(target);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetPwd(false);
    setShowResetConfirm(false);
    setIsAdminResetOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPhone) {
      addToast('Please complete all required fields.', 'warning');
      return;
    }

    if (selectedUser) {
      // Edit existing user
      const wasActive = selectedUser.isActive;
      const updates: Partial<User> = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        isActive: formIsActive,
      };
      updateUser(selectedUser.id, updates);

      if (formPassword.trim().length >= 6) {
        try {
          await api.post('/auth?action=admin-reset-password', {
            targetEmail: formEmail,
            newPassword: formPassword.trim(),
            adminId: user?.id,
          });
        } catch { /* ignored */ }
      }

      let logAction = 'UPDATE_USER_PROFILE';
      let details = `Updated profile of user ${formName} (${selectedUser.id}).`;
      if (wasActive && !formIsActive) {
        logAction = 'SUSPEND_USER_LOGIN';
        details = `Suspended login access for ${formName} (${selectedUser.id}).`;
      } else if (!wasActive && formIsActive) {
        logAction = 'ACTIVATE_USER_LOGIN';
        details = `Restored login access for ${formName} (${selectedUser.id}).`;
      }

      addAuditLog({ 
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, 
        userId: user?.id || 'admin', 
        userName: user?.name || 'Administrator', 
        action: logAction, 
        module: 'UserManagement', 
        details, 
        timestamp: new Date().toISOString(), 
        ipAddress: '127.0.0.1' 
      });
      addToast(`User ${formName} updated successfully!`, 'success');

    } else {
      // Create new user
      if (!formPassword || formPassword.length < 6) {
        addToast('Please set a password of at least 6 characters.', 'warning');
        return;
      }

      const userId = `u-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newUser: User = {
        id: userId,
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        isActive: formIsActive,
        createdAt: new Date().toISOString().split('T')[0],
      };

      addUser(newUser);

      try {
        await api.post('/auth?action=admin-create-user', {
          id: userId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          password: formPassword,
          isActive: formIsActive,
        });
      } catch { /* ignored */ }

      if (formRole === 'landlord') {
        addLandlord({ id: userId, name: formName, email: formEmail, phone: formPhone, properties: [], totalRevenue: 0, pendingPayment: 0, address: 'Mombasa Road, Nairobi', otherInfo: 'KRA PIN: A002938472Y, ID No: 33445522' });
      } else if (formRole === 'client') {
        addClient({ id: userId, name: formName, email: formEmail, phone: formPhone, address: 'Limuru Road, Kiambu', otherInfo: 'KRA PIN: A004928374M, ID No: 30492817', createdAt: new Date().toISOString().split('T')[0] });
      }

      addAuditLog({ 
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, 
        userId: user?.id || 'admin', 
        userName: user?.name || 'Administrator', 
        action: 'REGISTER_NEW_USER', 
        module: 'UserManagement', 
        details: `Registered new user ${formName} (${userId}) with role ${formRole}.`, 
        timestamp: new Date().toISOString(), 
        ipAddress: '127.0.0.1' 
      });
      addToast(`User ${formName} registered successfully!`, 'success');
    }

    setIsUserModalOpen(false);
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;

    if (resetNewPassword.length < 6) {
      addToast('Password must be at least 6 characters.', 'warning');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }

    setIsAdminResetting(true);
    try {
      const res = await api.post('/auth?action=admin-reset-password', {
        targetEmail: resetTargetUser.email,
        newPassword: resetNewPassword,
        adminId: user?.id,
      });

      if (res.data.success) {
        addAuditLog({ 
          id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, 
          userId: user?.id || 'admin', 
          userName: user?.name || 'Administrator', 
          action: 'ADMIN_RESET_PASSWORD', 
          module: 'UserManagement', 
          details: `Admin reset password for user ${resetTargetUser.name} (${resetTargetUser.id}).`, 
          timestamp: new Date().toISOString(), 
          ipAddress: '127.0.0.1' 
        });
        addToast(`Password for ${resetTargetUser.name} has been reset successfully!`, 'success');
        setIsAdminResetOpen(false);
      } else {
        addToast(res.data.error || 'Failed to reset password.', 'error');
      }
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Password reset failed. Try again.', 'error');
    }
    setIsAdminResetting(false);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (confirm(`Are you sure you want to completely remove user ${name}?`)) {
      deleteUser(userId);
      addAuditLog({ 
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, 
        userId: user?.id || 'admin', 
        userName: user?.name || 'Administrator', 
        action: 'DELETE_USER_ACCOUNT', 
        module: 'UserManagement', 
        details: `Deleted system user ${name} (${userId}).`, 
        timestamp: new Date().toISOString(), 
        ipAddress: '127.0.0.1' 
      });
      addToast(`User ${name} has been removed.`, 'info');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'danger';
    if (role === 'finance') return 'info';
    if (role === 'landlord') return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">System Settings</h1>
          <p className="text-text-secondary text-lg">Manage your account security and system configurations.</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-surface-border gap-6 animate-slide-up delay-100">
        <button
          onClick={() => setActiveSettingsTab('profile')}
          className={`pb-3.5 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all relative z-10 cursor-pointer
            ${activeSettingsTab === 'profile' ? 'border-vedama-emerald text-vedama-emerald font-extrabold' : 'border-transparent text-text-muted hover:text-text-primary'}
          `}
        >
          <UserIcon size={16} /> My Profile & Avatar
        </button>

        <button
          onClick={() => setActiveSettingsTab('security')}
          className={`pb-3.5 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all relative z-10 cursor-pointer
            ${activeSettingsTab === 'security' ? 'border-vedama-emerald text-vedama-emerald font-extrabold' : 'border-transparent text-text-muted hover:text-text-primary'}
          `}
        >
          <Key size={16} /> Security & Password
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveSettingsTab('users')}
            className={`pb-3.5 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all relative z-10 cursor-pointer
              ${activeSettingsTab === 'users' ? 'border-vedama-emerald text-vedama-emerald font-extrabold' : 'border-transparent text-text-muted hover:text-text-primary'}
            `}
          >
            <Users size={16} /> User Management & Portals
          </button>
        )}
      </div>

      {/* =========================================================================
          MY PROFILE TAB WORKFLOW
          ========================================================================= */}
      {activeSettingsTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up delay-200">
          
          {/* Avatar / Photo Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card flex flex-col items-center text-center space-y-6">
              
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-vedama-emerald/20 shadow-md flex items-center justify-center bg-gradient-to-br from-vedama-emerald to-vedama-gold text-white relative">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-heading font-bold uppercase">{profileName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'V'}</span>
                  )}
                  
                  {/* Camera overlay */}
                  <label htmlFor="avatar-upload-input" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={26} />
                  </label>
                </div>
                
                <input 
                  type="file" 
                  id="avatar-upload-input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-text-primary">{profileName || 'Your Name'}</h3>
                <p className="text-xs text-vedama-gold font-bold uppercase tracking-wider">{user?.role.replace('_', ' ')} Account</p>
                <p className="text-[10px] text-text-muted">Member since {user?.createdAt ? formatDate(user.createdAt) : '2026'}</p>
              </div>

              {/* Photo dropzone styling */}
              <div className="w-full border-2 border-dashed border-surface-border rounded-2xl p-4 hover:border-vedama-emerald hover:bg-surface-hover/30 transition-all text-center">
                <label htmlFor="avatar-upload-input-2" className="cursor-pointer space-y-2 block">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-vedama-emerald/10 flex items-center justify-center text-vedama-emerald">
                    <Camera size={18} />
                  </div>
                  <span className="text-xs font-bold text-text-primary block">Upload Profile Photo</span>
                  <span className="text-[10px] text-text-secondary block leading-normal">Drag image here or browse from local computer. JPEG/PNG, max 2MB.</span>
                </label>
                <input 
                  type="file" 
                  id="avatar-upload-input-2" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>

              {profileAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileAvatar('');
                    addToast('Avatar cleared. Click Save Profile to apply.', 'info');
                  }}
                  className="text-xs text-status-danger hover:underline font-semibold"
                >
                  Clear Current Photo
                </button>
              )}

            </div>
          </div>

          {/* Profile Form Content */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-surface-border space-y-6">
              <div className="border-b border-surface-border pb-4">
                <h2 className="text-xl font-heading font-bold text-text-primary">Personal Profile Details</h2>
                <p className="text-text-secondary text-xs mt-1">Keep your contact information and details up to date.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                
                {/* General Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                      <UserIcon size={14} /> Full Account Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grace Wanjiku"
                      className="input-field"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                      <Mail size={14} /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. finance@vedama.co.ke"
                      className="input-field"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                      <Phone size={14} /> Contact Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0723456789"
                      className="input-field"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                      <MapPin size={14} /> Physical Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Limuru Road, farm House 5, Kiambu"
                      className="input-field"
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Additional Info block (highly custom!) */}
                <div className="border-t border-surface-border pt-5 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <FileText size={14} className="text-vedama-gold" /> System Verification & Extra Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                        National ID / Passport Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 33445522"
                        className="input-field"
                        value={profileIdNo}
                        onChange={(e) => setProfileIdNo(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                        KRA PIN Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. A002938472Y"
                        className="input-field"
                        value={profileKraPin}
                        onChange={(e) => setProfileKraPin(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      Profile Bio / Notes / Extra Information
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write details or bio here..."
                      className="input-field min-h-[80px] resize-y"
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-border">
                  <button
                    type="submit"
                    disabled={isProfileSaving}
                    className="btn-emerald px-6 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-full w-full sm:w-auto"
                  >
                    {isProfileSaving ? 'Saving Updates...' : 'Save Profile Details'}
                    {!isProfileSaving && <ArrowRight size={14} />}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          SECURITY TAB WORKFLOW
          ========================================================================= */}
      {activeSettingsTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up delay-200">
          
          {/* Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-vedama-emerald/10 to-transparent p-6 rounded-2xl border border-vedama-emerald/20 shadow-card space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-vedama-emerald/10 flex items-center justify-center text-vedama-emerald">
                <Lock size={22} />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Keep Your Account Secure</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                A strong password uses a mix of uppercase letters, numbers, and unique symbols. Changing your password periodically reduces security vulnerability risk.
              </p>
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex gap-2.5">
                <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span>Verification requires receiving a 6-digit OTP code to protect access integrity.</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-surface-border space-y-6">
              <div className="border-b border-surface-border pb-4">
                <h2 className="text-xl font-heading font-bold text-text-primary">Update Login Password</h2>
                <p className="text-text-secondary text-xs mt-1">Please enter your verification OTP and set your new password below.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="bg-surface-bg p-4 rounded-xl border border-surface-border text-xs text-text-secondary leading-relaxed">
                  We have dispatched a 6-digit verification code to your profile contact details: (<span className="font-semibold text-text-primary">{user?.email}</span>) to verify this action.
                </div>

                {pwdError && (
                  <div className="bg-status-danger-bg border border-status-danger/25 text-status-danger px-4 py-3 rounded-xl flex items-center text-xs font-semibold">
                    <AlertCircle size={16} className="mr-2 shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="max-w-xs">
                    <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5 flex items-center gap-1.5">
                      <Shield size={14} /> Verification Code (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono font-bold bg-surface-bg border border-surface-border focus:border-vedama-emerald focus:ring-4 focus:ring-vedama-emerald/10 outline-none rounded-xl py-2.5 transition-all"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />

                    {sandboxOtp && (
                      <div className="mt-3 bg-blue-50 border border-blue-150 p-3.5 rounded-xl flex flex-col items-center gap-1 text-center animate-pulse shadow-sm">
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest">Sandbox Mode Active</span>
                        <p className="text-[10px] text-blue-800 leading-normal">
                          No active SMTP/Twilio credentials. Enter simulated sandbox code:
                        </p>
                        <div className="font-mono text-base font-black text-blue-700 bg-blue-100/60 px-3 py-1 rounded-lg tracking-[0.2em] border border-blue-200 mt-1">
                          {sandboxOtp}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                        <Lock size={14} /> New Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Minimum 6 characters"
                        className="input-field"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                        <Lock size={14} /> Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Repeat new password"
                        className="input-field"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-surface-border justify-between">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendTimer > 0 || isPwdLoading}
                    className={`text-xs font-semibold transition-colors cursor-pointer ${resendTimer > 0 ? 'text-text-muted cursor-not-allowed' : 'text-vedama-emerald hover:text-vedama-emerald-light'}`}
                  >
                    {resendTimer > 0 ? `Resend Verification in ${resendTimer}s` : 'Resend Verification Code'}
                  </button>

                  <button
                    type="submit"
                    disabled={isPwdLoading}
                    className="btn-emerald px-6 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-full w-full sm:w-auto"
                  >
                    {isPwdLoading ? 'Updating Password...' : 'Save New Password'}
                    {!isPwdLoading && <ArrowRight size={14} />}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          USER MANAGEMENT TAB WORKFLOW (ADMIN ONLY)
          ========================================================================= */}
      {activeSettingsTab === 'users' && isAdmin && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Action Header bar */}
          <div className="flex justify-between items-center animate-slide-up">
            <div>
              <h2 className="text-xl font-heading font-bold text-text-primary">System Accounts Directory</h2>
              <p className="text-text-secondary text-xs">Provision accounts, adjust operational permissions, and reset user passwords.</p>
            </div>
            <button onClick={openAddUserModal} className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-all !rounded-full text-xs py-2.5 px-4 font-bold">
              <Plus size={16} /> Add New User
            </button>
          </div>

          {/* Stats Panels */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-slide-up">
            {[
              { label: 'Total Accounts', value: totalAccounts, icon: Users, color: 'emerald' },
              { label: 'Active Admins', value: activeAdmins, icon: Shield, color: 'gold' },
              { label: 'Finance Staff', value: financeStaff, icon: Users, color: 'purple' },
              { label: 'Landlords', value: activeLandlords, icon: Users, color: 'amber' },
              { label: 'Client Portals', value: activePortals, icon: Users, color: 'blue' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`card-static bg-gradient-to-br from-${color === 'emerald' ? 'vedama-emerald' : color === 'gold' ? 'vedama-gold' : color + '-500'}/10 to-transparent p-5 rounded-2xl border border-${color === 'emerald' ? 'vedama-emerald' : color === 'gold' ? 'vedama-gold' : color + '-500'}/20 flex flex-col justify-between shadow-card`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider leading-tight">{label}</span>
                  <span className={`p-2 bg-${color === 'emerald' ? 'vedama-emerald' : color === 'gold' ? 'vedama-gold' : color + '-500'}/10 text-${color === 'emerald' ? 'vedama-emerald' : color === 'gold' ? 'vedama-gold' : color + '-500'} rounded-xl`}><Icon size={16} /></span>
                </div>
                <h2 className="text-2xl font-bold text-text-primary">{value}</h2>
              </div>
            ))}
          </div>

          {/* Filters Panel */}
          <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                className="w-full pl-11 pr-4 py-3 bg-surface-bg border-none rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {(['all', 'admin', 'finance', 'landlord', 'client', 'service_provider'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRoleTab(role)}
                  className={`px-3.5 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${activeRoleTab === role ? 'bg-vedama-emerald text-white shadow-sm' : 'bg-surface-bg text-text-secondary hover:bg-surface-border'}`}
                >
                  {role === 'all' ? 'All Roles' : role.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* User Grid Table */}
          <div className="card-static overflow-hidden animate-slide-up shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border">
                    <th className="table-header py-4 px-6">Name</th>
                    <th className="table-header py-4 px-6">Contact Info</th>
                    <th className="table-header py-4 px-6">Role</th>
                    <th className="table-header py-4 px-6">Joined</th>
                    <th className="table-header py-4 px-6">Status</th>
                    <th className="table-header py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-hover transition-colors group">
                      
                      <td className="table-cell py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-vedama-emerald to-vedama-gold shadow-sm shrink-0">
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{u.name}</div>
                            <div className="text-[10px] text-text-muted font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-text-secondary">
                            <Mail size={11} className="text-text-muted" /> {u.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-text-secondary">
                            <Phone size={11} className="text-text-muted" /> {u.phone}
                          </div>
                        </div>
                      </td>

                      <td className="table-cell py-4">
                        <Badge variant={getRoleBadgeVariant(u.role)}>{u.role.replace('_', ' ').toUpperCase()}</Badge>
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

                      <td className="table-cell py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openAdminResetModal(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer"
                            title="Reset Password"
                          >
                            <Key size={12} /> Reset Pwd
                          </button>

                          <button
                            onClick={() => openEditUserModal(u)}
                            className="p-1.5 rounded-lg border border-surface-border hover:bg-surface-bg text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 text-status-danger transition-all cursor-pointer disabled:opacity-40"
                            title="Delete User"
                            disabled={u.id === user?.id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted text-sm">
                        No users match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── CREATE / EDIT USER MODAL ─── */}
          <Modal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            title={selectedUser ? 'Edit System User' : 'Register New System User'}
            size="md"
          >
            <form className="space-y-4 text-sm" onSubmit={handleSaveUser}>
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input-field" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Francis Mathea" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input-field" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="user@vedama.co.ke" required />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input type="text" className="input-field" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="0712345678" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">System Role</label>
                  <select className="input-field" value={formRole} onChange={e => setFormRole(e.target.value as UserRole)} required>
                    <option value="admin">Administrator</option>
                    <option value="finance">Finance Agent</option>
                    <option value="landlord">Landlord</option>
                    <option value="client">Client</option>
                    <option value="service_provider">Service Provider</option>
                  </select>
                </div>
                <div>
                  <label className="label">Account Status</label>
                  <select className="input-field" value={formIsActive ? 'active' : 'suspended'} onChange={e => setFormIsActive(e.target.value === 'active')}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="label">
                  {selectedUser ? 'New Password (leave blank to keep current)' : 'Set Login Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showFormPwd ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder={selectedUser ? 'Enter new password to change...' : 'Min. 6 characters'}
                    required={!selectedUser}
                    minLength={selectedUser ? 0 : 6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    {showFormPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role info banners */}
              {formRole === 'landlord' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-xs text-amber-800">
                  <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  This landlord will be auto-linked to the property statement registry.
                </div>
              )}
              {formRole === 'client' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2 text-xs text-blue-800">
                  <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  This client will be auto-synced to the buyers directory for finance linkage.
                </div>
              )}

              <div className="border-t border-surface-border pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary !rounded-full shadow-md">
                  {selectedUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </Modal>

          {/* ─── ADMIN RESET PASSWORD OVERRIDE MODAL ─── */}
          <Modal
            isOpen={isAdminResetOpen}
            onClose={() => setIsAdminResetOpen(false)}
            title="Reset User Password"
            size="sm"
          >
            <form className="space-y-5" onSubmit={handleAdminResetPassword}>
              {resetTargetUser && (
                <div className="flex items-center gap-4 p-4 bg-surface-bg rounded-2xl border border-surface-border">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-vedama-emerald to-vedama-gold shadow-sm shrink-0">
                    {resetTargetUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">{resetTargetUser.name}</div>
                    <div className="text-xs text-text-secondary">{resetTargetUser.email}</div>
                    <Badge variant={getRoleBadgeVariant(resetTargetUser.role)} className="mt-1">
                      {resetTargetUser.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-xs text-amber-800">
                <Key size={14} className="text-amber-500 shrink-0 mt-0.5" />
                As admin, you can set a new password directly. The user will use it on their next login.
              </div>

              <div>
                <label className="label font-bold uppercase tracking-wider text-xs text-text-muted flex items-center gap-1.5">
                  <Key size={13} /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showResetPwd ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowResetPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                    {showResetPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label font-bold uppercase tracking-wider text-xs text-text-muted flex items-center gap-1.5">
                  <RefreshCw size={13} /> Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showResetConfirm ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={resetConfirmPassword}
                    onChange={e => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button type="button" onClick={() => setShowResetConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                    {showResetConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {resetNewPassword && resetConfirmPassword && resetNewPassword !== resetConfirmPassword && (
                  <p className="text-xs text-status-danger mt-1 font-semibold">Passwords do not match</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
                <button type="button" onClick={() => setIsAdminResetOpen(false)} className="btn-secondary">Cancel</button>
                <button
                  type="submit"
                  disabled={isAdminResetting || resetNewPassword !== resetConfirmPassword || resetNewPassword.length < 6}
                  className="btn-primary !rounded-full shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Key size={15} />
                  {isAdminResetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </Modal>

        </div>
      )}

    </div>
  );
}
