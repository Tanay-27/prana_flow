import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useClientStore } from '../store/clientStore';
import type { Client } from '../store/clientStore';
import { User, Phone, Mail, Plus, Search, ExternalLink, X, Camera, Trash2 } from 'lucide-react';
import api from '../api/client';

const ClientsPage: React.FC = () => {
  const { clients, fetchClients, addClient, updateClient, deleteClient, loading } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    photo: '',
    base_fee: 0,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        phone: editingClient.phone || '',
        email: editingClient.email || '',
        photo: editingClient.photo || '',
        base_fee: editingClient.base_fee || 0,
      });
    } else {
      setFormData({ name: '', phone: '', email: '', photo: '', base_fee: 0 });
    }
  }, [editingClient]);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await api.post('/storage/upload', data);
      setFormData({ ...formData, photo: response.data.url });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      await updateClient(editingClient._id, formData);
    } else {
      await addClient(formData);
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState('');

  const handleDelete = async (client: Client) => {
    const noteCount = client.notes?.length || 0;
    if (window.confirm(`Are you sure? This client has ${noteCount} notes. All associated session history will be hidden.`)) {
      await deleteClient(client._id);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newNote.trim()) return;
    
    try {
      await api.post(`/clients/${selectedClient._id}/notes`, { text: newNote });
      setNewNote('');
      fetchClients(); // Refresh list to see new note
      // Update selected client locally if possible, or just rely on fetch
    } catch (err) {
      console.error('Failed to add note', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage your healing relationships</p>
        </div>
        <button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Add New Client
        </button>
      </header>

      <div className="mb-8 flex items-center bg-white px-5 py-4 rounded-3xl shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
        <span className="p-2 text-slate-400">
          <Search className="w-5 h-5" />
        </span>
        <input 
          type="text" 
          placeholder="Search by name, phone or email..."
          className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 font-medium px-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client._id} className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-teal-100 transition-all flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 overflow-hidden cursor-pointer"
                  onClick={() => { setSelectedClient(client); setIsProfileOpen(true); }}
                >
                  {client.photo ? (
                    <img src={client.photo} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-teal-600 rounded-xl hover:bg-teal-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(client)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 
                className="text-xl font-bold text-slate-900 mb-4 group-hover:text-teal-700 transition-colors cursor-pointer"
                onClick={() => { setSelectedClient(client); setIsProfileOpen(true); }}
              >
                {client.name}
              </h3>
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center text-sm text-slate-500 font-medium">
                  <Phone className="w-4 h-4 mr-3 text-slate-300" />
                  {client.phone || 'No phone provided'}
                </div>
                <div className="flex items-center text-sm text-slate-500 font-medium">
                  <Mail className="w-4 h-4 mr-3 text-slate-300" />
                  <span className="truncate">{client.email || 'No email provided'}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {client.notes?.length || 0} Notes
                </div>
                <button 
                  onClick={() => { setSelectedClient(client); setIsProfileOpen(true); }}
                  className="text-teal-600 font-bold text-sm hover:underline"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingClient(null); }}
                className="p-2 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-teal-700 transition-all">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-900 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                  <input 
                    type="tel"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-900 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-900 focus:ring-2 focus:ring-teal-500/20"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Base Fee per Session (INR)</label>
                <input 
                  type="number"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-lg text-slate-900 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="0"
                  value={formData.base_fee}
                  onChange={(e) => setFormData({...formData, base_fee: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full py-5 bg-teal-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-teal-500/30 hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Profile / Notes Drawer */}
      {isProfileOpen && selectedClient && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-teal-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                   {selectedClient.photo ? <img src={selectedClient.photo} className="w-full h-full object-cover" /> : <User className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                  <p className="text-teal-100 text-xs font-medium">Full History & Healing Notes</p>
                </div>
              </div>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Add Note Section */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   Add New Note
                </h3>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <textarea 
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[100px] resize-none text-sm font-medium"
                    placeholder="Describe the healing session or progress..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/20 hover:bg-teal-700 transition-all"
                  >
                    Append to History
                  </button>
                </form>
              </div>

              {/* Notes Timeline */}
              <div className="space-y-6">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Timeline</h3>
                 {selectedClient.notes?.length === 0 ? (
                   <div className="text-center py-10 text-slate-400 italic text-sm">No notes yet.</div>
                 ) : (
                   <div className="space-y-6">
                     {[...selectedClient.notes].reverse().map((note, i) => (
                       <div key={i} className="relative pl-6 border-l-2 border-slate-100 pb-1">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-teal-500" />
                          <div className="text-[10px] font-bold text-slate-400 mb-2">
                            {format(new Date(note.timestamp), 'MMM dd, yyyy · hh:mm a')}
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-sm text-slate-700 leading-relaxed font-medium">
                            {note.text}
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
