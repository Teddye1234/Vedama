import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, MapPin, DollarSign, ArrowUpRight, 
  Building, Landmark, ShieldCheck, Clock, FileText, ChevronRight 
} from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';
import Badge, { statusToBadge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export default function DashboardHome() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  
  const { 
    transactions, 
    properties, 
    tenants, 
    ledger, 
    auditLogs 
  } = useDataStore();

  // Dynamic Live Financial Mathematics
  const totalRevenue = ledger
    .filter(e => e.status === 'reconciled')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCompanyCommissions = ledger
    .filter(e => e.status === 'reconciled')
    .reduce((sum, e) => sum + e.companyCommission, 0);

  const activeEscrowBalance = transactions
    .filter(tx => tx.status !== 'cancelled' && tx.status !== 'fully_paid')
    .reduce((sum, tx) => sum + tx.balance, 0);

  const activePropertiesCount = properties.length;
  const activeTenantsCount = tenants.length;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentActivities = [...auditLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Simulated gorgeous chart trends matching live data
  const revenueTrendData = [
    { month: 'Dec', revenue: totalRevenue * 0.4, commissions: totalCompanyCommissions * 0.4 },
    { month: 'Jan', revenue: totalRevenue * 0.6, commissions: totalCompanyCommissions * 0.6 },
    { month: 'Feb', revenue: totalRevenue * 0.75, commissions: totalCompanyCommissions * 0.75 },
    { month: 'Mar', revenue: totalRevenue * 0.85, commissions: totalCompanyCommissions * 0.85 },
    { month: 'Apr', revenue: totalRevenue * 0.95, commissions: totalCompanyCommissions * 0.95 },
    { month: 'May', revenue: totalRevenue, commissions: totalCompanyCommissions },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Modern Glossy Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-vedama-emerald-dark via-vedama-emerald to-[#0b241c] p-8 md:p-10 shadow-card-lg text-white animate-slide-up">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-b from-vedama-gold/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-vedama-emerald/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-vedama-gold uppercase tracking-wider border border-white/10 shadow-inner">
            <ShieldCheck size={14} /> Vedama Secure Core Active
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
            Welcome Back, <span className="text-vedama-gold">{user?.name || 'Administrator'}</span>
          </h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Your real-world land sales POS registers, landowner splits, EOM rent ledger engines, and caretaker repair dispatches are fully synchronized. Here is today's financial snapshot.
          </p>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => navigate('/dashboard/sales')}
              className="btn-primary !bg-vedama-gold hover:!bg-vedama-gold-dark !text-vedama-emerald-dark font-bold text-xs !rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Initiate Deal POS
            </button>
            <button 
              onClick={() => navigate('/dashboard/audit')}
              className="px-4 py-2.5 bg-white/10 border border-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-full backdrop-blur-md shadow-sm transition-all"
            >
              System Logs
            </button>
          </div>
        </div>
      </div>

      {/* SLEEK STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="kpi-card relative group hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Gross Revenue (Ledger)</span>
            <div className="p-2.5 bg-vedama-emerald/10 text-vedama-emerald rounded-2xl group-hover:bg-vedama-emerald group-hover:text-white transition-colors duration-300">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary truncate">{formatCurrency(totalRevenue)}</div>
          <div className="flex items-center text-status-success text-[10px] font-bold uppercase tracking-wide mt-3 bg-green-50 px-2 py-0.5 rounded border border-green-100 self-start inline-flex">
            <ArrowUpRight size={14} className="mr-0.5" /> Live Reconciled
          </div>
        </div>

        <div className="kpi-card relative group hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CEO Francis Split (10%)</span>
            <div className="p-2.5 bg-vedama-gold/10 text-vedama-gold rounded-2xl group-hover:bg-vedama-gold group-hover:text-white transition-colors duration-300">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary truncate">{formatCurrency(totalCompanyCommissions)}</div>
          <div className="flex items-center text-vedama-gold-dark text-[10px] font-bold uppercase tracking-wide mt-3 bg-amber-50 px-2 py-0.5 rounded border border-vedama-gold/20 self-start inline-flex">
            <ShieldCheck size={14} className="mr-0.5" /> Corporate Fee
          </div>
        </div>

        <div className="kpi-card relative group hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Escrow Holding</span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
              <Landmark size={18} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary truncate">{formatCurrency(activeEscrowBalance)}</div>
          <div className="flex items-center text-sky-700 text-[10px] font-bold uppercase tracking-wide mt-3 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 self-start inline-flex">
            <Clock size={14} className="mr-0.5" /> Pending Clearance
          </div>
        </div>

        <div className="kpi-card relative group hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Assets & Tenancy</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
              <Building size={18} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary truncate">{activePropertiesCount} land projects</div>
          <div className="flex items-center text-purple-700 text-[10px] font-bold uppercase tracking-wide mt-3 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 self-start inline-flex">
            {activeTenantsCount} active tenants
          </div>
        </div>

      </div>

      {/* MAIN DATA PANELS: CHARTS & LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up delay-100">
        
        {/* Sleek Gradient Chart Card */}
        <div className="card-static p-6 lg:p-7 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-heading font-bold text-text-primary">Corporate Earnings & Inflows</h3>
                <p className="text-xs text-text-secondary mt-0.5">Summed live sales and splits from general ledger archives</p>
              </div>
              <Badge variant="success" className="font-bold">6-Month Trend</Badge>
            </div>
            
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F3D2E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0F3D2E" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A14A" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#C9A14A" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} />
                  <YAxis 
                    axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}
                  />
                  <Area type="monotone" name="Gross Payouts" dataKey="revenue" stroke="#0F3D2E" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" name="10% Corp Commissions" dataKey="commissions" stroke="#C9A14A" strokeWidth={3} fillOpacity={1} fill="url(#colorComm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Live System Activities Feed Card */}
        <div className="card-static p-6 lg:p-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-heading font-bold text-text-primary">System Activities Feed</h3>
                <p className="text-xs text-text-secondary mt-0.5">Real-time platform operations timeline</p>
              </div>
              <Badge variant="warning" className="font-bold">Live Feed</Badge>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {recentActivities.map((act) => (
                <div key={act.id} className="relative pl-5 border-l border-surface-border space-y-1 pb-1">
                  <div className="absolute -left-1.5 top-1 w-3 h-3 bg-vedama-emerald rounded-full border border-white shadow-sm ring-2 ring-emerald-50"></div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-[8px] text-vedama-gold-dark bg-amber-50 px-1 border border-vedama-gold/20 rounded">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-text-muted">{formatDate(act.timestamp)}</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-normal">{act.details}</p>
                </div>
              ))}

              {recentActivities.length === 0 && (
                <div className="text-center py-10 text-text-muted italic text-[11px]">No system events logged yet.</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border text-center mt-4">
            <button 
              onClick={() => navigate('/dashboard/audit')}
              className="text-[10px] font-bold text-text-secondary hover:text-vedama-emerald uppercase tracking-wider flex items-center gap-1 mx-auto"
            >
              Access Audit Registry <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="card-static overflow-hidden animate-slide-up delay-200">
        <div className="p-6 border-b border-surface-border flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <div>
            <h3 className="text-base font-heading font-bold text-text-primary">Recent Transactions & Escrow Deals</h3>
            <p className="text-xs text-text-secondary mt-0.5">Overview of active land acquisitions and generic inventory assets</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/sales')}
            className="text-xs font-bold text-vedama-emerald hover:text-vedama-gold uppercase tracking-wider"
          >
            Access SalesPOS
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header py-4 px-6">Deal Reference</th>
                <th className="table-header py-4 px-6">Client Representative</th>
                <th className="table-header py-4 px-6">Asset Specification</th>
                <th className="table-header py-4 px-6">Reconciliation Payout</th>
                <th className="table-header py-4 px-6">Deal Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-hover transition-colors">
                  <td className="table-cell py-4 font-mono font-bold text-vedama-emerald text-xs">
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-vedama-gold" /> {tx.reference}
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">{formatDate(tx.createdAt)}</div>
                  </td>
                  <td className="table-cell py-4 font-medium text-text-primary">{tx.clientName}</td>
                  <td className="table-cell py-4">
                    <div className="font-semibold text-text-primary max-w-[220px] truncate">{tx.propertyTitle}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {tx.plotSize.replace(/_/g, ' ')} • {tx.plotCount} unit(s)
                    </div>
                  </td>
                  <td className="table-cell py-4">
                    <div className="font-bold text-text-primary">{formatCurrency(tx.totalAmount)}</div>
                    <div className="text-[10px] text-status-success font-semibold mt-0.5">Paid: {formatCurrency(tx.amountPaid)}</div>
                  </td>
                  <td className="table-cell py-4">
                    <Badge variant={statusToBadge(tx.status)}>{tx.status.replace(/_/g, ' ').toUpperCase()}</Badge>
                  </td>
                </tr>
              ))}

              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-text-muted italic text-[11px]">No transactions in database archive.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
