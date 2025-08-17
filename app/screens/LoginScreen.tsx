import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ParkingAPI } from '../api/parking';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [phone, setPhone] = useState('');

    const onLogin = async () => {
        try {
            const { token } = await ParkingAPI.login(phone);
            await SecureStore.setItemAsync('token', token);
            navigation.replace('Home');
        } catch (e: any) {
            Alert.alert('Login failed', e.message);
        }
    };

    return (
        <View style={{ flex:1, padding:16, gap:12, justifyContent:'center' }}>
            <Text style={{ fontSize:24, fontWeight:'600' }}>Welcome</Text>
            <Text>Enter your phone to continue</Text>
            <TextInput
                placeholder="+2507..."
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{ borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:12 }}
            />
            <Button title="Continue" onPress={onLogin} />
        </View>
    );
}
