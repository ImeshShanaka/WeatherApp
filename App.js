import React from 'react';
import HomeScreen from './screen/HomeScreen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return <HomeScreen />;
}

/*export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hello Imesh</Text>
      <StatusBar style="auto" />
    </View>
  );
}*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
