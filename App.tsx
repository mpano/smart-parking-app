import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import HomeScreen from './app/screens/HomeScreen';
import StartSessionScreen from './app/screens/StartSessionScreen';
import SessionScreen from './app/screens/SessionScreen';
import PaymentScreen from './app/screens/PaymentScreen';
import HistoryScreen from './app/screens/HistoryScreen';
import LoginScreen from './app/screens/LoginScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  StartSession: { lotId: string } | undefined;
  Session: { sessionId: string };
  Payment: { sessionId: string, paymentUrl: string };
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const qc = new QueryClient();

export default function App() {
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  return (
      <QueryClientProvider client={qc}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="StartSession" component={StartSessionScreen} options={{ title: 'Start Session' }} />
            <Stack.Screen name="Session" component={SessionScreen} options={{ title: 'My Session' }} />
            <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pay' }} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
  );
}
