import { useEffect, useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useQuery } from '@tanstack/react-query';
import { ParkingAPI } from '../api/parking';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export default function PaymentScreen({ route, navigation }: Props) {
    const { sessionId, paymentUrl } = route.params;
    const webRef = useRef<WebView | null>(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    // Poll session to detect "paid" after gateway returns
    const sessionQuery = useQuery({
        queryKey: ['session', sessionId, 'payment'],
        queryFn: () => ParkingAPI.getSession(sessionId),
        refetchInterval: 3000,
    });

    const s = sessionQuery.data;
    const amount = ((s?.payment?.amount_cents ?? 0) / 100).toFixed(2);
    const paid = s?.payment?.status === 'paid' || s?.payment_status === 'paid';

    useEffect(() => {
        if (paid) {
            Alert.alert('Payment received', 'Your payment was confirmed.', [
                { text: 'OK', onPress: () => navigation.replace('Session', { sessionId }) },
            ]);
        }
    }, [paid]);

    const onDeepLink = (url: string) => {
        // Expect something like smartparking://paid?session_id=...
        const parsed = Linking.parse(url);
        if (parsed.scheme && parsed.scheme.startsWith('smartparking')) {
            // Navigate back to the session; keep polling to confirm status
            navigation.replace('Session', { sessionId: (parsed.queryParams?.session_id as string) || sessionId });
            return true;
        }
        return false;
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0a0f1f' }}>
            {/* Header */}
            <LinearGradient
                colors={['#0a0f1f', '#11183a']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12 }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.08)', marginRight: 8
                        }}
                    >
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#9bb0ff', fontSize: 12 }}>Payment</Text>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>
                            {paid ? 'Paid' : 'Complete your payment'}
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: paid ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.1)',
                            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                        }}
                    >
                        <Text style={{ color: paid ? '#22c55e' : '#e5e7eb', fontWeight: '700', fontSize: 12 }}>
                            {paid ? 'PAID' : (s?.payment?.status ?? 'PENDING').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={{ marginTop: 8 }}>
                    <Text style={{ color: '#b6c0da' }}>
                        Amount: {amount} {s?.currency || 'RWF'}
                    </Text>
                    <Text style={{ color: '#667085', fontSize: 12 }}>
                        We’ll detect completion automatically.
                    </Text>
                </View>

                {/* Thin progress bar */}
                {loading || progress < 1 ? (
                    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 10, borderRadius: 999 }}>
                        <View style={{
                            height: 3,
                            width: `${Math.max(5, Math.floor(progress * 100))}%`,
                            backgroundColor: '#7aa2ff',
                            borderRadius: 999
                        }} />
                    </View>
                ) : null}
            </LinearGradient>

            {/* WebView */}
            <View style={{ flex: 1 }}>
                <WebView
                    ref={webRef}
                    source={{ uri: paymentUrl }}
                    originWhitelist={['*']}
                    onLoadStart={() => setLoading(true)}
                    onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress ?? 0)}
                    onLoadEnd={() => setLoading(false)}
                    startInLoadingState
                    renderLoading={() => (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0f1f' }}>
                            <ActivityIndicator color="#7aa2ff" />
                            <Text style={{ color: '#b6c0da', marginTop: 8 }}>Opening checkout…</Text>
                        </View>
                    )}
                    onError={(ev) => {
                        Alert.alert('Payment page error', ev.nativeEvent?.description || 'Unknown error');
                    }}
                    // Intercept deep links like smartparking://paid
                    onShouldStartLoadWithRequest={(req) => {
                        if (onDeepLink(req.url)) return false;
                        return true;
                    }}
                    // Some gateways postMessage on success; catch it just in case
                    onMessage={(ev) => {
                        try {
                            const data = JSON.parse(ev.nativeEvent.data);
                            if (data?.status === 'paid') {
                                navigation.replace('Session', { sessionId });
                            }
                        } catch {}
                    }}
                    // Android: allow redirects to external apps/browsers
                    onNavigationStateChange={(navState) => {
                        if (navState?.url && onDeepLink(navState.url)) {
                            // already handled
                        }
                    }}
                    style={{ backgroundColor: '#0a0f1f' }}
                />
            </View>

            {/* Bottom action bar */}
            <View style={{
                flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
                backgroundColor: '#0a0f1f', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)'
            }}>
                <TouchableOpacity
                    onPress={() => webRef.current?.reload()}
                    style={{
                        flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)'
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: '700' }}>Reload</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openURL(paymentUrl)}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#3155ff' }}
                    activeOpacity={0.9}
                >
                    <Text style={{ color: 'white', fontWeight: '800' }}>Open in browser</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
