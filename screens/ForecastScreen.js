import React, { useState, useRef, useEffect } from 'react';
import {
  ImageBackground,
  Image,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  TextInput,
  Animated,
  Keyboard,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  CloudIcon, 
  CogIcon,
  SunIcon,
  ClockIcon,
  CalendarDaysIcon
} from 'react-native-heroicons/outline';
import { useAppContext } from '../AppContext';
import { BlurView } from 'expo-blur';

//Fetch suggestions using Open-Meteo's Geocoding API
async function fetchCitySuggestions(query) {
  if (!query) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=3`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
}

//Current day weather details and 7 days
async function fetchWeatherData(query) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
  );
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');
  
  const city = geoData.results[0];

  //Fetch Weather (Current + Daily)
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise&timezone=auto`
  );
  
  if (!weatherRes.ok) throw new Error('Weather data not found');
  const data = await weatherRes.json();

  return {
    current: {
      name: city.name,
      country: city.country_code,
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day,
      sunrise: data.daily.sunrise[0],
    },
    daily: data.daily.time.map((_, index) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + index);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      return {
        day: index === 0 ? 'Today' : days[targetDate.getDay()],
        tempMax: data.daily.temperature_2m_max[index],
        weatherCode: data.daily.weather_code[index],
      };
    })
  };
}

function getWeatherEmoji(wmoCode, isNight) {
  if (wmoCode === 0) return isNight ? require('../assets/weather/moon.png') : require('../assets/weather/sun.png');
  if (wmoCode >= 1 && wmoCode <= 3) return isNight ? require('../assets/weather/night_cloud.png') : require('../assets/weather/cloud.png');
  if (wmoCode >= 45 && wmoCode <= 48) return require('../assets/weather/cloud.png');
  if (wmoCode >= 51 && wmoCode <= 57) return require('../assets/weather/drizzle.png');
  if (wmoCode >= 61 && wmoCode <= 67) return isNight ? require('../assets/weather/night_rain.png') : require('../assets/weather/rain.png');
  if (wmoCode >= 71 && wmoCode <= 77) return require('../assets/weather/snow.png');
  if (wmoCode >= 80 && wmoCode <= 82) return isNight ? require('../assets/weather/night_heavy.png') : require('../assets/weather/heavy_rain.png');
  if (wmoCode >= 95 && wmoCode <= 99) return isNight ? require('../assets/weather/night_thunderstrom.png') : require('../assets/weather/thunderstorm.png');
  return require('../assets/weather/thermometer.png');
}

