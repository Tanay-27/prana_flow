import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNurturingStore } from '../store/nurturingStore';
import type { NurturingAttachment, NurturingScheduleSlot, NurturingSession } from '../store/nurturingStore';
import {
  Calendar as CalIcon,
  Clock,
  CreditCard,
  FileText,
  Image,
  MapPin,
  Paperclip,
  PlayCircle,
  Plus,
  Trash2,
  Upload,
  UploadCloud,
  X,
  Edit2,
  ExternalLink,
  Maximize,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';

type FormState = {
  name: string;
  date: string;
  coordinator: string;
  payment_details: string;
  status: 'Planned' | 'Registered' | 'Attended';
  recording_available_till: string;
};

const defaultFormState = (): FormState => ({
  name: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  coordinator: '',
  payment_details: '',
  status: 'Planned',
  recording_available_till: '',
});

const emptySlot = (): NurturingScheduleSlot => ({
  from_date: '',
  to_date: '',
  from_time: '',
  to_time: '',
});

const slotLabel = (slot: NurturingScheduleSlot) => {
  if (!slot.from_date || !slot.to_date) return 'Unscheduled';
  const fromDate = format(new Date(slot.from_date), 'dd MMM');
  const toDate = format(new Date(slot.to_date), 'dd MMM');
  return `${fromDate} → ${toDate} • ${slot.from_time || '--:--'}-${slot.to_time || '--:--'}`;
};

const NurturingPage: React.FC = () => {
  const { nurturingSessions, fetchNurturing, addNurturing, updateNurturing, deleteNurturing, loading } = useNurturingStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<NurturingSession | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [scheduleSlots, setScheduleSlots] = useState<NurturingScheduleSlot[]>([emptySlot()]);
  const [attachments, setAttachments] = useState<NurturingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState({ start: '', end: '' });
  const [appliedFilters, setAppliedFilters] = useState<{ start?: string; end?: string }>({});

  useEffect(() => {
    fetchNurturing(appliedFilters);
  }, [fetchNurturing, appliedFilters]);

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
      setScheduleSlots(
        editingSession.schedule_slots?.length
          ? editingSession.schedule_slots.map((slot) => ({
              from_date: slot.from_date ? format(new Date(slot.from_date), 'yyyy-MM-dd') : '',
              to_date: slot.to_date ? format(new Date(slot.to_date), 'yyyy-MM-dd') : '',
              from_time: slot.from_time || '',
              to_time: slot.to_time || '',
            }))
          : [emptySlot()],
      );
      setAttachments(editingSession.attachments || []);
    } else {
      setFormData(defaultFormState());
      setScheduleSlots([emptySlot()]);
      setAttachments([]);
    }
  }, [editingSession]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this record?')) {
      await deleteNurturing(id);
    }
  };

  const handleSlotChange = (index: number, field: keyof NurturingScheduleSlot, value: string) => {
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

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    const data = new FormData();
    files.forEach((file) => data.append('files', file));
    try {
      const response = await api.post('/storage/bulk-upload', data, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(percent);
        },
      });
      const uploaded: NurturingAttachment[] = response.data.map((file: any) => ({
        path: file.path,
        url: file.url,
        original_name: file.original_name || file.filename || file.path.split('/').pop(),
      }));
      setAttachments((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesUpload(event.target.files || []);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length) {
      handleFilesUpload(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const removeAttachment = (path: string) => {
    setAttachments((prev) => prev.filter((att) => att.path !== path));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      schedule_slots: scheduleSlots.filter(
        (slot) => slot.from_date && slot.to_date && slot.from_time && slot.to_time,
      ),
      attachments,
    };
    if (editingSession) {
      await updateNurturing(editingSession._id, payload);
    } else {
      await addNurturing(payload);
    }
    closeModal();
  };

  const applyFilters = () => {
    setAppliedFilters({
      start: filters.start || undefined,
      end: filters.end || undefined,
    });
  };

  const resetFilters = () => {
    setFilters({ start: '', end: '' });
    setAppliedFilters({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Attended':
        return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'Registered':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const attachmentIcon = (att: NurturingAttachment) => {
    const mime = att.mime_type || '';
    if (mime.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mime === 'application/pdf' || att.original_name?.endsWith('.pdf')) return <FileText className="w-4 h-4" />;
    return <Paperclip className="w-4 h-4" />;
  };

  const summaryStats = useMemo(() => {
    const total = nurturingSessions.length;
    const planned = nurturingSessions.filter((s) => s.status === 'Planned').length;
    const registered = nurturingSessions.filter((s) => s.status === 'Registered').length;
    const attended = nurturingSessions.filter((s) => s.status === 'Attended').length;
    return { total, planned, registered, attended };
  }, [nurturingSessions]);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nurturing Sessions</h1>
          <p className="text-slate-500 mt-1">Track workshops, courses, and healing events</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingSession(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Create Session
          </button>
        </div>
      </header>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">From</label>
            <input
              type="date"
              value={filters.start}
              onChange={(e) => setFilters((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">To</label>
            <input
              type="date"
              value={filters.end}
              onChange={(e) => setFilters((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: summaryStats.total, tone: 'text-slate-900' },
            { label: 'Planned', value: summaryStats.planned, tone: 'text-amber-600' },
            { label: 'Registered', value: summaryStats.registered, tone: 'text-blue-600' },
            { label: 'Attended', value: summaryStats.attended, tone: 'text-teal-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {nurturingSessions.map((session) => (
            <div
              key={session._id}
              className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-100 transition-all"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{session.name}</h3>
                      <span
                        className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-lg border ${getStatusColor(
                          session.status,
                        )}`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                      <div className="flex items-center">
                        <CalIcon className="w-4 h-4 mr-2 text-slate-300" />
                        {format(new Date(session.date), 'MMM dd, yyyy')}
                      </div>
                      {session.coordinator && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-slate-300" />
                          {session.coordinator}
                        </div>
                      )}
                    </div>
                    {session.schedule_slots?.length ? (
                      <div className="mt-3 space-y-1">
                        {session.schedule_slots.map((slot, idx) => (
                          <p key={`${session._id}-slot-${idx}`} className="text-xs font-medium text-slate-500">
                            {slotLabel(slot)}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {session.payment_details && (
                    <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                      <CreditCard className="w-4 h-4 mr-2 text-slate-400" />
                      Payment Info
                    </span>
                  )}
                  {session.recording_available_till && (
                    <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                      <PlayCircle className="w-4 h-4 mr-2 text-slate-400" />
                      Recording till {format(new Date(session.recording_available_till), 'MMM d')}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingSession(session);
                      setIsModalOpen(true);
                    }}
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
              {session.attachments?.length ? (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Attachments</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {session.attachments.slice(0, 4).map((att, idx) => (
                      <a
                        key={`${session._id}-att-${idx}`}
                        href={att.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-purple-200"
                      >
                        {attachmentIcon(att)}
                        <span className="truncate">{att.original_name || att.path.split('/').pop()}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingSession ? 'Update Nurturing Session' : 'Create Nurturing Session'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-2xl transition-all">
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Primary Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                  onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Recording Available Till (Optional)</label>
                <input
                  type="date"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                  value={formData.recording_available_till}
                  onChange={(e) => setFormData({ ...formData, recording_available_till: e.target.value })}
                />
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Schedule Slots</h3>
                  <button type="button" onClick={addSlot} className="text-sm font-semibold text-purple-600">
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
                        placeholder="From date"
                        required
                      />
                      <input
                        type="date"
                        value={slot.to_date}
                        onChange={(e) => handleSlotChange(index, 'to_date', e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                        placeholder="To date"
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
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="text-sm font-semibold text-red-500"
                      >
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-200 text-purple-600 font-semibold text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Select Files
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

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full rounded-2xl border-2 border-dashed ${
                    isDragging ? 'border-purple-400 bg-purple-50/30' : 'border-slate-200 bg-slate-50'
                  } p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors`}
                >
                  <UploadCloud className="w-8 h-8 text-purple-500" />
                  <div className="text-sm font-semibold text-slate-600">
                    Drag & drop files here or <span className="text-purple-600 cursor-pointer" onClick={triggerFilePicker}>browse</span>
                  </div>
                  <p className="text-xs text-slate-400">Supports images, PDFs, and text files</p>
                  {uploading && (
                    <div className="w-full mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {attachments.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {attachments.map((att, idx) => (
                      <div
                        key={`${att.path}-${idx}`}
                        className="relative p-4 border border-slate-200 rounded-2xl bg-slate-50"
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          {attachmentIcon(att)}
                          <span className="truncate">{att.original_name || att.path.split('/').pop()}</span>
                        </div>
                        <div className="mt-3 flex gap-2 text-xs font-semibold text-slate-500">
                          {att.url && (
                            <button type="button" onClick={() => setViewerIndex(idx)} className="flex items-center gap-1">
                              <Maximize className="w-3 h-3" /> View
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.path)}
                            className="flex items-center gap-1 text-red-500"
                          >
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
                  className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-purple-500/30 hover:bg-purple-700 transition-all active:scale-[0.98]"
                >
                  {editingSession ? 'Update Session' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>

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
                          <ExternalLink className="w-12 h-12 mb-3" />
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
                    return (
                      <iframe src={file.url} className="w-full h-full" title="Attachment" />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NurturingPage;
