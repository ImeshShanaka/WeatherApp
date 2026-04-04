import { LinearGradient } from 'expo-linear-gradient';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={['#0B1C3D', '#0A2A66', '#0D47A1']}
      style={{ flex: 1 }}
    >
      <View style={{ marginTop: 80, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 28 }}>
          Colombo
        </Text>
        <Text style={{ color: '#ccc', marginTop: 5 }}>
          May 28, 2026
        </Text>
      </View>
    </LinearGradient>
  );
}