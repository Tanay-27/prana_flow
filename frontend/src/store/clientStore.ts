import { create } from 'zustand';
import api from '../api/client';

export interface Client {
  _id: string;
  name: string;
  photo?: string;
  phone?: string;
  email?: string;
  notes: { text: string; timestamp: string }[];
  protocol_ids: string[];
  is_active: boolean;
  base_fee?: number;
}

interface ClientState {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  addClient: (client: Partial<Client>) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  loading: false,
  fetchClients: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/clients');
      set({ clients: response.data });
    } finally {
      set({ loading: false });
    }
  },
  addClient: async (client) => {
    const response = await api.post<Client>('/clients', client);
    set({ clients: [...get().clients, response.data] });
    return response.data;
  },
  updateClient: async (id, client) => {
    const response = await api.patch<Client>(`/clients/${id}`, client);
    set({
      clients: get().clients.map((c) => (c._id === id ? response.data : c)),
    });
    return response.data;
  },
  deleteClient: async (id) => {
    await api.delete(`/clients/${id}`);
    set({ clients: get().clients.filter((c) => c._id !== id) });
  },
}));
