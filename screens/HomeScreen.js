import React from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';

export default function HomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions(); // ✅ safe way to get screen size

  return (
    <ImageBackground 
      source={require('../assets/images/dark_mode.png')} 
      style={[styles.bg, { width: width, height: height }]} // ✅ exact 1080x2340
      resizeMode="cover"
    >
      <View style={styles.overlay}>

        {/* Top section - Logo & Title */}
        <View style={styles.topSection}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"   
          />
          <Text style={styles.title}>WeatherBuddy</Text>
        </View>

        {/* Bottom section - Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('GettingStart')} 
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
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
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