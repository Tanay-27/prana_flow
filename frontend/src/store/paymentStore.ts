import { create } from 'zustand';
import api from '../api/client';

export interface Payment {
  _id: string;
  session_id?: any;
  client_id: { _id: string; name: string };
  amount_inr: number;
  mode: 'Cash' | 'UPI' | 'Bank';
  status: 'Paid' | 'Pending';
  paid_at?: string;
  createdAt: string;
}

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  fetchPayments: () => Promise<void>;
  addPayment: (payment: Partial<Payment>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  fetchPayments: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/payments');
      set({ payments: response.data });
    } finally {
      set({ loading: false });
    }
  },
  addPayment: async (payment) => {
    const response = await api.post('/payments', payment);
    set({ payments: [response.data, ...get().payments] });
  },
  updatePayment: async (id, payment) => {
    const response = await api.patch(`/payments/${id}`, payment);
    set({
      payments: get().payments.map((p) => (p._id === id ? response.data : p)),
    });
  },
  deletePayment: async (id) => {
    await api.delete(`/payments/${id}`);
    set({ payments: get().payments.filter((p) => p._id !== id) });
  },
}));
