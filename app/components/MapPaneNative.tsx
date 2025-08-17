// app/components/MapPaneNative.tsx
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Lot = {
    id: string; name: string; lat: number; lng: number;
    available?: number; capacity?: number; price_per_hour?: string | number;
};

export default function MapPaneNative({
                                          lots, user, onStart, style
                                      }: {
    lots: Lot[]; user?: {lat:number; lng:number} | null;
    onStart: (lotId: string)=>void; style?: any;
}) {
    const initial = user ?? (lots[0] ? { lat: lots[0].lat, lng: lots[0].lng } : { lat: -1.9577, lng: 30.1127 });
    const region = { latitude: initial.lat, longitude: initial.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };

    let mapRef: MapView | null = null;

    return (
        <View style={[{ borderRadius: 16, overflow:'hidden', height: 280, backgroundColor:'#0b1126' }, style]}>
            <MapView
                ref={(r)=> (mapRef = r)}
                style={{ flex:1 }}
                initialRegion={region}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={!!user}
                showsCompass
                toolbarEnabled={false}
                customMapStyle={darkStyle}
            >
                {lots.map(l => (
                    <Marker
                        key={l.id}
                        coordinate={{ latitude: l.lat, longitude: l.lng }}
                        title={l.name}
                        description={`${l.available ?? '-'} / ${l.capacity ?? '-'} • ${l.price_per_hour ?? ''}/h`}
                        onPress={()=> onStart(l.id)}
                    />
                ))}
            </MapView>

            {/* recenter */}
            <TouchableOpacity
                onPress={() => mapRef?.animateToRegion(region, 500)}
                style={{
                    position:'absolute', right:12, bottom:12, backgroundColor:'rgba(10,15,31,0.8)',
                    borderWidth:1, borderColor:'rgba(255,255,255,0.15)', padding:10, borderRadius:12
                }}
                activeOpacity={0.9}
            >
                <Ionicons name="locate-outline" size={20} color="#9bb0ff" />
            </TouchableOpacity>
        </View>
    );
}

const darkStyle = [
    { "elementType": "geometry", "stylers": [{"color":"#1d2c4d"}] },
    { "elementType": "labels.text.fill", "stylers":[{"color":"#8ec3b9"}] },
    { "featureType":"poi", "stylers":[{"visibility":"off"}] },
    { "featureType":"road","stylers":[{"color":"#1b2a41"}] },
    { "featureType":"water","stylers":[{"color":"#0e1626"}] }
];
