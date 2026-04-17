import React from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_700Bold, Poppins_300Light_Italic } from '@expo-google-fonts/poppins';

export default function HomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
    const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_300Light_Italic,
  });

  if (!fontsLoaded) return null;

  return (
    <ImageBackground 
      source={require('../assets/images/dark_mode.png')} 
      style={[styles.bg, { width: width, height: height }]}
      resizeMode="cover"
    >
      <View style={styles.overlay}>

        <View style={styles.topSection}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"   
          />
          <Text style={styles.line1}>Welcome to</Text>
          <Text style={styles.line2}>WeatherBuddy</Text>
          <Text style={styles.line3}>Stay ahead of the weather in your city and plan your day with confidence.</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForecastScreen')} 
            style={styles.btn}
          >
            <Text style={styles.btnText}>Get Started</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 80,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  line1: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
    line2: {
    color: '#fff',
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
  },
    line3: {
    color: '#aaaaaa',
    fontSize: 14,
    fontFamily: 'Poppins_300Light_Italic',
    fontStyle: 'italic',
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 28,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#003580',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 12,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});