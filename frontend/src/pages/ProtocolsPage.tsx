import React, { useEffect, useMemo, useState } from 'react';
import { useProtocolStore } from '../store/protocolStore';
import type { Protocol } from '../store/protocolStore';
import { BookOpen, Search, Plus, Tag, FileText, ChevronRight, X, Trash2, Edit2, Paperclip, Maximize } from 'lucide-react';
import api from '../api/client';

const ProtocolsPage: React.FC = () => {
  const { protocols, fetchProtocols, addProtocol, updateProtocol, deleteProtocol, loading } = useProtocolStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilters, setDateFilters] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [fullscreenFile, setFullscreenFile] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    keywords: [] as string[],
    attachments: [] as string[],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProtocols(
      searchTerm || undefined,
      dateFilters.start || undefined,
      dateFilters.end || undefined,
    );
  }, [fetchProtocols, searchTerm, dateFilters.start, dateFilters.end]);

  useEffect(() => {
    if (editingProtocol) {
      setFormData({
        name: editingProtocol.name,
        notes: editingProtocol.notes || '',
        keywords: editingProtocol.keywords || [],
        attachments: editingProtocol.attachments || [],
      });
    } else {
      setFormData({ name: '', notes: '', keywords: [], attachments: [] });
    }
  }, [editingProtocol]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i]);
    }

    try {
      const response = await api.post('/storage/bulk-upload', data);
      const newPaths = response.data.map((res: any) => res.path);
      // For immediate preview in modal, we can use URLs, but DB needs paths.
      // We'll store paths in the formData and resolve them on the backend.
      setFormData({ ...formData, attachments: [...formData.attachments, ...newPaths] });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (url: string) => {
    setFormData({ ...formData, attachments: formData.attachments.filter(a => a !== url) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProtocol) {
      await updateProtocol(editingProtocol._id, formData);
    } else {
      await addProtocol(formData);
    }
    setIsModalOpen(false);
    setEditingProtocol(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this protocol?')) {
      await deleteProtocol(id);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({ ...formData, keywords: [...formData.keywords, keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData({ ...formData, keywords: formData.keywords.filter(k => k !== kw) });
  };

  const filteredProtocols = useMemo(() => {
    if (!dateFilters.start && !dateFilters.end) return protocols;
    return protocols.filter((protocol) => {
      const updated = new Date(protocol.updatedAt);
      if (Number.isNaN(updated.getTime())) return false;
      if (dateFilters.start && updated < new Date(dateFilters.start)) return false;
      if (dateFilters.end) {
        const endDate = new Date(dateFilters.end);
        endDate.setHours(23, 59, 59, 999);
        if (updated > endDate) return false;
      }
      return true;
    });
  }, [dateFilters.end, dateFilters.start, protocols]);

  const clearDateFilters = () => setDateFilters({ start: '', end: '' });

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Healing Protocols</h1>
          <p className="text-slate-500 mt-1">A library of intentional healing procedures</p>
        </div>
        <button 
          onClick={() => { setEditingProtocol(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Create Protocol
        </button>
      </header>

      <div className="mb-8 flex flex-col gap-4">
        <div className="flex items-center bg-white px-5 py-4 rounded-3xl shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search by protocol name or keywords..."
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white px-5 py-3 rounded-3xl border border-slate-100 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">From</label>
          <input
            type="date"
            value={dateFilters.start}
            onChange={(e) => setDateFilters((prev) => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
          />
          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">To</label>
          <input
            type="date"
            value={dateFilters.end}
            onChange={(e) => setDateFilters((prev) => ({ ...prev, end: e.target.value }))}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
          />
          <button
            type="button"
            onClick={clearDateFilters}
            className="ml-auto px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProtocols.map((protocol) => (
            <div
              key={protocol._id}
              onClick={() => {
                setEditingProtocol(protocol);
                setIsModalOpen(true);
              }}
              className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all flex flex-col cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{protocol.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Updated {new Date(protocol.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingProtocol(protocol); setIsModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(protocol._id); }}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                {protocol.notes || 'No description provided for this protocol.'}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {protocol.keywords.map((tag, idx) => (
                  <span key={idx} className="flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wide">
                    <Tag className="w-2.5 h-2.5 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center text-slate-400 text-xs font-medium">
                  <FileText className="w-4 h-4 mr-2" />
                  {protocol.attachments?.length || 0} Attachments
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (protocol.attachments && protocol.attachments.length > 0) {
                      window.open(protocol.attachments[0], '_blank');
                    } else {
                      alert('No file attached to this protocol.');
                    }
                  }}
                  className="flex items-center text-indigo-600 font-bold text-sm bg-indigo-50/50 group-hover:bg-indigo-600 group-hover:text-white px-4 py-2 rounded-xl transition-all"
                >
                  View Protocol
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Protocol Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">{editingProtocol ? 'Edit Protocol' : 'Create Protocol'}</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingProtocol(null); }}
                className="p-2 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Protocol Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Advanced Emotional Healing"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Keywords / Tags</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text"
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Press enter to add..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <button 
                    type="button"
                    onClick={addKeyword}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map(kw => (
                    <span key={kw} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Instructions / Notes</label>
                <textarea 
                  rows={6}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  placeholder="Detail the steps for this protocol..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-700">Protocol Attachments</label>
                  <label className="flex items-center gap-2 text-indigo-600 font-bold text-xs cursor-pointer hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Paperclip className="w-4 h-4" />
                    Add Files
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                {uploading && (
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-dashed border-indigo-200 mb-4">
                    <div className="animate-spin h-5 w-5 border-b-2 border-indigo-600 rounded-full"></div>
                    <span className="text-sm font-bold text-indigo-600">Uploading to library...</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {formData.attachments.map((url, i) => {
                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                    return (
                      <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                        {isImage ? (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-bold uppercase truncate w-full text-center">
                              {url.split('.').pop()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setFullscreenFile(url)}
                            className="p-2 bg-white/20 hover:bg-white/40 rounded-xl text-white backdrop-blur-md transition-all"
                          >
                            <Maximize className="w-5 h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeAttachment(url)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-white backdrop-blur-md transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {(formData.attachments.length === 0) && !uploading && (
                    <div className="col-span-3 py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl text-sm font-medium">
                      Store images or reference PDFs here
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {editingProtocol ? 'Update Protocol' : 'Save Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Fullscreen Viewer Overlay */}
      {fullscreenFile && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-end p-6">
            <button 
              onClick={() => setFullscreenFile(null)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all shadow-xl"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-auto">
            {/\.(jpg|jpeg|png|webp|gif)$/i.test(fullscreenFile) ? (
              <img 
                src={fullscreenFile} 
                alt="Full preview" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border border-white/10" 
              />
            ) : (
              <div className="bg-white w-full max-w-5xl h-full rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 rounded-2xl">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <span className="font-bold text-slate-900 text-lg truncate max-w-md">{fullscreenFile.split('/').pop()}</span>
                   </div>
                   <div className="flex gap-3">
                     <a 
                      href={fullscreenFile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
                     >
                       Download File
                     </a>
                   </div>
                </div>
                <iframe 
                  src={fullscreenFile} 
                  className="w-full flex-1 border-none bg-slate-50"
                  title="Protocol Attachment"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolsPage;
