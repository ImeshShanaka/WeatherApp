import React, { useState } from 'react';
import {
  ImageBackground,
  Image,
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useAppContext } from '../AppContext';
import { 
  CloudIcon, 
  CogIcon,
  MapPinIcon,
  ClockIcon,
  SunIcon,
  InformationCircleIcon,
  CircleStackIcon
} from 'react-native-heroicons/outline';

function CustomWindIcon({ size, color }) {
  return (
    <Image 
      source={require('../assets/icons/wind.png')} 
      style={{ width: size, height: size, tintColor: color }} 
      resizeMode="contain" 
    />
  );
}

//Bottom navigation bar
function BottomNavBar({ activeTab, onTabPress }) {
  const tabs = [
    { key: 'weather', label: 'Weather', Icon: CloudIcon },
    { key: 'hourly', label: 'Hourly', Icon: ClockIcon },
    { key: 'air', label: 'Air', Icon: CustomWindIcon },
    { key: 'settings', label: 'Settings', Icon: CogIcon },
  ];
  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <tab.Icon
              size={22}
              color={isActive ? '#A78BFA' : 'rgba(255,255,255,0.58)'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive, { marginTop: 4 }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

//settings
function SettingsRow({ icon, label, right, onPress, showArrow }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {right}
        {showArrow && <Text style={styles.arrow}>›</Text>}
      </View>
    </Wrapper>
  );
}

//change tempereture
function TempToggle({ unit, onChange }) {
  return (
    <View style={styles.tempToggle}>
      <Text style={[styles.tempLabel, unit === 'C' && styles.tempLabelActive]}>°C</Text>
      <Switch
        value={unit === 'F'}
        onValueChange={(val) => onChange(val ? 'F' : 'C')}
        trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.3)' }}
        thumbColor="#fff"
        ios_backgroundColor="rgba(255,255,255,0.3)"
        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
      />
      <Text style={[styles.tempLabel, unit === 'F' && styles.tempLabelActive]}>°F</Text>
    </View>
  );
}

//main
export default function SettingsDark({ navigation }) {
  const {
    unit, updateUnit,
    darkMode,
    savedCity, updateSavedCity,
  } = useAppContext();

  const [locationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  const handleRefreshLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to refresh your location.');
        return;
      }
      
      // Use High accuracy to get exact GPS coordinates
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      
      // Bypass expo-location and use BigDataCloud's free reverse geocoder (no API key needed)
      // This is much better at finding exact local towns instead of broad districts
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const place = await response.json();
      
      if (place) {
        let cityName = place.locality || place.city || place.principalSubdivision;
        
        if (cityName) {
          cityName = cityName.replace(' District', '');
          
          await updateSavedCity(cityName);
          Alert.alert('Location Updated', `Default city set to ${cityName}.`);
        } else {
          Alert.alert('Error', 'Could not determine city from your location.');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  //navigation settings
  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'weather' && navigation) {
      navigation.navigate('ForecastScreen'); 
    }
    if (key === 'hourly' && navigation) {
      navigation.navigate('HourlyScreen');
    }
    if (key === 'air' && navigation) {
      navigation.navigate('AirQualityScreen');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/dark_mode.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/*title*/}
          <Text style={styles.pageTitle}>Settings</Text>

          {/*units*/}
          <SectionHeader title="UNITS" />
          <View style={styles.glassCard}>
            <View style={styles.glassCardShimmer} />
            <SettingsRow
              icon={
                <Image 
                  source={require('../assets/icons/temprature.png')} 
                  style={{ width: 22, height: 22, tintColor: '#fff' }} 
                  resizeMode="contain" 
                />
              }
              label="Temperature Unit"
              right={<TempToggle unit={unit} onChange={updateUnit} />}
            />
          </View>

          {/*location*/}
          <SectionHeader title="LOCATION" />
          <View style={styles.glassCard}>
            <View style={styles.glassCardShimmer} />
            <SettingsRow
              icon={<MapPinIcon size={22} color="#fff" />}
              label={
                savedCity
                  ? `${savedCity} (current default)`
                  : 'Refresh My Location'
              }
              onPress={handleRefreshLocation}
              showArrow={!locationLoading}
              right={
                locationLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : null
              }
            />
          </View>

          {/*about*/}
          <SectionHeader title="ABOUT" />
          <View style={styles.glassCard}>
            <View style={styles.glassCardShimmer} />
            <SettingsRow
              icon={<InformationCircleIcon size={22} color="#fff" />}
              label="Weather App"
              right={<Text style={styles.aboutValue}>v1.0.2</Text>}
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon={<CircleStackIcon size={22} color="#fff" />}
              label="Data Source"
              right={<Text style={styles.aboutValue}>OpenWeatherMap / Open-Meteo</Text>}
            />
          </View>
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Made with ❤️ by <Text style={styles.footerName}>Imesh Shanaka</Text>
              </Text>
            </View>
        </ScrollView>

        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    </ImageBackground>
  );
}

//styling
const styles = StyleSheet.create({
  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72, 52, 160, 0.72)',
  },

  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  pageTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 28,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  sectionHeader: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },

  glassCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(136, 71, 188, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
    }),
    overflow: 'hidden',
    position: 'relative',
  },
  
  glassCardShimmer: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
    fontWeight: '300',
    marginLeft: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },

  tempToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tempLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  tempLabelActive: {
    color: '#fff',
  },

  aboutValue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },

  navBar: {
    flexDirection: 'row',
    backgroundColor: '#262A33',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 78,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.58)',
  },
  navLabelActive: { 
    color: '#A78BFA', 
    fontWeight: '700' 
  },
  footerContainer: {
    marginTop: 32,
    marginBottom: 10,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  footerName: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
});