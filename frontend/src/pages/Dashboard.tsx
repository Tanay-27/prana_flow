import React, { useEffect, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import { Clock, User as UserIcon, BookOpen, AlertCircle, CheckCircle2, X, ChevronRight, ArrowLeft } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { agenda, fetchAgenda, loading, updateSession, fetchSessionHistory } = useSessionStore();
  const [filter, setFilter] = useState<'all' | 'healing' | 'nurturing'>('all');

  useEffect(() => {
    fetchAgenda(undefined, undefined, filter);
  }, [fetchAgenda, filter]);

  const groupAgendaByDate = () => {
    const groups: { [key: string]: any[] } = {};
    agenda.forEach((item) => {
      const date = format(new Date(item.scheduled_date || item.date), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const handleToggleStatus = async (session: any) => {
    const newStatus = session.status === 'completed' ? 'scheduled' : 'completed';
    await updateSession(session._id, { status: newStatus });
    if (selectedSession?._id === session._id) {
      setSelectedSession({ ...selectedSession, status: newStatus });
    }
  };

  const groupedAgenda = groupAgendaByDate();
  const next7Days = Array.from({ length: 7 }, (_, i) => format(addDays(startOfDay(new Date()), i), 'yyyy-MM-dd'));

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = groupedAgenda[todayStr] || [];
  const completedToday = todaySessions.filter(s => s.status === 'completed').length;
  const totalThisWeek = agenda.length;

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewHistoryItem, setViewHistoryItem] = useState<any>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);

  useEffect(() => {
    if (selectedSession?.client_id?._id) {
      fetchSessionHistory(selectedSession.client_id._id).then(setHistory);
    }
  }, [selectedSession]);

  const closeModal = () => {
    setSelectedSession(null);
    setViewHistoryItem(null);
    setSelectedProtocol(null);
  };

  const goBack = () => {
    if (selectedProtocol) {
      setSelectedProtocol(null);
    } else if (viewHistoryItem) {
      setViewHistoryItem(null);
    }
  };

  const activeContext = selectedProtocol || viewHistoryItem || selectedSession;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Atma Namaste!</h1>
          <p className="text-slate-500 mt-2">Healings and nurturing sessions for the week</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl">
          {[
            { id: 'all', label: 'All' },
            { id: 'healing', label: 'Healing' },
            { id: 'nurturing', label: 'Nurturing' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${filter === btn.id ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {btn.label}
            </button>
          ))}
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

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {next7Days.map((dateStr) => {
            const sessions = groupedAgenda[dateStr] || [];
            const date = new Date(dateStr);
            let label = format(date, 'EEEE, MMM do');
            if (isToday(date)) label = 'Today';
            if (isTomorrow(date)) label = 'Tomorrow';

            return (
              <section key={dateStr}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {label}
                  </h2>
                  {sessions.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {sessions.length} {sessions.length === 1 ? 'Task' : 'Tasks'}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm">
                      No sessions scheduled
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session._id}
                        onClick={() => setSelectedSession(session)}
                        className={`group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-teal-100 transition-all cursor-pointer flex items-start gap-4 ${session.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                      >
                        <div className={`p-3 rounded-xl ${session.type === 'healing' ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {session.type === 'healing' ? <UserIcon className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className={`font-bold text-slate-900 truncate ${session.status === 'completed' ? 'line-through decoration-slate-400' : ''}`}>
                              {session.type === 'healing' ? session.client_id?.name || 'Healing Session' : session.name}
                            </h3>
                            <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3 mr-1" />
                              {session.start_time || 'No time set'}
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {session.notes || (session.type === 'healing' ? 'Pranic Healing Protocol' : session.coordinator || 'Special workshop')}
                          </p>
                        </div>
                        {session.type === 'healing' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(session);
                            }}
                            className={`p-2 rounded-xl transition-all ${session.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-teal-600 hover:bg-teal-50'}`}
                          >
                            <CheckCircle2 className="w-6 h-6" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {agenda.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Peaceful day ahead</h3>
          <p className="text-slate-500 mt-1">You don't have any appointments scheduled yet.</p>
        </div>
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

                  {activeContext.attachments?.length > 0 && (
                    <section>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</h3>
                      <div className="space-y-2">
                        {activeContext.attachments.map((url: string, i: number) => (
                          <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group"
                          >
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                              <BookOpen className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-600">Attachment {i + 1}</span>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Protocols List */}
                  {activeContext.protocol_ids?.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold text-slate-900">Healing Protocol</h3>
                      </div>
                      <div className="space-y-2">
                        {activeContext.protocol_ids.map((p: any) => (
                          <div 
                            key={p._id} 
                            onClick={() => setSelectedProtocol(p)}
                            className="bg-teal-50/50 border border-teal-100 p-4 rounded-xl cursor-pointer hover:bg-teal-100/50 transition-all group"
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-teal-900">{p.name}</p>
                              <ChevronRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                            {p.keywords?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {p.keywords.slice(0, 3).map((k: string) => (
                                  <span key={k} className="text-[10px] font-bold text-teal-600 bg-white px-2 py-0.5 rounded-full border border-teal-50">
                                    {k}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Notes Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-slate-400" />
                      <h3 className="font-bold text-slate-900">Session Notes</h3>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-slate-600 text-sm leading-relaxed min-h-[80px]">
                      {activeContext.notes || 'No special instructions for this session.'}
                    </div>
                  </section>

                  {/* History Section */}
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
                          .filter(h => h._id !== selectedSession._id)
                          .slice(0, 3)
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
                </div>
              )}
            </div>

            <div className="p-6 pt-3 border-t border-slate-50 bg-slate-50/30">
              {selectedProtocol ? (
                <button 
                  onClick={goBack}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all"
                >
                  Back to Session
                </button>
              ) : activeContext.status !== 'completed' && !viewHistoryItem ? (
                <button 
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
    </div>
  );
};

export default Dashboard;