function formatSunrise(isoString) {
  const date = new Date(isoString);
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

//Search bar
function SearchBar({ onSearch, loading }) {
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = windowWidth - 36; 
  const minWidth = 44; 

  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef(null);
  const widthAnim = useRef(new Animated.Value(minWidth)).current;
  const typingTimeoutRef = useRef(null);

  const openSearch = () => {
    setIsOpen(true);
    Animated.timing(widthAnim, {
      toValue: maxWidth,
      duration: 300,
      useNativeDriver: false,
    }).start(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    Animated.timing(widthAnim, {
      toValue: minWidth,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setIsOpen(false);
      setCity('');
      setSuggestions([]);
    });
  };

  const handleTextChange = (text) => {
    setCity(text);
    if (text.trim().length > 1) {
      setShowSuggestions(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(async () => {
        const results = await fetchCitySuggestions(text);
        setSuggestions(results);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    onSearch(suggestion.name); 
    closeSearch();      
  };

  const handleSubmit = () => {
    if (!city.trim()) return;
    onSearch(city.trim()); 
    closeSearch();          
  };

  return (
    <View style={styles.searchContainer}>
      <Animated.View style={[styles.searchWrapper, { width: widthAnim }]}>
        {isOpen && (
          <>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search city"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={city}
              onChangeText={handleTextChange}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoCorrect={false}
              onFocus={() => { if (city.length > 1) setShowSuggestions(true); }}
            />
            <TouchableOpacity onPress={closeSearch} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XMarkIcon size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity 
          onPress={isOpen ? handleSubmit : openSearch} 
          style={isOpen ? styles.searchIconBtnOpen : styles.searchIconBtnClosed}
        >
          {loading && isOpen ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MagnifyingGlassIcon size={25} strokeWidth={2.5} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {isOpen && showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { width: maxWidth }]}>
          {suggestions.map((item, index) => {
            const isLast = index === suggestions.length - 1;
            const displayName = item.admin1 
              ? `${item.name}, ${item.admin1}, ${item.country_code}` 
              : `${item.name}, ${item.country_code}`;
              
            return (
              <TouchableOpacity
                key={`${item.id}-${index}`}
                style={[styles.suggestionItem, isLast && styles.suggestionItemLast]}
                onPress={() => handleSuggestionPress(item)}
              >
                <Text style={styles.suggestionText}>{displayName}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

//Wind icon get from assest folder because npm library has not wind icon
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

//7 days
function ForecastCard({ item, unit, displayTempRound }) {
  const visual = getWeatherEmoji(item.weatherCode, false);
  return (
    <View style={styles.glassCard}>
      <View style={styles.glassCardShimmer} />
      <Text style={styles.forecastDay}>{item.day}</Text>
      
      <Image source={visual} style={styles.cloudIconSmall} resizeMode="contain" />

      <Text style={styles.tempHigh}>
        {displayTempRound(item.tempMax)}°<Text style={styles.unitInline}>{unit}</Text>
      </Text>
    </View>
  );
}

//Main
export default function ForecastScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('weather');
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { unit, displayTemp, displayTempRound, savedCity, updateSavedCity, darkMode, loaded } =
    useAppContext();

  useEffect(() => {
    if (loaded && savedCity) {
      loadWeather(savedCity);
    }
  }, [loaded]);

  const loadWeather = async (city) => {
    setLoading(true);
    try {
      const data = await fetchWeatherData(city);
      setCurrent(data.current);
      setForecast(data.daily);
      updateSavedCity(data.current.name);
    } catch (err) {
      Alert.alert('Not Found', `Could not find "${city}". Check the spelling and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (city) => {
    loadWeather(city);
  };

  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'hourly' && navigation) navigation.navigate('HourlyScreen');
    if (key === 'air' && navigation) navigation.navigate('AirQualityScreen');
    if (key === 'settings' && navigation) navigation.navigate('settings'); 
  };

  const visual = current ? getWeatherEmoji(current.weatherCode, !current.isDay) : null;
  const sunriseTime = current ? formatSunrise(current.sunrise) : null;

  return (
    <ImageBackground
      source={require('../assets/images/dark_mode.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      {!darkMode && <View style={styles.lightOverlay} />}

      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled" 
        >
          {loading && !current ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Fetching weather…</Text>
            </View>
          ) : current ? (
            <>
              {/* City Name */}
              <View style={styles.cityRow}>
                <Text style={styles.cityBold}>{current.name}</Text>
                <Text style={styles.cityLight}>, {current.country}</Text>
              </View>

              {/* main icons*/}
              <View style={styles.iconWrapper}>
                <Image source={visual} style={styles.cloudIconBig} resizeMode="contain" />
              </View>

              {/* Temperature */}
              <Text style={styles.tempText}>
                {displayTemp(current.temp)}°{unit}
              </Text>
              
              <Text style={styles.descText}>
                {current.isDay ? "Clear Skies" : "Clear Night"}
              </Text>

              <BlurView intensity={30} tint="default" style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Image 
                    source={require('../assets/icons/wind.png')} 
                    style={{ width: 22, height: 22, tintColor: '#fff' }} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.statValue}>{current.windSpeed} km/h</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Image 
                    source={require('../assets/icons/drop.png')} 
                    style={{ width: 22, height: 22, tintColor: '#fff' }} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.statValue}>{current.humidity}%</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Image 
                    source={require('../assets/icons/sun.png')} 
                    style={{ width: 22, height: 22, tintColor: '#fff' }} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.statValue}>{sunriseTime}</Text>
                </View>
              </BlurView>

              {/*7 days forecast*/}
              <View style={styles.forecastSection}>
                <View style={styles.forecastHeader}>
                  <CalendarDaysIcon size={20} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.forecastTitle}>7-Day Forecast</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.forecastScroll}
                >
                  {forecast.map((item, index) => (
                    <ForecastCard
                      key={index}
                      item={item}
                      unit={unit}
                      displayTempRound={displayTempRound}
                    />
                  ))}
                </ScrollView>
              </View>
            </>
          ) : (
            <View style={styles.centered}>
              <SunIcon size={80} color="rgba(255,255,255,0.55)" style={{ marginBottom: 16 }} />
              <Text style={styles.placeholderText}>Search a city to{'\n'}check the weather</Text>
            </View>
          )}
        </ScrollView>

        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    </ImageBackground>
  );
}

//Styling
const styles = StyleSheet.create({
  bg: { flex: 1 },
  lightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topRow: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 4,
    zIndex: 10,
  },
  
  //Search bar
  searchContainer: {
    width: '100%',
    alignItems: 'flex-end',
    position: 'relative',
    zIndex: 10,
  },
  
  searchWrapper: {
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(136, 71, 188, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingLeft: 20,
    minWidth: 100, 
  },
  closeBtn: {
    paddingHorizontal: 12,
  },
  
  searchIconBtnOpen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(136, 71, 188, 0.14)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  searchIconBtnClosed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(136, 71, 188, 0.14)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#2A2735', 
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  scroll: { flexGrow: 1, paddingBottom: 12, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  placeholderText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
  },
  loadingText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 12 },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 7,
    marginBottom: 4,
  },
  cityBold: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  cityLight: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 18,
    fontWeight: '400',
    marginBottom: 1,
  },
  iconWrapper: { alignItems: 'center', marginVertical: 10 },
  bigIcon: { fontSize: 120, lineHeight: 130 },
  cloudIconBig: { width: 160, height: 140, marginTop: 7 }, 
  tempText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: '310',
    textAlign: 'center',
    letterSpacing: -3,
    lineHeight: 78,
  },
  descText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: { color: '#fff', fontSize: 13, fontWeight: '500' },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },

  //Forecast
  forecastSection: {
    backgroundColor: 'transparent',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  forecastTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  forecastScroll: { gap: 10, paddingRight: 4 },

  //7 days
  glassCard: {
    width: 80,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
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
    gap: 6,
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
  forecastDay: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  forecastEmoji: { fontSize: 30 },
  cloudIconSmall: { width: 35, height: 35, marginVertical: 2 }, 
  tempHigh: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  unitInline: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '400',
  },

  //Navigation bar
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
  navLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.58)' },
  navLabelActive: { color: '#A78BFA', fontWeight: '700' },
});