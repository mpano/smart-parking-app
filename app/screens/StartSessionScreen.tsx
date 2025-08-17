// app/screens/StartSessionScreen.tsx
import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useMutation } from '@tanstack/react-query';
import { ParkingAPI } from '../api/parking';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'StartSession'>;

export default function StartSessionScreen({ route, navigation }: Props) {
    const { lotId } = route.params || {};
    const [plate, setPlate] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [facing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [taking, setTaking] = useState(false);

    const cameraRef = useRef<React.ComponentRef<typeof CameraView> | null>(null);

    const startMutation = useMutation({
        mutationFn: async () => {
            let photo_url: string | undefined;
            if (photoUri) {
                const { file_url } = await ParkingAPI.uploadPhoto(photoUri);
                photo_url = file_url;
            }
            const session = await ParkingAPI.startSession({
                lot_id: lotId!,
                plate: plate || undefined,
                photo_url,
            });
            return session;
        },
        onSuccess: (session) => navigation.replace('Session', { sessionId: session.id }),
        onError: (e: any) => Alert.alert('Failed to start', e.message),
    });

    const takePhoto = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) return;
        }
        setTaking(true);
        try {
            const photo = await cameraRef.current?.takePictureAsync({ skipProcessing: true });
            if (photo?.uri) setPhotoUri(photo.uri);
        } finally {
            setTaking(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0a0f1f' }}>
            <LinearGradient
                colors={['#0a0f1f', '#11183a']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 }}
            >
                <Text style={{ color: '#9bb0ff', fontSize: 14 }}>Create</Text>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>Start Session</Text>
            </LinearGradient>

            <View style={{ flex: 1, padding: 16, gap: 14 }}>
                {/* Plate input */}
                <View
                    style={{
                        backgroundColor: '#0b1126',
                        borderRadius: 16,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.06)',
                    }}
                >
                    <Text style={{ color: '#9bb0ff', fontSize: 12, marginBottom: 6 }}>Plate</Text>
                    <TextInput
                        placeholder="e.g., RAD123B"
                        placeholderTextColor="#9aa3af"
                        value={plate}
                        onChangeText={(v) => setPlate(v.toUpperCase())}
                        autoCapitalize="characters"
                        style={{
                            backgroundColor: '#0f1738',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.08)',
                            color: 'white',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            fontSize: 16,
                        }}
                    />
                    <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
                        You can also snap the plate instead.
                    </Text>
                </View>

                {/* Camera / Photo */}
                <View
                    style={{
                        backgroundColor: '#0b1126',
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                    }}
                >
                    {photoUri ? (
                        <View>
                            <Image source={{ uri: photoUri }} style={{ width: '100%', height: 240, borderRadius: 12 }} />
                            <TouchableOpacity
                                onPress={() => setPhotoUri(null)}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: 12,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    padding: 8,
                                    borderRadius: 999,
                                }}
                            >
                                <Ionicons name="close" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <CameraView ref={cameraRef} style={{ width: '100%', height: 240, borderRadius: 12 }} facing={facing} />
                    )}

                    <TouchableOpacity
                        onPress={photoUri ? () => setPhotoUri(null) : takePhoto}
                        activeOpacity={0.9}
                        style={{
                            marginTop: 12,
                            borderRadius: 12,
                            overflow: 'hidden',
                        }}
                    >
                        <LinearGradient
                            colors={photoUri ? ['#a5b4fc', '#93c5fd'] : ['#4f46e5', '#3b82f6']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={{ paddingVertical: 14, alignItems: 'center' }}
                        >
                            {taking ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ color: 'white', fontWeight: '800' }}>
                                    {photoUri ? 'Retake Photo' : 'Take Photo'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Start button */}
                <TouchableOpacity
                    onPress={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                    activeOpacity={0.9}
                    style={{ borderRadius: 14, overflow: 'hidden' }}
                >
                    <LinearGradient
                        colors={startMutation.isPending ? ['#a5b4fc', '#93c5fd'] : ['#22c55e', '#16a34a']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ paddingVertical: 16, alignItems: 'center' }}
                    >
                        <Text style={{ color: 'white', fontWeight: '800' }}>
                            {startMutation.isPending ? 'Starting…' : 'Start Session'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}
