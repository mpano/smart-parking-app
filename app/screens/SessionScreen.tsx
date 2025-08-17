// app/screens/SessionScreen.tsx
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ParkingAPI } from '../api/parking';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import {CONFIG} from "../config";

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

export default function SessionScreen({ route, navigation }: Props) {
    const { sessionId } = route.params;
    const qc = useQueryClient();

    const q = useQuery({
        queryKey: ['session', sessionId],
        queryFn: () => ParkingAPI.getSession(sessionId),
        refetchInterval: 10_000,
    });

    const [liveCents, setLiveCents] = useState<number | null>(null);
    const [wsState, setWsState] = useState<'connecting'|'open'|'closed'>('connecting');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            // If you add token auth on WS, read token and append like ?token=...
            const token = await SecureStore.getItemAsync('token');
            const base = CONFIG.WS_BASE_URL.replace(/\/+$/, '');
            const url = `${base}/sessions/ws/sessions/${sessionId}` + (token ? `?token=${encodeURIComponent(token)}` : '');

            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => { if (!mounted) return; setWsState('open'); };
            ws.onclose = () => { if (!mounted) return; setWsState('closed'); };
            ws.onerror = () => { /* ignore; onclose will fire */ };

            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg?.type === 'tick' && typeof msg.amount_cents === 'number') {
                        setLiveCents(msg.amount_cents);
                    }
                } catch {}
            };
        })();

        return () => {
            mounted = false;
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [sessionId]);

    const exitMutation = useMutation({
        mutationFn: () => ParkingAPI.exitSession(sessionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['session', sessionId] });
            setTimeout(() => wsRef.current?.close(), 100); // stop live updates
        },
        onError: (e: any) => Alert.alert('Exit failed', e.message),
    });

    const payMutation = useMutation({
        mutationFn: () => ParkingAPI.getPaymentUrl(sessionId),
        onSuccess: ({ payment_url }) => navigation.navigate('Payment', { sessionId, paymentUrl: payment_url }),
        onError: (e: any) => Alert.alert('Payment link error', e.message),
    });

    const s = q.data;
    const cents = liveCents ?? (s?.payment?.amount_cents ?? 0);
    const amount = (cents / 100).toFixed(2);

    return (
        <View style={{ flex: 1, backgroundColor: '#0a0f1f' }}>
            <LinearGradient
                colors={['#0a0f1f', '#11183a']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 }}
            >
                <Text style={{ color: '#9bb0ff', fontSize: 14 }}>{s?.status === 'active' ? 'Active session' : 'Session'}</Text>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>My Session</Text>
            </LinearGradient>

            {q.isLoading ? (
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <ActivityIndicator color="#7aa2ff" />
                    <Text style={{ color: '#b6c0da', marginTop: 8 }}>Loading session…</Text>
                </View>
            ) : (
                <View style={{ padding: 16, gap: 12 }}>
                    {/* Plate card */}
                    <View
                        style={{
                            backgroundColor: '#0b1126',
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.06)',
                        }}
                    >
                        <Text style={{ color: '#9bb0ff', fontSize: 12, marginBottom: 6 }}>Plate</Text>
                        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: 1 }}>
                            {s?.plate}
                        </Text>

                        <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                            <Ionicons name="business-outline" size={16} color="#8aa0ff" />
                            <Text style={{ color: '#b6c0da', marginLeft: 6 }}>
                                {s?.lot_name ?? s?.lot_id}
                            </Text>

                            <View style={{ flex: 1 }} />

                            <View
                                style={{
                                    backgroundColor: s?.status === 'active' ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.1)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor: s?.status === 'active' ? 'rgba(46,204,113,0.35)' : 'rgba(255,255,255,0.15)',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                {s?.status === 'active' && (
                                    <Ionicons
                                        name={wsState === 'open' ? 'radio-outline' : 'refresh-outline'}
                                        size={12}
                                        color="#2ecc71"
                                    />
                                )}
                                <Text
                                    style={{
                                        color: s?.status === 'active' ? '#2ecc71' : '#d1d5db',
                                        fontWeight: '700',
                                        fontSize: 12,
                                    }}
                                >
                                    {s?.status?.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Amount card */}
                    <View
                        style={{
                            backgroundColor: '#0b1126',
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.06)',
                        }}
                    >
                        <Text style={{ color: '#9bb0ff', fontSize: 12, marginBottom: 6 }}>
                            {s?.status === 'active' ? 'Current amount' : 'Total amount'}
                        </Text>
                        <Text style={{ color: 'white', fontSize: 26, fontWeight: '800' }}>
                            {amount} {s?.currency}
                        </Text>
                        <Text style={{ color: '#b6c0da', marginTop: 4, fontSize: 12 }}>
                            {s?.status === 'active'
                                ? (wsState === 'open' ? 'Live' : 'Updating…') + ' • refresh ~3s'
                                : 'Finalized'}
                        </Text>
                    </View>

                    {/* CTAs */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => payMutation.mutate()}
                            activeOpacity={0.9}
                            style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}
                        >
                            <LinearGradient
                                colors={['#4f46e5', '#3b82f6']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 14 }}
                            >
                                <Text style={{ color: 'white', fontWeight: '800' }}>
                                    {payMutation.isPending ? 'Preparing…' : 'Pay now'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => exitMutation.mutate()}
                            activeOpacity={0.9}
                            style={{
                                flex: 1,
                                paddingVertical: 14,
                                alignItems: 'center',
                                borderRadius: 14,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.12)',
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '800' }}>
                                {exitMutation.isPending ? 'Closing…' : 'Exit'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ alignSelf: 'center', marginTop: 4 }}>
                        <Text style={{ color: '#9bb0ff' }}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
