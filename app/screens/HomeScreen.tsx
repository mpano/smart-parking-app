// app/screens/HomeScreen.tsx
import { useEffect, useMemo, useState } from 'react';
import {
    View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ParkingAPI } from '../api/parking';
import LotCard from '../components/LotCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { metersBetween } from '../utils/geo';
import { Platform as RNPlatform } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const MapPaneNative = RNPlatform.select<any>({ ios: require('../components/MapPaneNative').default, android: require('../components/MapPaneNative').default, default: null });
const MapPaneWeb    = RNPlatform.select<any>({ web: require('../components/MapPaneWeb').default, default: null });

export default function HomeScreen({ navigation }: Props) {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [mode, setMode] = useState<'list'|'map'>('map');

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            }
        })();
    }, []);

    const lotsQuery = useQuery({
        queryKey: ['lots', coords],
        queryFn: () => ParkingAPI.getLots(coords?.lat, coords?.lng),
    });

    const lotsSorted = useMemo(() => {
        const arr = [...(lotsQuery.data || [])];
        if (!coords) return arr;
        return arr.sort((a, b) => {
            const da = metersBetween(coords, { lat: a.lat, lng: a.lng });
            const db = metersBetween(coords, { lat: b.lat, lng: b.lng });
            return da - db;
        });
    }, [lotsQuery.data, coords]);

    const start = (lotId: string) => navigation.navigate('StartSession', { lotId });

    const MapPane = RNPlatform.OS === 'web' ? MapPaneWeb : MapPaneNative;

    return (
        <View style={{ flex: 1, backgroundColor: '#0a0f1f' }}>
            {/* Header */}
            <LinearGradient
                colors={['#0a0f1f', '#0a0f1f', '#11183a']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingHorizontal: 20, paddingBottom: 12 }}
            >
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                    <View>
                        <Text style={{ color: '#9bb0ff', fontSize: 14 }}>Nearby</Text>
                        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>Parking Lots</Text>
                    </View>

                    <View style={{ flexDirection:'row', gap:8 }}>
                        <TouchableOpacity
                            onPress={() => setMode('list')}
                            style={{ paddingVertical:8, paddingHorizontal:12, borderRadius:10,
                                backgroundColor: mode==='list' ? '#3155ff' : 'rgba(255,255,255,0.08)' }}
                        >
                            <Text style={{ color:'#fff', fontWeight:'700' }}>List</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setMode('map')}
                            style={{ paddingVertical:8, paddingHorizontal:12, borderRadius:10,
                                backgroundColor: mode==='map' ? '#3155ff' : 'rgba(255,255,255,0.08)' }}
                        >
                            <Text style={{ color:'#fff', fontWeight:'700' }}>Map</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('History')}
                            style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 12 }}
                        >
                            <Ionicons name="time-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
                {lotsQuery.isLoading ? (
                    <View style={{ marginTop: 30, alignItems: 'center' }}>
                        <ActivityIndicator color="#7aa2ff" />
                        <Text style={{ color: '#b6c0da', marginTop: 8 }}>Finding lots near you…</Text>
                    </View>
                ) : mode === 'map' && MapPane ? (
                    <MapPane lots={lotsSorted} user={coords} onStart={start} />
                ) : (
                    <FlatList
                        data={lotsSorted}
                        keyExtractor={(x) => x.id}
                        renderItem={({ item }) => (
                            <LotCard lot={item} onStart={() => start(item.id)} />
                        )}
                        refreshControl={
                            <RefreshControl refreshing={lotsQuery.isFetching} onRefresh={() => lotsQuery.refetch()} tintColor="#7aa2ff" />
                        }
                        ListEmptyComponent={
                            <Text style={{ color: '#b6c0da', textAlign: 'center', marginTop: 30 }}>
                                No lots found nearby.
                            </Text>
                        }
                        contentContainerStyle={{ paddingBottom: 24 }}
                    />
                )}
            </View>
        </View>
    );
}
