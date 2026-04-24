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
  CalendarDaysIcon
} from 'react-native-heroicons/outline';
import { useAppContext } from '../AppContext';
import LottieView from 'lottie-react-native'; 


//API configure
const API_KEY = '7a023b13674a2843d2f77bbbf9c29895';

async function fetchCurrentWeather(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

async function fetchForecast(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error('Forecast not found');
  return res.json();
}

async function fetchCitySuggestions(query) {
  if (!query) return [];
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=3&appid=${API_KEY}`
    );
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

//Weather scens should be add more
function getWeatherEmoji(id) {
  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 400) return '🌦️';
  if (id >= 500 && id < 600) return '🌧️';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫️';
  if (id === 800) return '☀️';
  if (id > 800) return '⛅';
  return '🌡️';
}

function formatTime(unixTs, timezoneOffset) {
  const date = new Date((unixTs + timezoneOffset) * 1000);
  let h = date.getUTCHours();
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
}

function getDayName(dtTxt) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dtTxt).getDay()];
}

function groupByDay(list) {
  const map = {};
  list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];
    if (!map[date]) map[date] = [];
    map[date].push(item);
  });
  return Object.entries(map)
    .slice(0, 7)
    .map(([, items]) => {
      const mid = items[Math.floor(items.length / 2)];
      const date = items[0].dt_txt.split(' ')[0];
      const temps = items.map((i) => i.main.temp);
      return {
        day: getDayName(date),
        temp: mid.main.temp,
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        id: mid.weather[0].id,
      };
    });
}

//Search bar with suggestions
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
    const cityName = `${suggestion.name}, ${suggestion.country}`;
    onSearch(cityName); 
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
            <MagnifyingGlassIcon size={22} strokeWidth={2.5} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {isOpen && showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { width: maxWidth }]}>
          {suggestions.map((item, index) => {
            const isLast = index === suggestions.length - 1;
            const displayName = item.state 
              ? `${item.name}, ${item.state}, ${item.country}` 
              : `${item.name}, ${item.country}`;
              
            return (
              <TouchableOpacity
                key={`${item.lat}-${item.lon}-${index}`}
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
              color={isActive ? '#7C5CBF' : '#aaa'} 
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

//Glassmorephism for 7 days
function ForecastCard({ item, unit, displayTempRound }) {
  return (
    <View style={styles.glassCard}>
      <View style={styles.glassCardShimmer} />
      <Text style={styles.forecastDay}>{item.day}</Text>
      <Text style={styles.forecastEmoji}>{getWeatherEmoji(item.id)}</Text>
      <Text style={styles.tempHigh}>
        {displayTempRound(item.tempMax)}°<Text style={styles.unitInline}>{unit}</Text>
      </Text>
    </View>
  );
}

//Main
export default function ForecastScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('weather');
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);

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
      const [weather, forecastData] = await Promise.all([
        fetchCurrentWeather(city),
        fetchForecast(city),
      ]);
      setCurrent(weather);
      setForecast(groupByDay(forecastData.list));
    } catch (err) {
      Alert.alert('Not Found', `Could not find "${city}". Check the spelling and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (city) => {
    await updateSavedCity(city);
    loadWeather(city);
  };

  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'settings' && navigation) navigation.navigate('settings');
  };

  const emoji = current ? getWeatherEmoji(current.weather[0].id) : null;
  const sunrise = current ? formatTime(current.sys.sunrise, current.timezone) : null;
  const windKm = current ? (current.wind.speed * 3.6).toFixed(1) : null;

  return (
    <ImageBackground
      source={require('../assets/images/dark_mode.png')}
      style={[styles.bg, { width, height }]}
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
                <Text style={styles.cityLight}>, {current.sys.country}</Text>
              </View>

              {/* Big Weather Icon */}
              <View style={styles.iconWrapper}>
                <Text style={styles.bigIcon}>{emoji}</Text>
              </View>

              {/* Temperature */}
              <Text style={styles.tempText}>
                {displayTemp(current.main.temp)}°{unit}
              </Text>
              <Text style={styles.descText}>
                {current.weather[0].description
                  .split(' ')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Image 
                    source={require('../assets/icons/wind.png')} 
                    style={{ width: 22, height: 22, tintColor: '#fff' }} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.statValue}>{windKm} km/h</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Image 
                    source={require('../assets/icons/drop.png')} 
                    style={{ width: 22, height: 22, tintColor: '#fff' }} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.statValue}>{current.main.humidity}%</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Image 
                    source={require('../assets/icons/sun.png')} 
                    style={{ width: 22, height: 22, tintColor: '#fff' }} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.statValue}>{sunrise}</Text>
                </View>
              </View>

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

        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} darkMode={darkMode} />
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
    paddingTop: 8,
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
    marginTop: 12,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 24,
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
  navBarLight: { backgroundColor: 'rgba(255,255,255,0.92)' },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: { fontSize: 12, fontWeight: '500', color: '#aaa' },
  navLabelActive: { color: '#7C5CBF', fontWeight: '700' },
});