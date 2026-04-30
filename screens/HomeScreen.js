import React from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_700Bold, Poppins_300Light_Italic } from '@expo-google-fonts/poppins';
import LottieView from 'lottie-react-native'; 

export default function HomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_300Light_Italic,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />

      <ImageBackground
        source={require('../assets/images/dark_mode.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay}>

          <View style={styles.topSection}>
            {/* Animate icon loading */}
            <LottieView
              source={require('../assets/animations/loading.json')}
              autoPlay
              loop
              style={styles.logo}
            />
            
            <Text style={styles.line1}>Welcome to</Text>
            <Text style={styles.line2}>WeatherBuddy</Text>
            <Text style={styles.line3}>
              Stay ahead of the weather in your city and plan your day with confidence.
            </Text>
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

    </View>
  );
}

//Styling
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 10,
    paddingBottom: 80,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  logo: {
    width: 380,
    height: 380,
    marginBottom: 1,
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
    marginTop: 18,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  btn: {
    backgroundColor: '#26124A',
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