import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../config';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await SecureStore.getItemAsync('token');
    const headers = {
        'Content-Type': init.body instanceof FormData ? undefined as any : 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {})
    };

    const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, { ...init, headers });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText} – ${text}`);
    }
    return res.json();
}
