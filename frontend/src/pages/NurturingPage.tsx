import React, { useEffect, useState } from 'react';
import { useNurturingStore } from '../store/nurturingStore';
import type { NurturingSession } from '../store/nurturingStore';
import { Clock, Plus, Calendar as CalIcon, MapPin, CreditCard, PlayCircle, X, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const NurturingPage: React.FC = () => {
  const { nurturingSessions, fetchNurturing, addNurturing, updateNurturing, deleteNurturing, loading } = useNurturingStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<NurturingSession | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    coordinator: '',
    payment_details: '',
    status: 'Planned' as any,
    recording_available_till: '',
  });

  useEffect(() => {
    fetchNurturing();
  }, [fetchNurturing]);

  useEffect(() => {
    if (editingSession) {
      setFormData({
        name: editingSession.name,
        date: format(new Date(editingSession.date), 'yyyy-MM-dd'),
        coordinator: editingSession.coordinator || '',
        payment_details: editingSession.payment_details || '',
        status: editingSession.status,
        recording_available_till: editingSession.recording_available_till 
          ? format(new Date(editingSession.recording_available_till), 'yyyy-MM-dd') 
          : '',
      });
    } else {
      setFormData({
        name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        coordinator: '',
        payment_details: '',
        status: 'Planned',
        recording_available_till: '',
      });
    }
  }, [editingSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      await updateNurturing(editingSession._id, formData);
    } else {
      await addNurturing(formData);
    }
    setIsModalOpen(false);
    setEditingSession(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this record?')) {
      await deleteNurturing(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Attended': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'Registered': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nurturing Sessions</h1>
          <p className="text-slate-500 mt-1">Track workshops, courses, and healing events</p>
        </div>
        <button 
          onClick={() => { setEditingSession(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Add Session
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {nurturingSessions.map((session) => (
            <div key={session._id} className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-100 transition-all flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-slate-900">{session.name}</h3>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-lg border ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                    <div className="flex items-center">
                      <CalIcon className="w-4 h-4 mr-2 text-slate-300" />
                      {format(new Date(session.date), 'MMM do, yyyy')}
                    </div>
                    {session.coordinator && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-slate-300" />
                        {session.coordinator}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:border-l md:border-slate-50 md:pl-6">
                {session.payment_details && (
                  <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                    <CreditCard className="w-4 h-4 mr-2 text-slate-400" />
                    Payment Info
                  </div>
                )}
                {session.recording_available_till && (
                  <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                    <PlayCircle className="w-4 h-4 mr-2 text-slate-400" />
                    Recording till {format(new Date(session.recording_available_till), 'MMM d')}
                  </div>
                )}
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingSession(session); setIsModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-purple-600 rounded-xl hover:bg-purple-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(session._id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nurturing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">{editingSession ? 'Edit Session' : 'Record Nurturing Session'}</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingSession(null); }}
                className="p-2 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Session Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-purple-500/20"
                  placeholder="e.g. Master Choa Kok Sui - Arhatic Yoga"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Planned">Planned</option>
                    <option value="Registered">Registered</option>
                    <option value="Attended">Attended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Coordinator / Location</label>
                <input 
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-purple-500/20"
                  placeholder="e.g. GMCKS Pranic Healing Trust"
                  value={formData.coordinator}
                  onChange={(e) => setFormData({...formData, coordinator: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Recording Available Till (Optional)</label>
                <input 
                  type="date"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                  value={formData.recording_available_till}
                  onChange={(e) => setFormData({...formData, recording_available_till: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-purple-500/30 hover:bg-purple-700 transition-all active:scale-[0.98]"
                >
                  {editingSession ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurturingPage;
