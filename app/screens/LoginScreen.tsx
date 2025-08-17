import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../App';
import { ParkingAPI } from '../api/parking';
import { CONFIG } from '../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const prettyError = (e: any) => {
        const msg = String(e?.message || e) || '';
        if (msg.includes('Network request failed')) {
            return `Cannot reach server.\nCheck API_BASE_URL (${CONFIG.API_BASE_URL}), Wi-Fi, and that the backend runs on 0.0.0.0:8000.`;
        }
        return msg;
    };

    const onLogin = async () => {
        const trimmed = phone.trim();
        if (!/^\+?\d{9,15}$/.test(trimmed)) {
            Alert.alert('Invalid phone', 'Enter a valid phone number (e.g., +2507xxxxxxx)');
            return;
        }
        try {
            setLoading(true);
            const { token } = await ParkingAPI.login(trimmed);
            await SecureStore.setItemAsync('token', token);
            navigation.replace('Home');
        } catch (e: any) {
            Alert.alert('Login failed', prettyError(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: '#0a0f1f' }}
        >
            {/* Top brand area */}
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20 }}>
                <Text style={{ color: 'white', fontSize: 34, fontWeight: '800', letterSpacing: 0.5 }}>
                    Smart Parking
                </Text>
                <Text style={{ color: '#9bb0ff', marginTop: 8, marginBottom: 24, fontSize: 16 }}>
                    Sign in with your phone to continue
                </Text>
            </View>

            {/* Card */}
            <View
                style={{
                    flex: 2,
                    backgroundColor: 'white',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingHorizontal: 20,
                    paddingTop: 24,
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: -4 },
                    elevation: 10,
                }}
            >
                <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Phone number</Text>
                    <TextInput
                        placeholder="+2507xxxxxxx"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        placeholderTextColor="#9aa3af"
                        style={{
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                            fontSize: 16,
                            backgroundColor: '#f9fafb',
                        }}
                    />
                    <Text style={{ color: '#6b7280', marginTop: 8, fontSize: 12 }}>
                        We’ll create your account if it doesn’t exist.
                    </Text>
                </View>

                {/* Primary button */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={loading}
                    onPress={onLogin}
                    style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}
                >
                    <LinearGradient
                        colors={loading ? ['#a5b4fc', '#93c5fd'] : ['#4f46e5', '#3b82f6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            paddingVertical: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 14,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Continue</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Footer info */}
                <View style={{ alignItems: 'center', marginTop: 14 }}>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                        API: {CONFIG.API_BASE_URL}
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
