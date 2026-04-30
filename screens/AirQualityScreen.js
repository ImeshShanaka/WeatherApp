import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { CloudIcon, ClockIcon, CogIcon, MapPinIcon, ShieldCheckIcon } from 'react-native-heroicons/outline';
import { useAppContext } from '../AppContext';

const PAD = 20;

//Get Weather Details
async function fetchCoordinates(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  if (!res.ok) throw new Error('Location not found');
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error('Location not found');
  return data.results[0];
}

//Get Air Quality Details
async function fetchAirQuality(lat, lon) {
  const res = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`
  );
  if (!res.ok) throw new Error('Air quality unavailable');
  return res.json();
}

const labelByAqi = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
const scoreByAqi = { 1: 28, 2: 52, 3: 96, 4: 144, 5: 190 };

function CustomWindIcon({ size, color }) {
  return (
    <Image 
      source={require('../assets/icons/wind.png')} 
      style={{ width: size, height: size, tintColor: color }} 
      resizeMode="contain" 
    />
  );
}

//Navigation Bar
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
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={styles.navItem} onPress={() => onTabPress(tab.key)} activeOpacity={0.8}>
            <tab.Icon size={22} color={active ? '#A78BFA' : 'rgba(255,255,255,0.58)'} strokeWidth={active ? 2.5 : 2} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// GAUGE COMPONENT
function Gauge({ score }) {
  const size = 160; 
  const stroke = 10; 
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(score / 200, 1));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="transparent" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#6EE7B7"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="transparent"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - progress)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export default function AirQualityScreen({ navigation }) {
  const { savedCity, loaded } = useAppContext();
  const [placeName, setPlaceName] = useState('Colombo, Sri Lanka');
  const [airData, setAirData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAir = async (q) => {
    if (!q?.trim()) return;
    setLoading(true);
    try {
      const location = await fetchCoordinates(q.trim());
      const data = await fetchAirQuality(location.latitude, location.longitude);
      setPlaceName(`${location.name}, ${location.country_code}`);
      
      //Get Air Quality as Numbers
      const rawAqi = data.current.european_aqi;
      let mappedAqi = 1;
      if (rawAqi > 80) mappedAqi = 5;
      else if (rawAqi > 60) mappedAqi = 4;
      else if (rawAqi > 40) mappedAqi = 3;
      else if (rawAqi > 20) mappedAqi = 2;

      setAirData({
        main: { aqi: mappedAqi },
        components: {
          pm2_5: data.current.pm2_5,
          pm10: data.current.pm10,
          o3: data.current.ozone,
          no2: data.current.nitrogen_dioxide,
          so2: data.current.sulphur_dioxide,
          co: data.current.carbon_monoxide / 1000,
        }
      });
    } catch (e) {
      Alert.alert('Not Found', `Could not fetch air quality for "${q}".`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentLocationAir = () => {
      if (loaded && savedCity) {
        loadAir(savedCity);
      } else if (loaded) {
        loadAir('Colombo');
      }
    };
    fetchCurrentLocationAir();
    const intervalId = setInterval(fetchCurrentLocationAir, 120000);
    return () => clearInterval(intervalId);
  }, [loaded, savedCity]);

  const onTab = (key) => {
    if (key === 'weather') navigation.navigate('ForecastScreen');
    if (key === 'hourly') navigation.navigate('HourlyScreen');
    if (key === 'settings') navigation.navigate('settings');
  };

  const aqi = airData?.main?.aqi ?? 2;
  const score = scoreByAqi[aqi] ?? 0;
  const label = labelByAqi[aqi] ?? 'Unknown';
  const c = airData?.components ?? { pm2_5: 0, pm10: 0, o3: 0, no2: 0, so2: 0, co: 0 };
  const currentTime = useMemo(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), []);

  return (
    <ImageBackground source={require('../assets/images/dark_mode.png')} style={styles.bg} resizeMode="cover">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Air Quality</Text>
            <View style={styles.locRow}>
              <MapPinIcon size={14} color="#A78BFA" />
              <Text style={styles.locText}>{loading ? 'Updating...' : placeName}</Text>
            </View>
            <Text style={styles.timeText}>Today, {currentTime}</Text>
          </View>

          <View style={styles.gaugeContainer}>
            <Gauge score={score} />
            <View style={styles.gaugeTextWrap}>
              <Text style={styles.score}>{score}</Text>
              <Text style={styles.scoreLabel}>{label}</Text>
            </View>
          </View>

          <View style={styles.badge}>
            <ShieldCheckIcon size={14} color="#A3E635" />
            <Text style={styles.badgeText}>Air quality is {label.toLowerCase()}.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Current air quality is considered {label.toLowerCase()} for most outdoor activities. Always monitor your local conditions.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pollutant Details</Text>
            <Text style={styles.unitText}>µg/m³</Text>
          </View>
          
          <View style={styles.grid}>
            <View style={styles.tile}><Text style={styles.tLabel}>PM2.5</Text><Text style={styles.tValue}>{Math.round(c.pm2_5)}</Text></View>
            <View style={styles.tile}><Text style={styles.tLabel}>PM10</Text><Text style={styles.tValue}>{Math.round(c.pm10)}</Text></View>
            <View style={styles.tile}><Text style={styles.tLabel}>O₂</Text><Text style={styles.tValue}>{Math.round(c.o3)}</Text></View>
            <View style={styles.tile}><Text style={styles.tLabel}>NO₂</Text><Text style={styles.tValue}>{Math.round(c.no2)}</Text></View>
            <View style={styles.tile}><Text style={styles.tLabel}>SO₂</Text><Text style={styles.tValue}>{Math.round(c.so2)}</Text></View>
            <View style={styles.tile}><Text style={styles.tLabel}>CO₂</Text><Text style={styles.tValue}>{c.co.toFixed(1)}</Text></View>
          </View>
          
        </ScrollView>
        <BottomNavBar activeTab="air" onTabPress={onTab} />
      </SafeAreaView>
    </ImageBackground>
  );
}

//Styling
const styles = StyleSheet.create({
  bg: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: PAD, paddingTop: 35, paddingBottom: 15, justifyContent: 'space-between' },
  header: { marginBottom: 5 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: 0.5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locText: { color: 'rgba(255,255,255,0.95)', fontSize: 16, fontWeight: '500' },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  gaugeContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 8, position: 'relative' },
  gaugeTextWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score: { color: '#6EE7B7', fontSize: 48, fontWeight: '300', includeFontPadding: false },
  scoreLabel: { color: '#FCD34D', fontSize: 18, fontWeight: '600', marginTop: -2 },
  badge: { alignSelf: 'center', marginTop: 0, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  card: { marginTop: 12, borderRadius: 12, padding: 12, backgroundColor: 'rgba(16,22,55,0.5)', borderWidth: 1, borderColor: 'rgba(116,136,255,0.15)' },
  cardText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  unitText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500', paddingBottom: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  tile: { width: '31%', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: 'rgba(16,22,55,0.5)', borderWidth: 1, borderColor: 'rgba(116,136,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  tLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 2, fontWeight: '500' },
  tValue: { color: '#fff', fontSize: 20, fontWeight: '600' },
  navBar: { flexDirection: 'row', backgroundColor: '#262A33', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: 78, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 18, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 20 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  navLabel: { marginTop: 4, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.58)' },
  navLabelActive: { color: '#A78BFA', fontWeight: '700' },
});