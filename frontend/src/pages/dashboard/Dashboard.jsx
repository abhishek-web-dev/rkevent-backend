import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../../api/dashboard.api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  Users,
  FileText,
  AlertTriangle,
  PlusCircle,
  FolderOpen,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // auto refetch every 30s
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse flex items-center space-x-2">
          <span>Loading dashboard statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/25 rounded-3xl text-rose-400 flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load dashboard metrics: {error.message}</span>
      </div>
    );
  }

  const stats = data?.data || {
    totalRevenue: 0,
    totalPaid: 0,
    totalPending: 0,
    customersCount: 0,
    invoicesCount: 0,
    overdueInvoicesCount: 0,
    recentInvoices: [],
    monthlyRevenue: [],
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val || 0);
  };

  // KPI card configuration
  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      color: 'from-violet-500/10 to-indigo-500/10 border-violet-500/20 text-violet-400',
    },
    {
      title: 'Amount Paid',
      value: formatCurrency(stats.totalPaid),
      icon: IndianRupee,
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
    },
    {
      title: 'Amount Pending',
      value: formatCurrency(stats.totalPending),
      icon: IndianRupee,
      color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400',
    },
    {
      title: 'Total Customers',
      value: stats.customersCount,
      icon: Users,
      color: 'from-blue-500/10 to-sky-500/10 border-blue-500/20 text-blue-400',
    },
    {
      title: 'Total Invoices',
      value: stats.invoicesCount,
      icon: FileText,
      color: 'from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 text-purple-400',
    },
    {
      title: 'Overdue Invoices',
      value: stats.overdue.count,
      icon: AlertTriangle,
      color: 'from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400',
    },
  ];

  // Helper to map month number to name
  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || '';
  };

  // Generate values for SVG chart height
  const maxRevenue = Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1000);
  const chartHeight = 180;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Here is a summary of your events billing data.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/invoices/create">
            <Button className="rounded-2xl flex items-center space-x-2">
              <PlusCircle className="w-4 h-4" />
              <span>Create Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="h-32 animate-pulse bg-white/[0.01]" />
            ))
          : kpiCards.map((kpi) => (
              <Card key={kpi.title} className={`border bg-gradient-to-tr ${kpi.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {kpi.title}
                  </span>
                  <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <kpi.icon className="w-5.5 h-5.5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white mt-4 font-sans tracking-tight">
                  {kpi.value}
                </div>
              </Card>
            ))}
      </div>

      {/* Main Charts & Action split section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Custom SVG Revenue Chart Card */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-brand-light" />
              <h3 className="text-lg font-bold text-white">Monthly Revenue Trends</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Last 12 Months</span>
          </div>

          {isLoading ? (
            <div className="h-[180px] w-full bg-white/[0.01] animate-pulse rounded-2xl" />
          ) : stats.monthlyRevenue.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">
              No revenue history recorded yet
            </div>
          ) : (
            <div className="relative pt-6">
              {/* Custom SVG Bar Chart */}
              <div className="flex justify-between items-end h-[180px] px-2 relative z-10">
                {stats.monthlyRevenue.slice().reverse().map((m, index) => {
                  const percent = (m.revenue / maxRevenue) * 100;
                  const barHeight = Math.max((percent * chartHeight) / 100, 8); // min 8px height
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 mx-1.5 group cursor-pointer">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-[-25px] bg-[#140e21] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white pointer-events-none shadow-lg whitespace-nowrap">
                        {formatCurrency(m.revenue)}
                      </div>
                      
                      {/* Active chart bar */}
                      <div
                        style={{ height: `${barHeight}px` }}
                        className="w-full bg-gradient-to-t from-brand to-brand-light rounded-t-lg group-hover:from-brand-light group-hover:to-fuchsia-400 transition-all duration-300 relative shadow-lg shadow-brand/10"
                      />
                      
                      <span className="text-[10px] font-semibold text-slate-400 mt-2 block uppercase tracking-wider">
                        {getMonthName(m.month)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Lines in background */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-white/5 pb-[28px]">
                <div className="border-t border-white/[0.02] w-full h-0" />
                <div className="border-t border-white/[0.02] w-full h-0" />
                <div className="border-t border-white/[0.02] w-full h-0" />
              </div>
            </div>
          )}
        </Card>

        {/* Quick Actions & Overdue Summary */}
        <div className="space-y-6 flex flex-col">
          {/* Quick Actions Panel */}
          <Card className="flex-1">
            <h3 className="text-lg font-bold text-white mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/invoices/create" className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                <PlusCircle className="w-6 h-6 text-brand-light group-hover:scale-115 transition-transform" />
                <span className="text-xs font-semibold text-slate-300 mt-3.5 text-center">New Invoice</span>
              </Link>
              <Link to="/customers/add" className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                <Users className="w-6 h-6 text-brand-light group-hover:scale-115 transition-transform" />
                <span className="text-xs font-semibold text-slate-300 mt-3.5 text-center">Add Customer</span>
              </Link>
              <Link to="/settings/backup" className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                <FolderOpen className="w-6 h-6 text-brand-light group-hover:scale-115 transition-transform" />
                <span className="text-xs font-semibold text-slate-300 mt-3.5 text-center">Backups</span>
              </Link>
              <Link to="/invoices" className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                <FileText className="w-6 h-6 text-brand-light group-hover:scale-115 transition-transform" />
                <span className="text-xs font-semibold text-slate-300 mt-3.5 text-center">View Billing</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Invoices & Overdue Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices Table */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Recent Invoices</h3>
            <Link to="/invoices" className="text-brand-light text-xs font-semibold hover:text-fuchsia-400 transition-colors flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-white/[0.01] animate-pulse rounded-xl" />
              ))}
            </div>
          ) : stats.recentInvoices.length === 0 ? (
            <div className="text-slate-500 text-sm py-6 text-center">No invoices created yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-semibold">
                    <th className="pb-3 text-xs uppercase tracking-wider font-bold">Number</th>
                    <th className="pb-3 text-xs uppercase tracking-wider font-bold">Customer</th>
                    <th className="pb-3 text-xs uppercase tracking-wider font-bold">Total</th>
                    <th className="pb-3 text-xs uppercase tracking-wider font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recentInvoices.map((inv) => (
                    <tr key={inv._id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 font-semibold text-brand-light group-hover:text-fuchsia-400">
                        <Link to={`/invoices/details/${inv._id}`}>{inv.invoiceNumber}</Link>
                      </td>
                      <td className="py-3.5 text-slate-200 truncate max-w-[150px]">
                        {inv.customer?.name || 'Deleted Customer'}
                      </td>
                      <td className="py-3.5 text-slate-200 font-bold font-sans">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="py-3.5">
                        <Badge>{inv.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Overdue Warnings Card */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Overdue Summary</span>
            </h3>
            {stats.overdue.count > 5 && (
              <span className="text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                +{stats.overdue.count - 5} More
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3 flex-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-14 bg-white/[0.01] animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : stats.overdue.list.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-500 text-sm">
              <p>✔ No overdue invoices!</p>
              <p className="text-[11px] text-slate-600 mt-1">Excellent account balances.</p>
            </div>
          ) : (
            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[260px] scrollbar-thin">
              {stats.overdue.list.slice(0, 5).map((inv) => (
                <Link
                  key={inv._id}
                  to={`/invoices/details/${inv._id}`}
                  className="flex justify-between items-center p-3.5 rounded-2xl bg-rose-500/[0.01] border border-rose-500/10 hover:bg-rose-500/[0.03] hover:border-rose-500/20 transition-all block group"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-rose-400 transition-colors">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[140px]">
                      {inv.customer?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-rose-400 font-sans">
                      {formatCurrency(inv.pendingAmount)}
                    </p>
                    <p className="text-[9px] text-rose-500 font-semibold uppercase mt-0.5">
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
