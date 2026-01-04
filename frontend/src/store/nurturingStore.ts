import { create } from 'zustand';
import api from '../api/client';

export interface NurturingAttachment {
  path: string;
  url?: string;
  original_name?: string;
  mime_type?: string;
  size?: number;
}

export interface NurturingScheduleSlot {
  from_date: string;
  to_date: string;
  from_time: string;
  to_time: string;
}

export interface NurturingSession {
  _id: string;
  name: string;
  date: string;
  coordinator?: string;
  payment_details?: string;
  status: 'Planned' | 'Registered' | 'Attended';
  recording_available_till?: string;
  schedule_slots?: NurturingScheduleSlot[];
  attachments: NurturingAttachment[];
}

interface NurturingState {
  nurturingSessions: NurturingSession[];
  loading: boolean;
  fetchNurturing: (filters?: { start?: string; end?: string }) => Promise<void>;
  addNurturing: (session: Partial<NurturingSession>) => Promise<void>;
  updateNurturing: (id: string, session: Partial<NurturingSession>) => Promise<void>;
  deleteNurturing: (id: string) => Promise<void>;
}

export const useNurturingStore = create<NurturingState>((set, get) => ({
  nurturingSessions: [],
  loading: false,
  fetchNurturing: async (filters) => {
    set({ loading: true });
    try {
      const response = await api.get('/nurturing-sessions', { params: filters });
      set({ nurturingSessions: response.data });
    } finally {
      set({ loading: false });
    }
  },
  addNurturing: async (session) => {
    const response = await api.post('/nurturing-sessions', session);
    set({ nurturingSessions: [...get().nurturingSessions, response.data] });
  },
  updateNurturing: async (id, session) => {
    const response = await api.patch(`/nurturing-sessions/${id}`, session);
    set({
      nurturingSessions: get().nurturingSessions.map((s) => (s._id === id ? response.data : s)),
    });
  },
  deleteNurturing: async (id) => {
    await api.delete(`/nurturing-sessions/${id}`);
    set({ nurturingSessions: get().nurturingSessions.filter((s) => s._id !== id) });
  },
}));
