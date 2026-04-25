import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Import your intro/home screen
import HomeScreen from './screens/HomeScreen';

// 1. Import BOTH Forecast files
import ForecastDark from './screens/ForecastScreen';
import ForecastLight from './screens/ForecastScreen_light';

// 2. Import BOTH Settings files
import SettingsDark from './screens/settings';
import SettingsLight from './screens/settings_light';

import { AppProvider, useAppContext } from './AppContext';

const Stack = createNativeStackNavigator();

// --- TRAFFIC COPS ---

// 3a. Wrapper for Forecast Screens
function ForecastWrapper({ navigation }) {
  const { darkMode } = useAppContext();
  // If dark mode is true, show the dark file. Otherwise, show the light file.
  if (darkMode === true) {
    return <ForecastDark navigation={navigation} />;
  } else {
    return <ForecastLight navigation={navigation} />;
  }
}

// 3b. Wrapper for Settings Screens
function SettingsWrapper({ navigation }) {
  const { darkMode } = useAppContext();
  // If dark mode is true, show the dark file. Otherwise, show the light file.
  if (darkMode === true) {
    return <SettingsDark navigation={navigation} />;
  } else {
    return <SettingsLight navigation={navigation} />;
  }
}

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
          
          {/* 4. Point the routes to our Wrapper functions! */}
          <Stack.Screen name="ForecastScreen" component={ForecastWrapper} />
          <Stack.Screen name="settings" component={SettingsWrapper} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}