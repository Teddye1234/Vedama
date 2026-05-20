import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  CircleDollarSign, 
  Wallet, 
  Building, 
  Wrench, 
  MessageSquare, 
  BarChart3, 
  ShieldAlert,
  X,
  Users
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const user = useAuthStore(s => s.user);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'finance'] },
    { name: 'Properties', path: '/dashboard/properties', icon: MapIcon, roles: ['admin'] },
    { name: 'User Management', path: '/dashboard/users', icon: Users, roles: ['admin'] },
    { name: 'Land Sales POS', path: '/dashboard/sales', icon: CircleDollarSign, roles: ['admin', 'finance'] },
    { name: 'Finance Ledger', path: '/dashboard/finance', icon: Wallet, roles: ['admin', 'finance'] },
    { name: 'Property Mgmt', path: '/dashboard/property-mgmt', icon: Building, roles: ['admin'] },
    { name: 'Service Providers', path: '/dashboard/service-providers', icon: Wrench, roles: ['admin'] },
    { name: 'Communications', path: '/dashboard/communications', icon: MessageSquare, roles: ['admin'] },
    { name: 'Reports', path: '/dashboard/reports', icon: BarChart3, roles: ['admin', 'finance'] },
    { name: 'Audit Logs', path: '/dashboard/audit', icon: ShieldAlert, roles: ['admin'] },
  ];

  const visibleItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-vedama-emerald-dark border-r border-white/10 text-white">
      <div className="flex items-center justify-between h-20 px-6 border-b border-white/10 shrink-0">
        <Logo variant="light" size="sm" />
        <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white p-1">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
        {visibleItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group
                ${isActive ? 'text-vedama-gold shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/5'}
              `}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-vedama-gold/20 to-transparent opacity-100 transition-opacity duration-300"></div>
              )}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-vedama-gold rounded-r-md"></div>
              )}
              <div className={`relative z-10 transition-transform duration-300 ${!isActive && 'group-hover:translate-x-1'}`}>
                <Icon size={20} className={isActive ? 'text-vedama-gold drop-shadow-sm' : 'text-white/60 group-hover:text-white/90'} />
              </div>
              <span className={`font-semibold relative z-10 transition-transform duration-300 ${!isActive && 'group-hover:translate-x-1'}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="glass-dark rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vedama-gold to-vedama-gold-dark flex items-center justify-center font-heading font-bold text-lg text-white shadow-md group-hover:scale-105 transition-transform">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-white">{user?.name}</span>
            <span className="text-xs text-vedama-gold uppercase tracking-wider truncate font-medium">{user?.role.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
