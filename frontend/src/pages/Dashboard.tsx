import React, { useEffect, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import { Clock, User as UserIcon, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { agenda, fetchAgenda, loading, updateSession } = useSessionStore();
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
  };

  const groupedAgenda = groupAgendaByDate();
  const next7Days = Array.from({ length: 7 }, (_, i) => format(addDays(startOfDay(new Date()), i), 'yyyy-MM-dd'));

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Agenda</h1>
          <p className="text-slate-500 mt-2">Healings and nurturing sessions for the week</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          {[
            { id: 'all', label: 'All' },
            { id: 'healing', label: 'Healing' },
            { id: 'nurturing', label: 'Nurturing' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === btn.id ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )}

      {!loading && (
        <div className="space-y-10">
          {next7Days.map((dateStr) => {
            const sessions = groupedAgenda[dateStr] || [];
            const date = new Date(dateStr);
            let label = format(date, 'EEEE, MMM do');
            if (isToday(date)) label = 'Today';
            if (isTomorrow(date)) label = 'Tomorrow';

            return (
              <section key={dateStr}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
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
                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-6 text-center text-slate-400 text-sm">
                      No sessions scheduled
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session._id}
                        className={`group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 ${session.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                      >
                        <div className={`p-3 rounded-2xl ${session.type === 'healing' ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
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
                            onClick={() => handleToggleStatus(session)}
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
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Peaceful day ahead</h3>
          <p className="text-slate-500 mt-1">You don't have any appointments scheduled yet.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
