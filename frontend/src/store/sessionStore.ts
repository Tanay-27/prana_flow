import { create } from 'zustand';
import api from '../api/client';

export interface SessionAttachment {
  path: string;
  url?: string;
  original_name?: string;
  mime_type?: string;
  size?: number;
}

export interface SessionSlot {
  from_date: string;
  to_date: string;
  from_time: string;
  to_time: string;
}

export interface Session {
  _id: string;
  type: 'healing' | 'nurturing';
  client_id?: { _id: string; name: string; photo?: string };
  protocol_ids: any[];
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  fee?: number;
  attachments?: SessionAttachment[];
  schedule_slots?: SessionSlot[];
}

interface SessionState {
  agenda: any[];
  loading: boolean;
  fetchAgenda: (start?: string, end?: string, type?: string, search?: string) => Promise<void>;
  createSessions: (data: any) => Promise<void>;
  updateSession: (id: string, data: any) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  fetchSessionHistory: (clientId: string, start?: string, end?: string) => Promise<any[]>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  agenda: [],
  loading: false,
  fetchAgenda: async (start, end, type, search) => {
    set({ loading: true });
    try {
      const response = await api.get('/agenda', { params: { start, end, type, search } });
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
    return response.data;
  },
  deleteSession: async (id) => {
    await api.delete(`/sessions/${id}`);
    set({ agenda: get().agenda.filter(item => item._id !== id) });
  },
  fetchSessionHistory: async (clientId, start, end) => {
    const response = await api.get(`/sessions/client/${clientId}`, { params: { start, end } });
    return response.data;
  },
}));
