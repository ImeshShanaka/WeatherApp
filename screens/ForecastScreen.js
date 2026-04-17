import React from 'react';
import { ImageBackground, View, Text, StyleSheet, useWindowDimensions } from 'react-native';

export default function ForecastScreen({ navigation }) {
  const { width, height } = useWindowDimensions();

  return (
    <ImageBackground
      source={require('../assets/images/dark_mode.png')} 
      style={[styles.bg, { width: width, height: height }]}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.text}>Forecast Screen</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});