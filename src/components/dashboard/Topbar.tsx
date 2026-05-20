import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, LogOut, CheckCircle2, Info, AlertCircle, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { formatDate } from '../../lib/utils';
import ChangePasswordModal from '../auth/ChangePasswordModal';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const { auditLogs } = useDataStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const latestLogs = auditLogs.slice(0, 5);

  const getLogIcon = (action: string) => {
    if (action.includes('PAYMENT') || action.includes('CLEAR')) return <CheckCircle2 size={16} className="text-status-success shrink-0 mt-0.5" />;
    if (action.includes('ERROR') || action.includes('DISTRESS') || action.includes('FAIL')) return <AlertCircle size={16} className="text-status-danger shrink-0 mt-0.5" />;
    return <Info size={16} className="text-vedama-gold shrink-0 mt-0.5" />;
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-surface-border flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-secondary hover:text-vedama-emerald hover:bg-vedama-emerald/10 rounded-xl transition-all active:scale-95"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex relative w-64 lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions, clients..." 
            className="w-full pl-11 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 relative" ref={dropdownRef}>
        <button 
          onClick={() => {
            setIsNotifOpen(!isNotifOpen);
            setUnreadCount(0);
          }}
          className="relative p-2.5 text-text-secondary hover:text-vedama-gold hover:bg-vedama-gold/10 rounded-xl transition-all active:scale-95"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-status-danger rounded-full ring-2 ring-white"></span>
          )}
        </button>

        {isNotifOpen && (
          <div className="absolute right-0 top-14 w-80 bg-white rounded-3xl border border-surface-border shadow-card-lg p-5 z-50 animate-scale-in text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="text-sm font-heading font-bold text-text-primary">System Notifications</h3>
              <button 
                onClick={() => setUnreadCount(0)}
                className="text-[10px] font-bold text-vedama-emerald hover:text-vedama-gold uppercase tracking-wider"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {latestLogs.map((log) => (
                <div key={log.id} className="flex gap-3 hover:bg-surface-bg/50 p-2 -mx-2 rounded-xl transition-colors">
                  {getLogIcon(log.action)}
                  <div className="space-y-1">
                    <div className="font-semibold text-text-primary uppercase tracking-wide text-[9px] flex items-center gap-1.5">
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <p className="text-text-secondary leading-normal text-[11px]">{log.details}</p>
                    <div className="text-[9px] text-text-muted">{formatDate(log.timestamp)}</div>
                  </div>
                </div>
              ))}

              {latestLogs.length === 0 && (
                <div className="text-center py-6 text-text-muted italic">No recent system events logs.</div>
              )}
            </div>
            
            <div className="pt-2 border-t border-surface-border text-center">
              <button 
                onClick={() => {
                  setIsNotifOpen(false);
                  navigate('/dashboard/audit');
                }}
                className="text-[10px] font-bold text-text-secondary hover:text-vedama-emerald uppercase tracking-wider"
              >
                View all audit logs
              </button>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsChangePasswordOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-text-secondary hover:text-vedama-emerald hover:bg-vedama-emerald/10 rounded-xl transition-all active:scale-95 cursor-pointer"
          title="Change Password"
        >
          <Key size={18} />
          <span className="hidden lg:inline">Change Password</span>
        </button>

        <div className="h-8 w-px bg-surface-border"></div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-secondary hover:text-status-danger hover:bg-status-danger/10 rounded-xl transition-all active:scale-95"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </header>
  );
}
