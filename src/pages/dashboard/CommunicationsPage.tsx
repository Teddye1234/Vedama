import React, { useState, useEffect } from 'react';
import { Send, Filter, Search, MessageSquare, Mail, Bell, ThumbsUp, Calendar, AlertTriangle, FileSpreadsheet, Landmark, Sparkles, Scale, Users, Info, ShieldAlert } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useToastStore } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatDate, formatDateTime } from '../../lib/utils';
import Badge, { statusToBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { CommunicationLog } from '../../types';

export default function CommunicationsPage() {
  const { communicationLogs, addCommunicationLog, addAuditLog, transactions, tenants } = useDataStore();
  const { addToast } = useToastStore();
  const user = useAuthStore(s => s.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');

  // Dynamic composer state
  const [composerAudience, setComposerAudience] = useState<'all_clients' | 'arrears' | 'landlords' | 'custom'>('all_clients');
  const [customPhone, setCustomPhone] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [composerSubject, setComposerSubject] = useState('');
  const [composerMessage, setComposerMessage] = useState('');
  const [composerChannel, setComposerChannel] = useState<'whatsapp' | 'email'>('whatsapp');

  // Live progress meter states
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionProgress, setTransmissionProgress] = useState(0);
  const [transmissionStatusMessage, setTransmissionStatusMessage] = useState('');

  const filteredLogs = communicationLogs.filter(log => {
    const recipientName = log.recipientName || '';
    const subject = log.subject || '';
    const recipient = log.recipient || '';
    const type = log.type || '';
    const matchesSearch = recipientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'all' || type === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const distressTenants = tenants.filter(t => t.status === 'distress');

  // Simulated live campaign broadcast progress bar
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerSubject || !composerMessage) {
      addToast('Please input subject and message details', 'warning');
      return;
    }

    if (composerAudience === 'custom' && !customPhone && !customEmail) {
      addToast('Please enter custom phone or email coordinates', 'warning');
      return;
    }

    // Initiate animated dispatch
    setIsTransmitting(true);
    setTransmissionProgress(0);
    setTransmissionStatusMessage('Initializing bulk carrier queues...');
  };

  useEffect(() => {
    if (!isTransmitting) return;

    const messages = [
      'Initializing bulk carrier queues...',
      'Validating recipient database hashes...',
      'Connecting to NCBA Corporate SMS Gateway...',
      'Dispatched chunk 1 of 4 (Awaiting ACK)...',
      'Dispatched chunk 3 of 4 (Carrier Delivered)...',
      'Compiling audit logs and database references...',
      'Campaign transmission complete!'
    ];

    const timer = setInterval(() => {
      setTransmissionProgress(prev => {
        const next = prev + Math.floor(Math.random() * 15) + 8;
        
        // Map progress percentage to status notes
        const msgIndex = Math.min(
          Math.floor((next / 100) * messages.length), 
          messages.length - 1
        );
        setTransmissionStatusMessage(messages[msgIndex]);

        if (next >= 100) {
          clearInterval(timer);
          
          // Complete campaign logging
          const recipientLabel = 
            composerAudience === 'all_clients' ? 'All Active Clients' : 
            composerAudience === 'arrears' ? 'Clients in Arrears' : 
            composerAudience === 'landlords' ? 'All Registered Landlords' : 
            `Custom Target (${customPhone || customEmail})`;

          const newLog: CommunicationLog = {
            id: `CML-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            type: composerChannel,
            recipient: composerAudience === 'custom' ? (customPhone || customEmail) : 'Various Contacts',
            recipientName: recipientLabel,
            subject: composerSubject,
            message: composerMessage,
            status: 'sent',
            category: composerAudience === 'arrears' ? 'payment_reminder' : 'marketing',
            sentAt: new Date().toISOString(),
          };

          addCommunicationLog(newLog);

          addAuditLog({
            id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            userId: user?.id || 'admin',
            userName: user?.name || 'Administrator',
            action: 'DISPATCH_COMMUNICATION_CAMPAIGN',
            module: 'Communications',
            details: `Broadcasting ${composerChannel.toUpperCase()} campaign. Subject: "${composerSubject}". Target: ${recipientLabel}`,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1'
          });

          addToast(`${composerChannel.toUpperCase()} campaign successfully dispatched to ${recipientLabel}!`, 'success');
          setIsTransmitting(false);
          setIsModalOpen(false);
          
          // Reset states
          setComposerSubject('');
          setComposerMessage('');
          setCustomPhone('');
          setCustomEmail('');
        }
        return next;
      });
    }, 450);

    return () => clearInterval(timer);
  }, [isTransmitting]);

  // Automated Trigger Handlers
  const triggerReminderDueDate = () => {
    const target = transactions[0] || { clientName: 'Mary Njeri', propertyTitle: 'Malindi Oceanview Estate', balance: 500000, reference: 'VDM-2024-001', dueDate: '2024-09-30' };
    const newLog: CommunicationLog = {
      id: `CML-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'whatsapp',
      recipient: '+254745678901',
      recipientName: target.clientName,
      subject: 'Installment Payment Reminder',
      message: `Jambo ${target.clientName}, this is a friendly reminder that your installment of KES ${target.balance.toLocaleString()} for ${target.propertyTitle} is due on ${formatDate(target.dueDate)}. Please clear using Reference: ${target.reference} to avoid penalties. Vedama Company Ltd.`,
      status: 'delivered',
      category: 'payment_reminder',
      sentAt: new Date().toISOString()
    };
    addCommunicationLog(newLog);
    addToast(`WhatsApp Reminder dispatched to ${target.clientName}!`, 'success');
  };

  const triggerThankYouPurchase = () => {
    const target = transactions[0] || { clientName: 'Mary Njeri', propertyTitle: 'Malindi Oceanview Estate', plotCount: 2 };
    const newLog: CommunicationLog = {
      id: `CML-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'whatsapp',
      recipient: '+254745678901',
      recipientName: target.clientName,
      subject: 'Thank You for Investing!',
      message: `Thank you ${target.clientName} for investing in ${target.propertyTitle}! We have sealed your purchase deal for ${target.plotCount} plot(s). The certified title deed transfer process is now underway. Welcome to the Vedama family!`,
      status: 'delivered',
      category: 'receipt',
      sentAt: new Date().toISOString()
    };
    addCommunicationLog(newLog);
    addToast(`Thank You receipt note sent to ${target.clientName}!`, 'success');
  };

  const triggerInvitationFuture = () => {
    const targetName = 'Mary Njeri';
    const newLog: CommunicationLog = {
      id: `CML-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'whatsapp',
      recipient: '+254745678901',
      recipientName: targetName,
      subject: 'Exclusive Site Visit Invitation',
      message: `Jambo ${targetName}! Vedama Company Limited cordially invites you to our exclusive upcoming site survey visit to Diani Palm Beach Plots this Saturday. Complimentary board transport provided! Reply YES to book your slot.`,
      status: 'delivered',
      category: 'marketing',
      sentAt: new Date().toISOString()
    };
    addCommunicationLog(newLog);
    addToast(`Site visit broadcast invitation sent to ${targetName}!`, 'info');
  };

  const triggerReminderFinalBalance = () => {
    const target = transactions[0] || { clientName: 'Mary Njeri', propertyTitle: 'Malindi Oceanview Estate', balance: 500000, reference: 'VDM-2024-001' };
    const newLog: CommunicationLog = {
      id: `CML-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'whatsapp',
      recipient: '+254745678901',
      recipientName: target.clientName,
      subject: 'URGENT: Final Balance Outstanding',
      message: `URGENT ALERT: Dear ${target.clientName}, your final outstanding balance of KES ${target.balance.toLocaleString()} for ${target.propertyTitle} is now due. Please clear via bank or M-Pesa using Reference: ${target.reference} today. Vedama Company Ltd.`,
      status: 'sent',
      category: 'alert',
      sentAt: new Date().toISOString()
    };
    addCommunicationLog(newLog);
    addToast(`Urgent final balance alert dispatched to ${target.clientName}!`, 'warning');
  };

  const triggerDailySummaryAdmin = () => {
    const adminName = 'James Mwangi';
    const totalDueToday = transactions.reduce((sum, t) => sum + t.balance, 0);
    const newLog: CommunicationLog = {
      id: `CML-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'whatsapp',
      recipient: '+254712345678',
      recipientName: adminName,
      subject: 'Daily Payments Due Report Summary',
      message: `SYSTEM STATUS: Daily payments due report generated for Administrator. Total KES ${totalDueToday.toLocaleString()} outstanding across ${transactions.length} active client acquisition files. Active ledgers verified.`,
      status: 'delivered',
      category: 'alert',
      sentAt: new Date().toISOString()
    };
    addCommunicationLog(newLog);
    addToast("Daily Payments briefing dispatched to Administrator's dashboard!", 'success');
  };

  const triggerWebhookAdminAlert = () => {
    const adminName = 'James Mwangi';
    const target = transactions[0] || { clientName: 'Mary Njeri', amountPaid: 1200000, reference: 'VDM-2024-001' };
    const newLog: CommunicationLog = {
      id: `CML-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'whatsapp',
      recipient: '+254712345678',
      recipientName: adminName,
      subject: 'Instant Bank Payment Notification',
      message: `BANK WEBHOOK: Payment clearance of KES ${target.amountPaid.toLocaleString()} confirmed from client ${target.clientName} using Reference: ${target.reference}. Connected NCBA Escrow trust balance updated instantly.`,
      status: 'delivered',
      category: 'alert',
      sentAt: new Date().toISOString()
    };
    addCommunicationLog(newLog);
    addToast("Real-time Bank clearance alert pushed to Administrator!", 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Communication Engine</h1>
          <p className="text-text-secondary text-lg">Automated corporate triggers, bulk campaigns, and distress warrant transmissions.</p>
        </div>
        <button 
          onClick={() => {
            setComposerAudience('all_clients');
            setComposerChannel('whatsapp');
            setIsModalOpen(true);
          }} 
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full"
        >
          <Send size={18} /> Send Custom Campaign
        </button>
      </div>

      {/* AUTOMATED CORPORATE ALERTS ENGINE CONSOLE */}
      <div className="bg-white p-6 rounded-3xl border-2 border-vedama-gold/20 shadow-card animate-slide-up delay-100 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-surface-border">
          <Sparkles className="text-vedama-gold animate-pulse" size={20} />
          <div>
            <h3 className="font-heading font-bold text-text-primary">Vedama Automated Broadcast Engine</h3>
            <p className="text-[11px] text-text-secondary">Simulate and dispatch automatic client-specific alerts for operational activities.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <button 
            onClick={triggerReminderDueDate}
            className="flex items-start gap-3 p-4 bg-surface-bg border border-surface-border hover:border-vedama-emerald rounded-2xl text-left transition-all group"
          >
            <div className="p-2.5 bg-vedama-emerald/10 text-vedama-emerald rounded-xl group-hover:scale-105 transition-transform"><Calendar size={18} /></div>
            <div>
              <div className="font-bold text-xs text-text-primary">1. Remind Client of Due Date</div>
              <p className="text-[10px] text-text-secondary mt-1">Dispatches scheduled installment due alert to buyer.</p>
            </div>
          </button>

          <button 
            onClick={triggerThankYouPurchase}
            className="flex items-start gap-3 p-4 bg-surface-bg border border-surface-border hover:border-vedama-emerald rounded-2xl text-left transition-all group"
          >
            <div className="p-2.5 bg-green-50 text-status-success rounded-xl group-hover:scale-105 transition-transform"><ThumbsUp size={18} /></div>
            <div>
              <div className="font-bold text-xs text-text-primary">2. Thank Client for Purchase</div>
              <p className="text-[10px] text-text-secondary mt-1">Sends official WhatsApp receipt & welcoming note.</p>
            </div>
          </button>

          <button 
            onClick={triggerInvitationFuture}
            className="flex items-start gap-3 p-4 bg-surface-bg border border-surface-border hover:border-vedama-emerald rounded-2xl text-left transition-all group"
          >
            <div className="p-2.5 bg-blue-50 text-status-info rounded-xl group-hover:scale-105 transition-transform"><Send size={18} /></div>
            <div>
              <div className="font-bold text-xs text-text-primary">3. Invite to Future Properties</div>
              <p className="text-[10px] text-text-secondary mt-1">Sends broadcast invitations to upcoming Diani beach site surveys.</p>
            </div>
          </button>

          <button 
            onClick={triggerReminderFinalBalance}
            className="flex items-start gap-3 p-4 bg-surface-bg border border-surface-border hover:border-vedama-emerald rounded-2xl text-left transition-all group"
          >
            <div className="p-2.5 bg-red-50 text-status-danger rounded-xl group-hover:scale-105 transition-transform"><AlertTriangle size={18} /></div>
            <div>
              <div className="font-bold text-xs text-text-primary">4. Remind of Final Balance Due</div>
              <p className="text-[10px] text-text-secondary mt-1">Dispatches urgent final balance clearance notification.</p>
            </div>
          </button>

          <button 
            onClick={triggerDailySummaryAdmin}
            className="flex items-start gap-3 p-4 bg-surface-bg border border-surface-border hover:border-vedama-emerald rounded-2xl text-left transition-all group"
          >
            <div className="p-2.5 bg-amber-50 text-vedama-gold rounded-xl group-hover:scale-105 transition-transform"><FileSpreadsheet size={18} /></div>
            <div>
              <div className="font-bold text-xs text-text-primary">5. Daily Payments Summary to Admin</div>
              <p className="text-[10px] text-text-secondary mt-1">Dispatches administrative brief of daily targets to CEO.</p>
            </div>
          </button>

          <button 
            onClick={triggerWebhookAdminAlert}
            className="flex items-start gap-3 p-4 bg-surface-bg border border-surface-border hover:border-vedama-emerald rounded-2xl text-left transition-all group"
          >
            <div className="p-2.5 bg-green-50 text-status-success rounded-xl group-hover:scale-105 transition-transform"><Landmark size={18} /></div>
            <div>
              <div className="font-bold text-xs text-text-primary">6. Notify Admin on Bank Payment</div>
              <p className="text-[10px] text-text-secondary mt-1">Triggers immediate SMS to admin as NCBA Webhook processes.</p>
            </div>
          </button>

        </div>
      </div>

      {/* ACTIVE DISTRESS LAWYER REVIEW BOARD */}
      {distressTenants.length > 0 && (
        <div className="bg-red-50/15 p-6 rounded-3xl border border-status-danger/25 shadow-card animate-slide-up space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
            <Scale className="text-status-danger animate-pulse" size={20} />
            <div>
              <h3 className="font-heading font-bold text-text-primary text-base">⚖️ Active Distress & Eviction Warrant Review Board</h3>
              <p className="text-[11px] text-text-secondary">Direct operational references submitted to legal counsel firm: **Muriuki & Partners Advocates** (`+254722888999`).</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/40 border-b border-surface-border text-[10px] uppercase text-text-muted font-bold">
                  <th className="py-3 px-4">Distressed Tenant</th>
                  <th className="py-3 px-4">Asset Allocation</th>
                  <th className="py-3 px-4">Outstanding Balances</th>
                  <th className="py-3 px-4">Legal Representative Firm</th>
                  <th className="py-3 px-4">Dispatch Reference</th>
                  <th className="py-3 px-4">Transmission Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {distressTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-red-50/5">
                    <td className="py-3.5 px-4 font-semibold text-text-primary">{t.name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-text-secondary">Unit {t.unitNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-status-danger text-sm">
                      {t.balance.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-vedama-emerald">
                      {t.advocateName || 'Muriuki & Partners Advocates'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-text-muted">
                      REF-EV-W-{t.unitNumber}-{t.id.toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-red-100 text-status-danger rounded-full font-bold text-[9px] inline-flex items-center gap-1 uppercase tracking-wider">
                        <ShieldAlert size={10} /> Dispatched to Advocates
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => {
                          addToast(`Legal distress dossier SMS transmitted to Muriuki & Partners at +254722888999!`, 'success');
                          addAuditLog({
                            id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                            userId: user?.id || 'admin',
                            userName: user?.name || 'Administrator',
                            action: 'RETRANS_LAW_DOSSIER',
                            module: 'Communications',
                            details: `Re-sent evictions details dossier for ${t.name} to lawyer firm.`,
                            timestamp: new Date().toISOString(),
                            ipAddress: '127.0.0.1'
                          });
                        }}
                        className="px-2.5 py-1 bg-vedama-emerald/10 hover:bg-vedama-emerald hover:text-white text-vedama-emerald rounded-full font-bold text-[9px] uppercase tracking-wider transition-colors"
                      >
                        Push SMS Notice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border mb-8 flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up delay-150">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search logs by recipient or subject..." 
            className="w-full pl-12 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Filter className="text-text-muted hidden md:block" size={20} />
          <select 
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="bg-surface-bg border-none rounded-full px-6 py-3 text-sm font-semibold text-text-secondary focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white transition-all w-full md:w-auto shadow-sm"
          >
            <option value="all">All Channels</option>
            <option value="whatsapp">WhatsApp Logs</option>
            <option value="email">Email Logs</option>
          </select>
        </div>
      </div>

      {/* DISPATCH HISTORY LOG TABLE */}
      <div className="card-static overflow-hidden animate-slide-up delay-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Timestamp</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Channel</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Recipient Name</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Category & Content Message</th>
                <th className="table-header py-4 px-6 text-xs uppercase text-text-muted font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hover transition-colors text-xs">
                  <td className="table-cell py-4 whitespace-nowrap">
                    <div className="font-semibold text-text-primary text-sm">{formatDate(log.sentAt || new Date().toISOString())}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{(formatDateTime(log.sentAt || new Date().toISOString()).split(',')[1] || '')}</div>
                  </td>
                  <td className="table-cell py-4 font-semibold uppercase">
                    <div className="flex items-center gap-2">
                      {log.type === 'whatsapp' ? <MessageSquare size={16} className="text-green-600 font-bold" /> : <Mail size={16} className="text-blue-600 font-bold" />}
                      <span>{log.type || ''}</span>
                    </div>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-bold text-text-primary text-sm">{log.recipientName || ''}</div>
                    <div className="text-[10px] text-text-muted mt-0.5 font-mono">{log.recipient || ''}</div>
                  </td>
                  <td className="table-cell py-4 max-w-[350px]">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-vedama-gold mb-1">{(log.category || '').replace('_', ' ')}</div>
                    <p className="font-medium leading-relaxed text-text-secondary whitespace-normal">{log.message || ''}</p>
                  </td>
                  <td className="table-cell py-4">
                    <Badge variant={statusToBadge(log.status || 'sent')}>{(log.status || 'sent').toUpperCase()}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. COMPOSE CUSTOM CAMPAIGN MODAL WITH LIVE TRANSMISSION PROGRESS METER */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Compose Custom Campaign Broadcast" size="md">
        {isTransmitting ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-vedama-gold/10 border-t-vedama-emerald rounded-full animate-spin"></div>
              <Sparkles size={24} className="text-vedama-gold absolute animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-lg text-text-primary">Transmitting Secure Gateway Broadcast...</h3>
              <p className="text-xs text-text-muted font-mono animate-pulse">{transmissionStatusMessage}</p>
            </div>
            
            {/* Elegant Progress bar */}
            <div className="w-full max-w-sm bg-surface-bg border border-surface-border rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-vedama-emerald to-vedama-gold h-full rounded-full transition-all duration-300 shadow"
                style={{ width: `${transmissionProgress}%` }}
              ></div>
            </div>
            
            <div className="text-xs font-bold text-vedama-emerald">{transmissionProgress}% Outward Bound</div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSendMessage}>
            <div className="text-xs space-y-4">
              <div>
                <label className="label">Communication Gateway Channel</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2.5 cursor-pointer p-3.5 border border-surface-border rounded-xl flex-1 hover:border-vedama-emerald transition-colors bg-surface-bg/30">
                    <input 
                      type="radio" 
                      name="channel" 
                      value="whatsapp" 
                      checked={composerChannel === 'whatsapp'} 
                      onChange={() => setComposerChannel('whatsapp')}
                      className="text-vedama-emerald focus:ring-vedama-emerald" 
                    />
                    <MessageSquare size={18} className="text-green-500 font-bold" /> WhatsApp API Gateway
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3.5 border border-surface-border rounded-xl flex-1 hover:border-vedama-emerald transition-colors bg-surface-bg/30">
                    <input 
                      type="radio" 
                      name="channel" 
                      value="email" 
                      checked={composerChannel === 'email'} 
                      onChange={() => setComposerChannel('email')}
                      className="text-vedama-emerald focus:ring-vedama-emerald" 
                    />
                    <Mail size={18} className="text-blue-500 font-bold" /> Corporate Email
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Target Broadcast Audience Group</label>
                <select 
                  value={composerAudience} 
                  onChange={(e) => setComposerAudience(e.target.value as any)} 
                  className="input-field" 
                  required
                >
                  <option value="all_clients">All Active Client Investors</option>
                  <option value="arrears">Arrears/Delinquent Tenancies</option>
                  <option value="landlords">All Registered Landowners</option>
                  <option value="custom">Custom Recipient List...</option>
                </select>
              </div>

              {/* DYNAMIC COORDINATES TEXT BOXES */}
              {composerAudience === 'custom' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/20 border border-vedama-gold/25 rounded-2xl animate-slide-up space-y-0">
                  <div className="col-span-2 flex items-center gap-1.5 text-vedama-gold-dark font-bold text-[9px] uppercase tracking-wider mb-2">
                    <Users size={12} /> Custom Destination Details
                  </div>
                  <div>
                    <label className="label">Destination Phone Number</label>
                    <input 
                      type="tel" 
                      className="input-field" 
                      placeholder="e.g. +254712345678" 
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Destination Email Address</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="e.g. buyer@domain.com" 
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Campaign Heading / Subject</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Certified Title Deed Clearance Notice" 
                  value={composerSubject}
                  onChange={(e) => setComposerSubject(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label className="label">Message Body / Broadcast Copy</label>
                <textarea 
                  className="input-field min-h-[120px]" 
                  placeholder="Jambo from Vedama Company Limited! Type broadcast message contents..." 
                  value={composerMessage}
                  onChange={(e) => setComposerMessage(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
            
            <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2 !rounded-full shadow-md">
                <Send size={14}/> Dispatch Campaign
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
