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
  SunIcon,
  MoonIcon,
  InformationCircleIcon,
  CircleStackIcon
} from 'react-native-heroicons/outline';

//Bottom navigation bar
function BottomNavBar({ activeTab, onTabPress, darkMode }) {
  const tabs = [
    { key: 'weather', label: 'Weather', Icon: CloudIcon },
    { key: 'settings', label: 'Settings', Icon: CogIcon },
  ];
  return (
    <View style={[styles.navBar, !darkMode && styles.navBarLight]}>
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
              size={26} 
              color={isActive ? '#000' : '#000'} // Updated to black
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
        thumbColor="#000"
        ios_backgroundColor="rgba(255,255,255,0.3)"
        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
      />
      <Text style={[styles.tempLabel, unit === 'F' && styles.tempLabelActive]}>°F</Text>
    </View>
  );
}

//main
export default function SettingsLight({ navigation }) {
  const {
    unit, updateUnit,
    darkMode, updateDarkMode,
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
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (place?.city) {
        await updateSavedCity(place.city);
        Alert.alert('Location Updated', `Default city set to ${place.city}.`);
      } else {
        Alert.alert('Error', 'Could not determine city from your location.');
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
  };

  return (
    <ImageBackground
      source={require('../assets/images/light_mode.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

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
                  style={{ width: 22, height: 22, tintColor: '#000' }} 
                  resizeMode="contain" 
                />
              }
              label="Temperature Unit"
              right={<TempToggle unit={unit} onChange={updateUnit} />}
            />
          </View>

          {/*dark or light*/}
          <SectionHeader title="APPEARANCE" />
          <View style={styles.glassCard}>
            <View style={styles.glassCardShimmer} />
            <SettingsRow
              icon={darkMode ? <MoonIcon size={22} color="#000" /> : <SunIcon size={22} color="#000" />}
              label="Dark Mode"
              right={
                <Switch
                  value={darkMode}
                  onValueChange={updateDarkMode}
                  trackColor={{ false: 'rgba(255,255,255,0.25)', true: 'rgba(255,255,255,0.45)' }}
                  thumbColor="#000"
                  ios_backgroundColor="rgba(255,255,255,0.25)"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              }
            />
          </View>

          {/*location*/}
          <SectionHeader title="LOCATION" />
          <View style={styles.glassCard}>
            <View style={styles.glassCardShimmer} />
            <SettingsRow
              icon={<MapPinIcon size={22} color="#000" />}
              label={
                savedCity
                  ? `${savedCity} (current default)`
                  : 'Refresh My Location'
              }
              onPress={handleRefreshLocation}
              showArrow={!locationLoading}
              right={
                locationLoading
                  ? <ActivityIndicator size="small" color="#000" />
                  : null
              }
            />
          </View>

          {/*about*/}
          <SectionHeader title="ABOUT" />
          <View style={styles.glassCard}>
            <View style={styles.glassCardShimmer} />
            <SettingsRow
              icon={<InformationCircleIcon size={22} color="#000" />}
              label="Weather App"
              right={<Text style={styles.aboutValue}>v1.0.0</Text>}
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon={<CircleStackIcon size={22} color="#000" />}
              label="Data Source"
              right={<Text style={styles.aboutValue}>OpenWeatherMap</Text>}
            />
          </View>
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Made with ❤️ by <Text style={styles.footerName}>Imesh Shanaka</Text>
              </Text>
            </View>           
        </ScrollView>

        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} darkMode={darkMode} />
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
    color: '#000',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 28,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  sectionHeader: {
    color: '#000',
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
    color: '#000',
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
    color: '#000',
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
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  tempLabelActive: {
    color: '#000',
    fontWeight: '800',
  },

  aboutValue: {
    color: '#000',
    fontSize: 13,
    fontWeight: '500',
  },

  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  navBarLight: { 
    backgroundColor: 'rgba(255,255,255,0.92)' 
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
    color: '#000'
  },
  navLabelActive: { 
    color: '#000',
    fontWeight: '800'
  },
  footerContainer: {
    marginTop: 32,
    marginBottom: 10,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(13, 1, 1, 0.76)',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  footerName: {
    color: 'rgb(0, 0, 0)',
    fontWeight: '600',
  },
});