import { api } from './client';
import type { Lot, Session } from '../types';

export const ParkingAPI = {
    login: (phone: string) => api<{token: string}>('/auth/login', { method: 'POST', body: JSON.stringify({ phone }) }),

    getLots: (lat?: number, lng?: number) =>
        api<Lot[]>(`/lots${lat && lng ? `?lat=${lat}&lng=${lng}&radius_km=20` : ''}`),

    startSession: (payload: { lot_id: string; plate?: string; photo_url?: string; }) =>
        api<Session>('/sessions', { method: 'POST', body: JSON.stringify(payload) }),

    getActiveSession: (plate: string) =>
        api<Session | null>(`/sessions/active?plate=${encodeURIComponent(plate)}`),

    getSession: (id: string) =>
        api<Session>(`/sessions/${id}`),

    exitSession: (id: string) =>
        api<Session>(`/sessions/${id}/exit`, { method: 'POST' }),

    getPaymentUrl: (id: string) =>
        api<{ payment_url: string }>(`/sessions/${id}/pay`, { method: 'POST' }),

    history: (limit = 20) =>
        api<Session[]>(`/sessions/history?limit=${limit}`),

    uploadPhoto: async (uri: string) => {
        const form = new FormData();
        // @ts-ignore: RN FormData file
        form.append('file', { uri, type: 'image/jpeg', name: 'plate.jpg' });
        return api<{ file_url: string }>('/upload', { method: 'POST', body: form });
    }
};
