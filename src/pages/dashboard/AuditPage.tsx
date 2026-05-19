import React, { useState } from 'react';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { formatDate, formatDateTime } from '../../lib/utils';

export default function AuditPage() {
  const { auditLogs } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">System Audit Logs</h1>
          <p className="text-text-secondary text-lg">Immutable record of all system activities and administrative actions.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border mb-8 flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up delay-100">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by user, action, or module..." 
            className="w-full pl-12 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Filter className="text-text-muted hidden md:block" size={20} />
          <select className="bg-surface-bg border-none rounded-full px-6 py-3 text-sm font-semibold text-text-secondary focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white transition-all w-full md:w-auto shadow-sm">
            <option value="all">All Modules</option>
            <option value="finance">Finance</option>
            <option value="sales">Sales</option>
            <option value="auth">Authentication</option>
          </select>
        </div>
      </div>

      <div className="card-static overflow-hidden animate-slide-up delay-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header py-4 px-6">Timestamp</th>
                <th className="table-header py-4 px-6">User</th>
                <th className="table-header py-4 px-6">Module</th>
                <th className="table-header py-4 px-6">Action</th>
                <th className="table-header py-4 px-6">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono text-sm">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hover transition-colors">
                  <td className="table-cell py-4 whitespace-nowrap">
                    <span className="text-text-primary">{formatDate(log.timestamp)}</span>
                    <span className="text-text-muted ml-2">{formatDateTime(log.timestamp).split(',')[1]}</span>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-semibold text-text-primary font-body">{log.userName}</div>
                    <div className="text-xs text-text-muted font-body mt-0.5">{log.userId}</div>
                  </td>
                  <td className="table-cell py-4">
                    <span className="px-2 py-1 bg-surface-border/50 rounded text-xs font-semibold uppercase tracking-wider">{log.module}</span>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-bold text-vedama-emerald mb-1">{log.action}</div>
                    <div className="text-text-secondary truncate max-w-[300px]">{log.details}</div>
                  </td>
                  <td className="table-cell py-4 text-text-muted">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
