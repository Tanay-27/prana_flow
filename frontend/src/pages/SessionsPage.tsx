import React, { useEffect, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useClientStore } from '../store/clientStore';
import { useProtocolStore } from '../store/protocolStore';
import { Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';

const SessionsPage: React.FC = () => {
  const { agenda, fetchAgenda, createSessions, updateSession, deleteSession } = useSessionStore();
  const { clients, fetchClients } = useClientStore();
  const { fetchProtocols } = useProtocolStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'healing',
    client_id: '',
    protocol_ids: [] as string[],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    daysOfWeek: [] as number[],
    notes: '',
    fee: 0,
  });

  useEffect(() => {
    fetchAgenda();
    fetchClients();
    fetchProtocols();
  }, [fetchAgenda, fetchClients, fetchProtocols]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSessions(formData);
    setIsModalOpen(false);
    fetchAgenda();
  };

  const handleDeleteSession = async (id: string) => {
    if (window.confirm('Delete this session?')) {
      await deleteSession(id);
    }
  };

  const handleToggleStatus = async (session: any) => {
    const newStatus = session.status === 'completed' ? 'scheduled' : 'completed';
    await updateSession(session._id, { status: newStatus });
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) 
        ? prev.daysOfWeek.filter(d => d !== day) 
        : [...prev.daysOfWeek, day]
    }));
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Sessions</h1>
          <p className="text-slate-500 mt-1">Manage and track all healing appointments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Schedule Sessions
        </button>
      </header>

      {/* Simplified List View */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Client / Event</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {agenda.map((session) => (
              <tr key={session._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{format(new Date(session.scheduled_date || session.date), 'MMM dd')}</div>
                  <div className="text-xs text-slate-500 font-medium">{session.start_time || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{session.type === 'healing' ? session.client_id?.name : session.name}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[200px]">{session.notes || 'No notes'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest ${session.type === 'healing' ? 'text-teal-600 bg-teal-50' : 'text-purple-600 bg-purple-50'}`}>
                    {session.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest ${session.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleStatus(session)}
                        className={`p-2 rounded-xl transition-all ${session.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSession(session._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {agenda.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium">
            No sessions found for this period.
          </div>
        )}
      </div>

      {/* Scheduling Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Schedule Sessions</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Session Type</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 outline-none font-medium"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="healing">Healing Session</option>
                    <option value="nurturing">Nurturing (Self)</option>
                  </select>
                </div>
                {formData.type === 'healing' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Select Client</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 outline-none font-medium"
                      onChange={(e) => {
                        const clientId = e.target.value;
                        const client = clients.find(c => c._id === clientId);
                        setFormData({
                          ...formData, 
                          client_id: clientId,
                          fee: client?.base_fee || 0
                        });
                      }}
                      required
                    >
                      <option value="">Choose a client...</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {formData.type === 'healing' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Fee per Session (INR)</label>
                  <input 
                    type="number"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 outline-none font-bold text-lg"
                    value={formData.fee}
                    onChange={(e) => setFormData({...formData, fee: parseInt(e.target.value) || 0})}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Repeat on Days</label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                        formData.daysOfWeek.includes(i) 
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-teal-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Start Date</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">End Date</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Start Time</label>
                  <input 
                    type="time"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">End Time</label>
                  <input 
                    type="time"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-5 bg-teal-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-teal-500/30 hover:bg-teal-700 transition-all active:scale-[0.98]"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
