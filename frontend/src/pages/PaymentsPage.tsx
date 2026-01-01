import React, { useEffect, useState } from 'react';
import { usePaymentStore } from '../store/paymentStore';
import { useClientStore } from '../store/clientStore';
import { IndianRupee, Plus, Search, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format, addDays } from 'date-fns';
import api from '../api/client';

const PaymentsPage: React.FC = () => {
  const { payments, fetchPayments, addPayment, deletePayment } = usePaymentStore();
  const { clients, fetchClients } = useClientStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
  const [activeTab, setActiveTab] = useState<'transactions' | 'dues'>('transactions');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const [allSessions, setAllSessions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    client_id: '',
    amount_inr: 0,
    mode: 'UPI',
    status: 'Paid',
    paid_at: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchPayments();
    fetchClients();
    
    // Fetch a large range to get historical pending dues
    const start = '2020-01-01';
    const end = format(addDays(new Date(), 365), 'yyyy-MM-dd');
    api.get('/agenda', { params: { start, end, status: 'completed' } })
      .then(res => setAllSessions(res.data));
  }, [fetchPayments, fetchClients]);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.client_id?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const paymentDate = p.paid_at || p.createdAt;
    let matchesMonth = !selectedMonth;
    if (selectedMonth && paymentDate) {
      const date = new Date(paymentDate);
      if (!isNaN(date.getTime())) {
        matchesMonth = format(date, 'yyyy-MM') === selectedMonth;
      }
    }
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const monthlyRevenue = payments
    .filter(p => {
      const paymentDate = p.paid_at || p.createdAt;
      if (!selectedMonth || !paymentDate) return false;
      const date = new Date(paymentDate);
      return !isNaN(date.getTime()) && format(date, 'yyyy-MM') === selectedMonth && p.status === 'Paid';
    })
    .reduce((sum, p) => sum + p.amount_inr, 0);

  // Dues calculation logic
  const clientSummary = clients.map(client => {
    const clientSessions = allSessions.filter(s => s.client_id?._id === client._id && s.status === 'completed');
    const totalBilled = clientSessions.reduce((sum, s) => sum + (s.fee || 0), 0);
    
    const clientPayments = payments.filter(p => p.client_id?._id === client._id && p.status === 'Paid');
    const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount_inr, 0);
    
    const balance = totalPaid - totalBilled;
    return {
      ...client,
      totalBilled,
      totalPaid,
      balance,
      sessionCount: clientSessions.length
    };
  }).filter(c => c.totalBilled > 0 || c.totalPaid > 0);

  const totalDues = clientSummary.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
  const totalAdvances = clientSummary.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPayment(formData as any);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this payment record?')) {
      await deletePayment(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">Track your healing session revenue</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="month"
            className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Record Payment
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{format(new Date(selectedMonth), 'MMM')} Collection</span>
          </div>
          <div className="text-3xl font-black flex items-center">
            <IndianRupee className="w-6 h-6 mr-1" />
            {monthlyRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pending</span>
          </div>
          <div className="text-3xl font-black text-slate-800 flex items-center">
            <IndianRupee className="w-6 h-6 mr-1 text-slate-300" />
            {totalDues.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Advances</span>
          </div>
          <div className="text-3xl font-black text-slate-800 flex items-center">
            <IndianRupee className="w-6 h-6 mr-1 text-slate-300" />
            {totalAdvances.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 w-fit">
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'transactions' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Transactions
        </button>
        <button 
          onClick={() => setActiveTab('dues')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'dues' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Client Dues
        </button>
      </div>

      {activeTab === 'transactions' ? (
        /* Payment Table */
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h3 className="font-bold text-slate-800">Transactions for {format(new Date(selectedMonth), 'MMMM yyyy')}</h3>
           <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search client..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
           </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Client</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Mode</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredPayments.map((payment) => (
              <tr key={payment._id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5 font-bold text-slate-900">{payment.client_id?.name}</td>
                <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                  {payment.paid_at ? format(new Date(payment.paid_at), 'MMM dd, yyyy') : 'N/A'}
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-lg">
                    {payment.mode}
                  </span>
                </td>
                <td className="px-6 py-5 font-black text-slate-900 flex items-center">
                  <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                  {payment.amount_inr}
                </td>
                <td className="px-6 py-5">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest ${payment.status === 'Paid' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(payment._id)}
                    className="p-2 text-slate-300 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          {filteredPayments.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-medium italic">
              No payments found for this month.
            </div>
          )}
        </div>
      ) : (
        /* Client Dues View */
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
             <h3 className="font-bold text-slate-800">Pending Dues & Advances by Client</h3>
             <p className="text-xs text-slate-400 mt-1">Calculated from total completed sessions vs. total payments.</p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Sessions</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Total Billable</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Total Paid</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status / Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clientSummary.map((client) => (
                <tr key={client._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900">{client.name}</td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-bold text-center">{client.sessionCount}</td>
                  <td className="px-6 py-5 font-bold text-slate-600">
                    <div className="flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                      {client.totalBilled}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600">
                    <div className="flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                      {client.totalPaid}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {client.balance < 0 ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-widest w-fit mb-1">Pending</span>
                        <div className="flex items-center font-black text-red-600">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {Math.abs(client.balance)}
                        </div>
                      </div>
                    ) : client.balance > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest w-fit mb-1">Advance</span>
                        <div className="flex items-center font-black text-emerald-600">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {client.balance}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-widest">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientSummary.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-medium italic">
              No billing data available for any client.
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Record Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Client</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  required
                >
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount (INR)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="number"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xl"
                    value={formData.amount_inr}
                    onChange={(e) => setFormData({...formData, amount_inr: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mode</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.mode}
                    onChange={(e) => setFormData({...formData, mode: e.target.value})}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-[0.98]"
              >
                Save Record
              </button>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
