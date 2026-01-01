import React, { useEffect, useState } from 'react';
import { usePaymentStore } from '../store/paymentStore';
import { useClientStore } from '../store/clientStore';
import { IndianRupee, Plus, Search, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

const PaymentsPage: React.FC = () => {
  const { payments, fetchPayments, addPayment, deletePayment } = usePaymentStore();
  const { clients, fetchClients } = useClientStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
  
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
  }, [fetchPayments, fetchClients]);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.client_id?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount_inr, 0);

  const pendingRevenue = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount_inr, 0);

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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total Received</span>
          </div>
          <div className="text-4xl font-black flex items-center">
            <IndianRupee className="w-8 h-8 mr-1" />
            {totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Collection</span>
          </div>
          <div className="text-4xl font-black text-slate-800 flex items-center">
            <IndianRupee className="w-8 h-8 mr-1 text-slate-300" />
            {pendingRevenue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h3 className="font-bold text-slate-800">Recent Transactions</h3>
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
            No payments found matching your filters.
          </div>
        )}
      </div>

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
