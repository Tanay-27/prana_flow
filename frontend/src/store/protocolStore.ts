import { create } from 'zustand';
import api from '../api/client';

export interface Protocol {
  _id: string;
  name: string;
  notes?: string;
  keywords: string[];
  attachments: string[];
  updatedAt: string;
}

interface ProtocolState {
  protocols: Protocol[];
  loading: boolean;
  fetchProtocols: (search?: string, start?: string, end?: string) => Promise<void>;
  addProtocol: (protocol: Partial<Protocol>) => Promise<void>;
  updateProtocol: (id: string, protocol: Partial<Protocol>) => Promise<void>;
  deleteProtocol: (id: string) => Promise<void>;
}

export const useProtocolStore = create<ProtocolState>((set, get) => ({
  protocols: [],
  loading: false,
  fetchProtocols: async (search, start, end) => {
    set({ loading: true });
    try {
      const response = await api.get('/protocols', { params: { search, start, end } });
      set({ protocols: response.data });
    } finally {
      set({ loading: false });
    }
  },
  addProtocol: async (protocol) => {
    const response = await api.post('/protocols', protocol);
    set({ protocols: [...get().protocols, response.data] });
  },
  updateProtocol: async (id, protocol) => {
    const response = await api.patch(`/protocols/${id}`, protocol);
    set({
      protocols: get().protocols.map((p) => (p._id === id ? response.data : p)),
    });
  },
  deleteProtocol: async (id) => {
    await api.delete(`/protocols/${id}`);
    set({ protocols: get().protocols.filter((p) => p._id !== id) });
  },
}));
