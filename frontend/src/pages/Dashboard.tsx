import React, { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import type { SessionAttachment } from '../store/sessionStore';
import { useProtocolStore } from '../store/protocolStore';
import type { Protocol } from '../store/protocolStore';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import { Clock, User as UserIcon, BookOpen, AlertCircle, CheckCircle2, X, ChevronRight, ArrowLeft, Paperclip, Trash2, Maximize, FileText, Plus, Search, Eye, Edit2 } from 'lucide-react';
import api from '../api/client';

const Dashboard: React.FC = () => {
  const { agenda, fetchAgenda, loading, updateSession, fetchSessionHistory } = useSessionStore();
  const { protocols, fetchProtocols, loading: protocolsLoading } = useProtocolStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'all' | 'healing' | 'nurturing' | 'protocols'>('all');
  const [uploading, setUploading] = useState(false);
  const [fullscreenFile, setFullscreenFile] = useState<string | null>(null);
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const windowEnd = useMemo(() => addDays(windowStart, 14), [windowStart]);
  const [dateFilters, setDateFilters] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const searchActive = searchTerm.trim().length > 0;
  const manualRangeActive = Boolean(dateFilters.start || dateFilters.end);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const baseRange = useMemo(() => {
    if (manualRangeActive) {
      return {
        start: dateFilters.start || format(windowStart, 'yyyy-MM-dd'),
        end: dateFilters.end || format(windowEnd, 'yyyy-MM-dd'),
      };
    }
    return {
      start: format(windowStart, 'yyyy-MM-dd'),
      end: format(windowEnd, 'yyyy-MM-dd'),
    };
  }, [dateFilters.end, dateFilters.start, manualRangeActive, windowEnd, windowStart]);

  const derivedRange = useMemo(() => {
    if (searchActive) {
      return {
        start: '2000-01-01',
        end: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
      };
    }
    return baseRange;
  }, [baseRange, searchActive]);

  const handleDateInput = (field: 'start' | 'end', value: string) => {
    setDateFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearDateFilters = () => setDateFilters({ start: '', end: '' });

  const rangeLabel = useMemo(() => {
    const startLabel = format(new Date(baseRange.start), 'MMM d, yyyy');
    const endLabel = format(new Date(baseRange.end), 'MMM d, yyyy');
    return `${startLabel} → ${endLabel}`;
  }, [baseRange]);

  const shiftWindow = (direction: 'prev' | 'next') => {
    setWindowStart((prev) => startOfDay(addDays(prev, direction === 'prev' ? -15 : 15)));
  };

  const filteredAgenda = useMemo(() => {
    if (!normalizedSearch) return agenda;
    return agenda.filter((item) => {
      const haystack = `${item.name || ''} ${item.client_id?.name || ''} ${item.notes || ''}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [agenda, normalizedSearch]);

  const groupedAgenda = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredAgenda.forEach((item) => {
      const date = format(new Date(item.scheduled_date || item.date), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [filteredAgenda]);

  const displayDates = useMemo<string[]>(() => {
    if (searchActive || manualRangeActive) {
      return Object.keys(groupedAgenda).sort();
    }
    return Array.from({ length: 15 }, (_, i) => format(addDays(windowStart, i), 'yyyy-MM-dd'));
  }, [groupedAgenda, manualRangeActive, searchActive, windowStart]);

  const hasSessionsInView = useMemo(
    () => displayDates.some((dateStr) => (groupedAgenda[dateStr] || []).length > 0),
    [displayDates, groupedAgenda],
  );

  const isProtocolsTab = activeTab === 'protocols';

  const protocolResults = useMemo<Protocol[]>(() => {
    return protocols.filter((protocol) => {
      const updated = format(new Date(protocol.updatedAt), 'yyyy-MM-dd');
      return updated >= derivedRange.start && updated <= derivedRange.end;
    });
  }, [derivedRange.end, derivedRange.start, protocols]);

  const isContentLoading = isProtocolsTab ? protocolsLoading : loading;

  useEffect(() => {
    if (activeTab === 'protocols') return;
    fetchAgenda(
      derivedRange.start,
      derivedRange.end,
      activeTab === 'all' ? undefined : activeTab,
      normalizedSearch || undefined,
    );
  }, [activeTab, derivedRange.end, derivedRange.start, fetchAgenda, normalizedSearch]);

  useEffect(() => {
    if (activeTab !== 'protocols') return;
    fetchProtocols(searchTerm || undefined);
  }, [activeTab, fetchProtocols, searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedSession) return;

    setUploading(true);
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i]);
    }

    try {
      const response = await api.post('/storage/bulk-upload', data);
      const uploaded: SessionAttachment[] = response.data.map((file: any) => ({
        path: file.path,
        url: file.url,
        original_name: file.original_name || file.filename || file.path.split('/').pop(),
        mime_type: file.mime_type,
        size: file.size,
      }));

      const currentAttachments: SessionAttachment[] = (selectedSession.attachments || []).map((att: any) =>
        typeof att === 'string'
          ? { path: att }
          : att,
      );

      const updatedAttachments = [...currentAttachments, ...uploaded];

      const updated = await updateSession(selectedSession._id, { attachments: updatedAttachments });
      setSelectedSession(updated);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (pathOrUrl: string) => {
    if (!selectedSession) return;
    const updatedAttachments = (selectedSession.attachments || [])
      .map((att: any) => (typeof att === 'string' ? { path: att } : att))
      .filter((att: SessionAttachment) => att.path !== pathOrUrl && att.url !== pathOrUrl);
    const updated = await updateSession(selectedSession._id, { attachments: updatedAttachments });
    setSelectedSession(updated);
  };

  const handleToggleStatus = async (session: any) => {
    const newStatus = session.status === 'completed' ? 'scheduled' : 'completed';
    await updateSession(session._id, { status: newStatus });
    if (selectedSession?._id === session._id) {
      setSelectedSession({ ...selectedSession, status: newStatus });
    }
  };
  const today = startOfDay(new Date());

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = groupedAgenda[todayStr] || [];
  const completedToday = todaySessions.filter(s => s.status === 'completed').length;
  
  // Stats for the next 7 days
  const upcoming7Days = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), 'yyyy-MM-dd'));
  const upcomingSessions = agenda.filter(item => {
    const d = format(new Date(item.scheduled_date || item.date), 'yyyy-MM-dd');
    return upcoming7Days.includes(d);
  });
  const totalThisWeek = upcomingSessions.length;

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewHistoryItem, setViewHistoryItem] = useState<any>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [protocolLoading, setProtocolLoading] = useState(false);

  useEffect(() => {
    if (selectedSession?.client_id?._id) {
      fetchSessionHistory(selectedSession.client_id._id).then(setHistory);
    }
  }, [selectedSession]);

  const closeModal = () => {
    setSelectedSession(null);
    setViewHistoryItem(null);
    setSelectedProtocol(null);
    setProtocolLoading(false);
  };

  const goBack = () => {
    if (selectedProtocol) {
      setSelectedProtocol(null);
      setProtocolLoading(false);
    } else if (viewHistoryItem) {
      setViewHistoryItem(null);
    }
  };

  const activeContext = selectedProtocol
    ? ({ ...selectedProtocol, type: 'protocols' } as Protocol & { type: string })
    : viewHistoryItem || selectedSession;

  const navigateToEditor = (session: any) => {
    const targetPath = session.type === 'nurturing' ? '/nurturing' : '/sessions';
    navigate(targetPath, {
      state: {
        editSessionId: session._id,
        sessionFromDashboard: session,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Atma Namaste!</h1>
            <p className="text-slate-500 mt-2">Healings, nurturing sessions, and protocols at a glance</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'healing', label: 'Healing' },
              { id: 'nurturing', label: 'Nurturing' },
              { id: 'protocols', label: 'Protocols' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id as any)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === btn.id ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-teal-500/20">
              <Search className="w-4 h-4 text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Search clients, sessions, notes..."
                className="w-full bg-transparent border-none outline-none text-slate-700 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-400">From</label>
              <input
                type="date"
                value={dateFilters.start}
                onChange={(e) => handleDateInput('start', e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <label className="text-xs font-bold uppercase tracking-wide text-slate-400">To</label>
              <input
                type="date"
                value={dateFilters.end}
                onChange={(e) => handleDateInput('end', e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <button
                onClick={clearDateFilters}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Showing: {rangeLabel}</span>
            {!manualRangeActive && !searchActive && !isProtocolsTab && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftWindow('prev')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wide"
                >
                  Previous 15 days
                </button>
                <button
                  onClick={() => shiftWindow('next')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wide"
                >
                  Next 15 days
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{todaySessions.length}</h3>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Sessions</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Done Today</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{completedToday}</h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Completed</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">This Week</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{totalThisWeek}</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Total</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Progress</p>
          <div className="flex flex-col gap-2 mt-2">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 transition-all duration-500" 
                style={{ width: `${todaySessions.length > 0 ? (completedToday / todaySessions.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {isContentLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : isProtocolsTab ? (
        <div className="space-y-4">
          {protocolResults.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No protocols found for this range/search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {protocolResults.map((protocol) => (
                <article
                  key={protocol._id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs uppercase font-bold text-slate-400 tracking-[0.2em]">Protocol</p>
                        <h3 className="text-lg font-bold text-slate-900">{protocol.name}</h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        Updated {format(new Date(protocol.updatedAt), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-3">{protocol.notes || 'No description provided.'}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{protocol.keywords.length} tags</span>
                    <button
                      type="button"
                      onClick={() => {
                        const fetchDetail = async () => {
                          setProtocolLoading(true);
                          setSelectedSession(null);
                          setViewHistoryItem(null);
                          setSelectedProtocol(protocol);
                          try {
                            const response = await api.get(`/protocols/${protocol._id}`);
                            setSelectedProtocol(response.data);
                          } catch (error) {
                            console.error('Failed to load protocol', error);
                          } finally {
                            setProtocolLoading(false);
                          }
                        };
                        fetchDetail();
                      }}
                      className="text-teal-600 font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {displayDates.map((dateStr) => {
              const sessions = groupedAgenda[dateStr] || [];
              const date = new Date(dateStr);
              let label = format(date, 'EEEE, MMM do');
              if (isToday(date)) label = 'Today';
              if (isTomorrow(date)) label = 'Tomorrow';
              const isPast = date < today && !isToday(date);

              return (
                <section key={dateStr}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${isPast ? 'text-slate-300' : 'text-slate-400'}`}>
                      {label}
                    </h2>
                    {sessions.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {sessions.length} {sessions.length === 1 ? 'Task' : 'Tasks'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {sessions.length === 0 ? (
                      <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm">
                        No sessions scheduled
                      </div>
                    ) : (
                      sessions.map((session) => {
                        const sessionDate = new Date(session.scheduled_date || session.date);
                        const protocolNames = (session.protocol_ids || [])
                          .map((p: any) => {
                            if (typeof p === 'string') {
                              const match = protocols.find((proto) => proto._id === p);
                              return match?.name;
                            }
                            return p?.name;
                          })
                          .filter(Boolean)
                          .slice(0, 3) as string[];
                        const typeClasses = session.type === 'nurturing'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-teal-50 text-teal-600';
                        const statusClasses = session.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100';

                        return (
                          <article
                            key={session._id}
                            onClick={() => setSelectedSession(session)}
                            className={`group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-teal-100 transition-all cursor-pointer flex items-start gap-4 ${session.status === 'completed' ? 'opacity-70' : ''}`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${typeClasses}`}>
                              {session.type === 'nurturing' ? (
                                <BookOpen className="w-5 h-5" />
                              ) : (
                                <UserIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-slate-900">
                                    {session.client_id?.name || session.name || 'Unnamed Session'}
                                  </p>
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    {format(sessionDate, 'MMM d, yyyy')} · {session.start_time}
                                    {session.end_time ? ` - ${session.end_time}` : ''}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize ${statusClasses}`}>
                                  {session.status}
                                </span>
                              </div>

                              {session.notes && (
                                <p className="text-sm text-slate-500 line-clamp-2">{session.notes}</p>
                              )}

                              {!!protocolNames.length && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {protocolNames.map((name) => (
                                    <span
                                      key={name}
                                      className="px-2.5 py-1 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500 rounded-full"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                  {(session.protocol_ids?.length || 0) > protocolNames.length && (
                                    <span className="text-[10px] font-bold text-slate-400">
                                      +{(session.protocol_ids?.length || 0) - protocolNames.length} more
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSession(session);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Quick View
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToEditor(session);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit Session
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {!hasSessionsInView && (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Peaceful day ahead</h3>
              <p className="text-slate-500 mt-1">You don't have any appointments scheduled yet.</p>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {(selectedSession || viewHistoryItem || selectedProtocol) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 pb-2">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  {(viewHistoryItem || selectedProtocol) && (
                    <button 
                      onClick={goBack}
                      className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className={`p-4 rounded-2xl ${activeContext.type === 'healing' || selectedProtocol ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {activeContext.type === 'healing' ? <UserIcon className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                      {selectedProtocol ? activeContext.name : (activeContext.client_id?.name || activeContext.name)}
                    </h2>
                    <p className="text-slate-500 font-medium">
                      {selectedProtocol ? 'Protocol Details' : format(new Date(activeContext.scheduled_date || activeContext.date), 'EEEE, MMM do')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!selectedProtocol && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                    <div className="flex items-center text-slate-900 font-bold">
                      <Clock className="w-4 h-4 mr-2 text-teal-600" />
                      {activeContext.start_time} - {activeContext.end_time || 'Done'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center text-slate-900 font-bold capitalize">
                      {activeContext.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2 text-amber-500" />
                      )}
                      {activeContext.status}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
              {selectedProtocol ? (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  {protocolLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin h-8 w-8 border-b-2 border-teal-600 rounded-full"></div>
                    </div>
                  ) : (
                    <>
                      <section>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-teal-600" />
                          <h3 className="font-bold text-slate-900">Description & Notes</h3>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap min-h-[120px]">
                          {activeContext.notes || 'No detailed instructions available for this protocol.'}
                        </div>
                      </section>

                      {activeContext.keywords?.length > 0 && (
                        <section>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Focus Areas</h3>
                          <div className="flex flex-wrap gap-2">
                            {activeContext.keywords.map((k: string) => (
                              <span key={k} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-bold border border-teal-100">
                                {k}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      <section>
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-5 h-5 text-teal-600" />
                          <h3 className="font-bold text-slate-900">Protocol Attachments</h3>
                        </div>
                        {activeContext.attachments?.length ? (
                          <div className="grid grid-cols-2 gap-3">
                            {(activeContext.attachments as string[]).map((url, idx) => {
                              const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                              return (
                                <div key={`${url}-${idx}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                  {isImage ? (
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400">
                                      <FileText className="w-8 h-8 mb-1" />
                                      <span className="text-[10px] font-bold uppercase truncate w-full text-center">
                                        {url.split('/').pop()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => setFullscreenFile(url)}
                                      className="p-2 bg-white/20 hover:bg-white/40 rounded-xl text-white backdrop-blur-md transition-all"
                                    >
                                      <Maximize className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 bg-slate-50 rounded-2xl p-4">No reference files attached yet.</p>
                        )}
                      </section>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center text-slate-900 font-bold capitalize">
                      {activeContext.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2 text-amber-500" />
                      )}
                      {activeContext.status}
                    </div>
                  </div>

                  <section>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold text-slate-900">Attachments</h3>
                      </div>
                      {!viewHistoryItem && (
                        <label className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors">
                          <Plus className="w-3.5 h-3.5 inline mr-1" />
                          Add Files
                          <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                        </label>
                      )}
                    </div>

                    {uploading && (
                      <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-2xl border border-dashed border-teal-200 mb-3">
                        <div className="animate-spin h-5 w-5 border-b-2 border-teal-600 rounded-full"></div>
                        <span className="text-sm font-bold text-teal-600">Uploading files...</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      {activeContext.attachments?.map((att: SessionAttachment | string, i: number) => {
                        const attachmentObj: SessionAttachment =
                          typeof att === 'string'
                            ? { path: att }
                            : att;
                        const displayUrl = attachmentObj.url || `/storage/url/${attachmentObj.path}`;
                        const isImage = (attachmentObj.mime_type || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(attachmentObj.original_name || attachmentObj.path);
                        return (
                          <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                            {isImage ? (
                              <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400">
                                <FileText className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-bold uppercase truncate w-full text-center">
                                  {(attachmentObj.original_name || attachmentObj.path).split('.').pop()}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setFullscreenFile(displayUrl)}
                                className="p-2 bg-white/20 hover:bg-white/40 rounded-xl text-white backdrop-blur-md transition-all"
                              >
                                <Maximize className="w-5 h-5" />
                              </button>
                              {!viewHistoryItem && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(attachmentObj.path)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-white backdrop-blur-md transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {(!activeContext.attachments || activeContext.attachments.length === 0) && !uploading && (
                        <div className="col-span-3 py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl text-sm font-medium">
                          No files attached
                        </div>
                      )}
                    </div>
                  </section>

                  {!viewHistoryItem && history.length > 1 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4 text-slate-900">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <h3 className="font-bold">Past Sessions</h3>
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                          {history.length - 1} Previous
                        </span>
                      </div>
                      <div className="space-y-3">
                        {history
                          .filter((h) => h._id !== selectedSession._id)
                          .slice(0, 10)
                          .map((h: any) => (
                            <div
                              key={h._id}
                              onClick={() => setViewHistoryItem(h)}
                              className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer group"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {format(new Date(h.scheduled_date), 'MMM do, yyyy')}
                                </p>
                                <p className="text-xs text-slate-500">{h.status === 'completed' ? 'Success' : 'Incomplete'}</p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors" />
                            </div>
                          ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            <div className="p-6 pt-3 border-t border-slate-50 bg-slate-50/30">
              {selectedProtocol ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all"
                >
                  Back to Session
                </button>
              ) : activeContext.status !== 'completed' && !viewHistoryItem ? (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(selectedSession);
                    closeModal();
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Mark as Completed
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {fullscreenFile && (
        <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-end p-6">
            <button
              type="button"
              onClick={() => setFullscreenFile(null)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-auto">
            {/\.(jpg|jpeg|png|webp|gif)$/i.test(fullscreenFile) ? (
              <img
                src={fullscreenFile}
                alt="Full preview"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            ) : (
              <div className="bg-white w-full max-w-4xl h-full rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-teal-600" />
                    <span className="font-bold text-slate-900 truncate">{fullscreenFile.split('/').pop()}</span>
                  </div>
                  <a
                    href={fullscreenFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
                  >
                    Download
                  </a>
                </div>
                <iframe src={fullscreenFile} className="w-full flex-1 border-none" title="File Preview" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
