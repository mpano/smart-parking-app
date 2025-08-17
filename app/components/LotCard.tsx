// app/components/LotCard.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Lot } from '../types';

export default function LotCard({ lot, onStart }: { lot: Lot; onStart: () => void }) {
    const availability = `${lot.available}/${lot.capacity}`;
    return (
        <LinearGradient
            colors={['#101735', '#0b1126']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: 'rgba(122,162,255,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                    }}
                >
                    <Ionicons name="car-sport-outline" size={18} color="#9bb0ff" />
                </View>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', flex: 1 }}>{lot.name}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="location-outline" size={16} color="#8aa0ff" />
                <Text style={{ color: '#b6c0da', marginLeft: 6, fontSize: 13 }}>
                    {availability} spots
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="cash-outline" size={16} color="#8aa0ff" />
                <Text style={{ color: '#b6c0da', marginLeft: 6, fontSize: 13 }}>
                    {lot.price_per_hour} / hour
                </Text>
            </View>

            <TouchableOpacity
                onPress={onStart}
                activeOpacity={0.9}
                style={{
                    backgroundColor: '#3155ff',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: 'white', fontWeight: '700' }}>Start session</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}
