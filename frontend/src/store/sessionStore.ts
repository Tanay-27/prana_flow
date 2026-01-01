import { create } from 'zustand';
import api from '../api/client';

export interface Session {
  _id: string;
  type: 'healing' | 'nurturing';
  client_id?: { _id: string; name: string; photo?: string };
  protocol_ids: string[];
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
}

interface SessionState {
  agenda: any[];
  loading: boolean;
  fetchAgenda: (start?: string, end?: string, type?: string) => Promise<void>;
  createSessions: (data: any) => Promise<void>;
  updateSession: (id: string, data: any) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  agenda: [],
  loading: false,
  fetchAgenda: async (start, end, type) => {
    set({ loading: true });
    try {
      const response = await api.get('/agenda', { params: { start, end, type } });
      set({ agenda: response.data });
    } finally {
      set({ loading: false });
    }
  },
  createSessions: async (data) => {
    await api.post('/sessions', data);
  },
  updateSession: async (id, data) => {
    const response = await api.patch(`/sessions/${id}`, data);
    set({ agenda: get().agenda.map(item => item._id === id ? { ...item, ...response.data } : item) });
  },
  deleteSession: async (id) => {
    await api.delete(`/sessions/${id}`);
    set({ agenda: get().agenda.filter(item => item._id !== id) });
  },
}));
