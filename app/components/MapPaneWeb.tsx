// app/components/MapPaneWeb.tsx
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Lot = {
    id: string; name: string; lat: number; lng: number;
    available?: number; capacity?: number; price_per_hour?: string | number;
};

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

export default function MapPaneWeb({
                                       lots, user, onStart, style
                                   }: {
    lots: Lot[]; user?: {lat:number; lng:number} | null;
    onStart: (lotId: string)=>void; style?: any;
}) {
    const initial = user ?? (lots[0] ? { lat: lots[0].lat, lng: lots[0].lng } : { lat: -1.9577, lng: 30.1127 });

    return (
        <View style={[{ height: 280, borderRadius: 16, overflow:'hidden', backgroundColor:'#0b1126' }, style]}>
            <APIProvider apiKey={GOOGLE_KEY}>
                <Map
                    style={{ width: '100%', height: '100%' }}
                    defaultZoom={15}
                    defaultCenter={{ lat: initial.lat, lng: initial.lng }}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                >
                    {lots.map((l) => (
                        <Marker
                            key={l.id}
                            position={{ lat: l.lat, lng: l.lng }}
                            onClick={() => onStart(l.id)}
                        />
                    ))}
                </Map>
            </APIProvider>

            {/* simple legend / recenter */}
            <View style={{
                position:'absolute', left:12, bottom:12, right:12,
                flexDirection:'row', justifyContent:'space-between', alignItems:'center'
            }}>
                <View style={{
                    backgroundColor:'rgba(255,255,255,0.08)', borderColor:'rgba(255,255,255,0.12)',
                    borderWidth:1, borderRadius:12, paddingHorizontal:10, paddingVertical:6
                }}>
                    <Text style={{ color:'#b6c0da', fontSize:12 }}>Tap a pin to start</Text>
                </View>

                <TouchableOpacity
                    onPress={() => location.reload()}
                    style={{ backgroundColor:'rgba(10,15,31,0.8)', padding:10, borderRadius:12,
                        borderWidth:1, borderColor:'rgba(255,255,255,0.15)' }}
                >
                    <Ionicons name="locate-outline" size={18} color="#9bb0ff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
