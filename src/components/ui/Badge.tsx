import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  danger: 'bg-status-danger-bg text-status-danger',
  info: 'bg-status-info-bg text-status-info',
  neutral: 'bg-gray-100 text-gray-600',
  gold: 'bg-vedama-gold/15 text-vedama-gold-dark',
};

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function statusToBadge(status: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    active: 'success', fully_paid: 'success', completed: 'success', reconciled: 'success', confirmed: 'success', approved: 'success', delivered: 'success', sent: 'success',
    pending: 'warning', partially_paid: 'warning', deposit_paid: 'warning', negotiating: 'warning', in_progress: 'warning', pending_approval: 'warning', quoted: 'info', assigned: 'info',
    cancelled: 'danger', distress: 'danger', failed: 'danger', rejected: 'danger', suspended: 'danger',
    selling: 'gold', available: 'info', arrears: 'warning',
  };
  return map[status] ?? 'neutral';
}
