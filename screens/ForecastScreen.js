import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ForecastScreen({ navigation }) {  // ✅ must have "export default"
  return (
    <View style={styles.container}>
      <Text>Forecast Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});