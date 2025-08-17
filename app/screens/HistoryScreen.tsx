// app/screens/HistoryScreen.tsx
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ParkingAPI } from '../api/parking';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
    const q = useQuery({
        queryKey: ['history'],
        queryFn: () => ParkingAPI.history(30),
        refetchOnMount: 'always',
    });

    return (
        <View style={{ flex: 1, backgroundColor: '#0a0f1f', padding: 16 }}>
            {q.isLoading ? (
                <View style={{ marginTop: 30, alignItems: 'center' }}>
                    <ActivityIndicator color="#7aa2ff" />
                    <Text style={{ color: '#b6c0da', marginTop: 8 }}>Loading history…</Text>
                </View>
            ) : (
                <FlatList
                    data={q.data || []}
                    keyExtractor={(x) => x.id}
                    refreshControl={
                        <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor="#7aa2ff" />
                    }
                    renderItem={({ item }) => {
                        const paid = (item.amount_cents || 0) / 100;
                        const isActive = item.status === 'active';
                        const statusColor =
                            item.status === 'completed' ? '#22c55e' : isActive ? '#f59e0b' : '#d1d5db';
                        const pillBg =
                            item.status === 'completed'
                                ? 'rgba(34,197,94,0.15)'
                                : isActive
                                    ? 'rgba(245,158,11,0.15)'
                                    : 'rgba(255,255,255,0.1)';

                        return (
                            <TouchableOpacity
                                activeOpacity={isActive ? 0.9 : 1}
                                disabled={!isActive}
                                onPress={() => navigation.navigate('Session', { sessionId: item.id })}
                                style={{
                                    backgroundColor: '#0b1126',
                                    borderRadius: 16,
                                    padding: 14,
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: isActive ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                    <Ionicons name="car-outline" size={18} color="#8aa0ff" />
                                    <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8 }}>
                                        {item.plate}
                                    </Text>

                                    <View style={{ flex: 1 }} />

                                    <View
                                        style={{
                                            backgroundColor: pillBg,
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 999,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.12)',
                                        }}
                                    >
                                        <Text style={{ color: statusColor, fontWeight: '700', fontSize: 12 }}>
                                            {item.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={{ color: '#b6c0da' }}>
                                    {new Date(item.started_at).toLocaleString()}
                                </Text>

                                {item.ended_at ? (
                                    <Text style={{ color: '#b6c0da' }}>
                                        Ended: {new Date(item.ended_at).toLocaleString()}
                                    </Text>
                                ) : null}

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <Ionicons name="cash-outline" size={16} color="#8aa0ff" />
                                    <Text style={{ color: '#b6c0da', marginLeft: 6 }}>
                                        Paid: {paid.toFixed(2)} {item.currency}
                                    </Text>
                                </View>

                                {isActive && (
                                    <View
                                        style={{
                                            marginTop: 10,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: 6,
                                        }}
                                    >
                                        <Ionicons name="arrow-forward-circle" size={18} color="#f59e0b" />
                                        <Text style={{ color: '#fbbf24', fontWeight: '700' }}>
                                            Tap to manage (Pay / Exit)
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <Text style={{ color: '#b6c0da', textAlign: 'center', marginTop: 30 }}>
                            No history yet.
                        </Text>
                    }
                    contentContainerStyle={{ paddingBottom: 24 }}
                />
            )}
        </View>
    );
}
