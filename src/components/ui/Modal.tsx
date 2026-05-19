import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
      <div
        className={`relative bg-white rounded-3xl shadow-card-lg w-full ${sizes[size]} my-auto overflow-hidden flex flex-col animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border bg-white sticky top-0 z-10 shrink-0">
          <h2 className="text-lg sm:text-xl font-heading font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-xl hover:bg-surface-hover">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 sm:p-8 overflow-y-auto flex-grow max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
}
