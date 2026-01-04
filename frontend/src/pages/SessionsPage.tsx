import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import type { SessionAttachment, SessionSlot } from '../store/sessionStore';
import { useClientStore } from '../store/clientStore';
import { useProtocolStore } from '../store/protocolStore';
import { Plus, Trash2, CheckCircle2, X, Search, UserPlus, Loader2, Upload, Paperclip, Image, FileText, Maximize } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';

const initialFormState = () => ({
  client_id: '',
  protocol_ids: [] as string[],
  notes: '',
  fee: 0,
});

const emptySlot = (): SessionSlot => ({
  from_date: '',
  to_date: '',
  from_time: '',
  to_time: '',
});

const getAttachmentLabel = (att: SessionAttachment) =>
  att.original_name || att.path.split('/').pop() || 'Attachment';

const SessionsPage: React.FC = () => {
  const { agenda, fetchAgenda, createSessions, updateSession, deleteSession, loading } = useSessionStore();
  const { clients, fetchClients, addClient } = useClientStore();
  const { protocols, fetchProtocols } = useProtocolStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(() => initialFormState());
  const [scheduleSlots, setScheduleSlots] = useState<SessionSlot[]>([emptySlot()]);
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', base_fee: '' });

  useEffect(() => {
    fetchAgenda(dateRange.start || undefined, dateRange.end || undefined, 'healing', searchTerm || undefined);
    fetchClients();
    fetchProtocols();
  }, [fetchAgenda, fetchClients, fetchProtocols, dateRange.start, dateRange.end, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedSlots = scheduleSlots.filter(
      (slot) => slot.from_date && slot.to_date && slot.from_time && slot.to_time,
    );

    if (sanitizedSlots.length === 0) {
      alert('Please add at least one valid schedule slot.');
      return;
    }

    const payload = {
      client_id: formData.client_id,
      protocol_ids: formData.protocol_ids,
      notes: formData.notes,
      fee: formData.fee,
      schedule_slots: sanitizedSlots,
      attachments,
    };

    if (editingSessionId) {
      await updateSession(editingSessionId, payload);
    } else {
      await createSessions({ ...payload, type: 'healing' });
    }
    closeModal();
    fetchAgenda(dateRange.start || undefined, dateRange.end || undefined, 'healing', searchTerm || undefined);
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

  const handleSlotChange = (index: number, field: keyof SessionSlot, value: string) => {
    setScheduleSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSlot = () => setScheduleSlots((prev) => [...prev, emptySlot()]);

  const removeSlot = (index: number) => {
    setScheduleSlots((prev) => (prev.length === 1 ? [emptySlot()] : prev.filter((_, i) => i !== index)));
  };

  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const data = new FormData();
    Array.from(files).forEach((file) => data.append('files', file));
    try {
      const response = await api.post('/storage/bulk-upload', data);
      const uploaded: SessionAttachment[] = response.data.map((file: any) => ({
        path: file.path,
        url: file.url,
        original_name: file.original_name || file.filename || file.path.split('/').pop(),
      }));
      setAttachments((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (path: string) => {
    setAttachments((prev) => prev.filter((att) => att.path !== path));
  };

  const attachmentIcon = (att: SessionAttachment) => {
    const mime = att.mime_type || '';
    if (mime.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mime === 'application/pdf' || att.original_name?.toLowerCase().endsWith('.pdf')) return <FileText className="w-4 h-4" />;
    return <Paperclip className="w-4 h-4" />;
  };

  const filteredAgenda = useMemo(() => {
    return agenda
      .filter((session) => session.type === 'healing')
      .filter((session) => session.client_id?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [agenda, searchTerm]);

  const openClientModal = () => {
    setClientForm({ name: '', phone: '', email: '', base_fee: '' });
    setIsClientModalOpen(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const newClient = await addClient({
      ...clientForm,
      base_fee: clientForm.base_fee ? parseInt(clientForm.base_fee) : undefined,
      notes: [],
      protocol_ids: [],
      is_active: true,
    });
    if (newClient) {
      setFormData((prev) => ({ ...prev, client_id: newClient._id, fee: newClient.base_fee || prev.fee }));
    }
    setIsClientModalOpen(false);
  };

  const openEdit = (session: any) => {
    setEditingSessionId(session._id);
    setFormData({
      client_id: session.client_id?._id || '',
      protocol_ids: (session.protocol_ids || []).map((p: any) => (typeof p === 'string' ? p : p._id)),
      notes: session.notes || '',
      fee: session.fee || 0,
    });
    setScheduleSlots(
      session.schedule_slots?.length
        ? session.schedule_slots.map((slot: any) => ({
            from_date: slot.from_date ? format(new Date(slot.from_date), 'yyyy-MM-dd') : '',
            to_date: slot.to_date ? format(new Date(slot.to_date), 'yyyy-MM-dd') : '',
            from_time: slot.from_time || '',
            to_time: slot.to_time || '',
          }))
        : [emptySlot()],
    );
    setAttachments(
      (session.attachments || []).map((att: any) =>
        typeof att === 'string'
          ? { path: att }
          : {
              path: att.path,
              url: att.url,
              original_name: att.original_name,
              mime_type: att.mime_type,
              size: att.size,
            },
      ),
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSessionId(null);
    setFormData(initialFormState());
    setScheduleSlots([emptySlot()]);
    setAttachments([]);
    setViewerIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleProtocol = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      protocol_ids: prev.protocol_ids.includes(id)
        ? prev.protocol_ids.filter((pid) => pid !== id)
        : [...prev.protocol_ids, id],
    }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Healing Sessions</h1>
          <p className="text-slate-500 mt-1">Manage and track all client healings</p>
        </div>
        <button 
          onClick={() => {
            setEditingSessionId(null);
            setFormData(initialFormState());
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Schedule Sessions
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1 flex items-center bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search by client or event name..."
            className="w-full bg-transparent border-none outline-none text-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium"
          />
        </div>
        <button
          onClick={() => setDateRange({ start: '', end: '' })}
          className="px-5 py-3 bg-slate-100 text-slate-600 rounded-2xl font-semibold"
        >
          Clear
        </button>
      </div>

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
            {filteredAgenda.map((session) => (
              <tr
                key={session._id}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => openEdit(session)}
              >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(session);
                        }}
                        className={`p-2 rounded-xl transition-all ${session.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session._id);
                        }}
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
        {filteredAgenda.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium bg-slate-50/30">
            {searchTerm || dateRange.start || dateRange.end ? 'No sessions match your search filters.' : 'No sessions found for this period.'}
          </div>
        )}
      </div>

      {/* Scheduling Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">{editingSessionId ? 'Update Session' : 'Schedule Sessions'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-2xl transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Select Client</label>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 outline-none font-medium"
                      value={formData.client_id}
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
                    <button
                      type="button"
                      onClick={openClientModal}
                      className="px-4 py-3 bg-teal-50 text-teal-600 rounded-2xl font-semibold flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Session Notes</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 outline-none font-medium"
                    placeholder="Optional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Fee per Session (INR)</label>
                <input 
                  type="number"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 outline-none font-bold text-lg"
                  value={formData.fee}
                  onChange={(e) => setFormData({...formData, fee: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Protocols</label>
                <div className="flex flex-wrap gap-2">
                  {protocols.length === 0 && (
                    <span className="text-xs text-slate-400">No protocols yet</span>
                  )}
                  {protocols.map((protocol) => {
                    const active = formData.protocol_ids.includes(protocol._id);
                    return (
                      <button
                        key={protocol._id}
                        type="button"
                        onClick={() => toggleProtocol(protocol._id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {protocol.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Schedule Slots</h3>
                  <button type="button" onClick={addSlot} className="text-sm font-semibold text-teal-600">
                    + Add Slot
                  </button>
                </div>
                <div className="space-y-3">
                  {scheduleSlots.map((slot, index) => (
                    <div key={`slot-${index}`} className="border border-slate-200 rounded-2xl p-4 grid md:grid-cols-5 gap-3">
                      <input
                        type="date"
                        value={slot.from_date}
                        onChange={(e) => handleSlotChange(index, 'from_date', e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                        required
                      />
                      <input
                        type="date"
                        value={slot.to_date}
                        onChange={(e) => handleSlotChange(index, 'to_date', e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                        required
                      />
                      <input
                        type="time"
                        value={slot.from_time}
                        onChange={(e) => handleSlotChange(index, 'from_time', e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                        required
                      />
                      <input
                        type="time"
                        value={slot.to_time}
                        onChange={(e) => handleSlotChange(index, 'to_time', e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                        required
                      />
                      <button type="button" onClick={() => removeSlot(index)} className="text-sm font-semibold text-red-500">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Attachments</h3>
                  <button
                    type="button"
                    onClick={triggerFilePicker}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-200 text-teal-600 font-semibold text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf,text/plain"
                    onChange={handleFileUpload}
                  />
                </div>
                {attachments.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {attachments.map((att, idx) => (
                      <div key={`${att.path}-${idx}`} className="relative p-4 border border-slate-200 rounded-2xl bg-slate-50">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          {attachmentIcon(att)}
                          <span className="truncate">{getAttachmentLabel(att)}</span>
                        </div>
                        <div className="mt-3 flex gap-2 text-xs font-semibold text-slate-500">
                          {att.url && (
                            <button type="button" onClick={() => setViewerIndex(idx)} className="flex items-center gap-1">
                              <Maximize className="w-3 h-3" /> View
                            </button>
                          )}
                          <button type="button" onClick={() => removeAttachment(att.path)} className="flex items-center gap-1 text-red-500">
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No files uploaded yet.</p>
                )}
              </section>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-5 bg-teal-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-teal-500/30 hover:bg-teal-700 transition-all active:scale-[0.98]"
                >
                  {editingSessionId ? 'Update Session' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewerIndex !== null && attachments[viewerIndex] && (
        <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-3xl h-[80vh] overflow-hidden relative">
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white shadow"
              onClick={() => setViewerIndex(null)}
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="h-full overflow-auto p-6">
              {(() => {
                const file = attachments[viewerIndex];
                if (!file.url) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                      <Paperclip className="w-12 h-12 mb-3" />
                      <p>File preview unavailable. Please download from the session list.</p>
                    </div>
                  );
                }
                if (file.mime_type?.startsWith('image/')) {
                  return <img src={file.url} alt={file.original_name} className="w-full h-full object-contain" />;
                }
                if (file.mime_type === 'application/pdf') {
                  return <iframe src={file.url} className="w-full h-full" title="Attachment" />;
                }
                return <iframe src={file.url} className="w-full h-full" title="Attachment" />;
              })()}
            </div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Create New Client</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleCreateClient}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Name</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone</label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Base Fee (INR)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200"
                  value={clientForm.base_fee}
                  onChange={(e) => setClientForm({ ...clientForm, base_fee: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20"
              >
                Save Client
              </button>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/60">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
