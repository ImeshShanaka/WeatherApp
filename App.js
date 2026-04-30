import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import ForecastScreen from './screens/ForecastScreen';
import HourlyScreen from './screens/hourly';
import AirQualityScreen from './screens/AirQualityScreen';
import SettingsScreen from './screens/settings';
import { AppProvider } from './AppContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <Stack.Navigator screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' }
        }}>
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          
          <Stack.Screen name="ForecastScreen" component={ForecastScreen} />
          <Stack.Screen name="HourlyScreen" component={HourlyScreen} />
          <Stack.Screen name="AirQualityScreen" component={AirQualityScreen} />
          <Stack.Screen name="settings" component={SettingsScreen} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}