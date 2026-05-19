import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { 
  sm: { icon: 24, text: 'text-lg', sub: 'text-[9px]' }, 
  md: { icon: 32, text: 'text-xl', sub: 'text-[10px]' }, 
  lg: { icon: 40, text: 'text-2xl', sub: 'text-xs' } 
};

export default function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const s = sizes[size];
  const user = useAuthStore((state) => state.user);
  
  // Dynamically determine the correct home page depending on role
  let homeRoute = '/';
  if (user) {
    if (user.role === 'client') homeRoute = '/client';
    else if (user.role === 'landlord') homeRoute = '/landlord';
    else homeRoute = '/dashboard';
  }

  const textColor = variant === 'light' ? 'text-white' : 'text-vedama-emerald';
  const subColor = variant === 'light' ? 'text-vedama-gold' : 'text-vedama-gold';

  return (
    <Link to={homeRoute} className="flex items-center gap-2.5 hover:opacity-90 active:scale-95 transition-all">
      <div className="flex items-center justify-center bg-white rounded-lg p-1 shadow-sm overflow-hidden">
        <img src="/logo.png" alt="Vedama Logo" className="object-contain w-full h-full" style={{ width: s.icon, height: s.icon }} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-heading font-bold ${s.text} ${textColor}`}>Vedama</span>
        <span className={`font-body font-semibold uppercase tracking-widest ${s.sub} ${subColor}`}>Company Limited</span>
      </div>
    </Link>
  );
}
