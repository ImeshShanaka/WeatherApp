import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudIcon, ClockIcon, CogIcon, MagnifyingGlassIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useAppContext } from '../AppContext';

//get suggestion results from API
async function fetchCitySuggestions(query) {
  if (!query) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=4`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
}

//7- day forecast details get from API
async function fetchForecast(query) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
  );
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');
  
  const city = geoData.results[0];

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
  );
  if (!weatherRes.ok) throw new Error('Forecast not found');
  const data = await weatherRes.json();

  const formattedList = data.hourly.time.map((timeStr, index) => {
    return {
      dt: new Date(timeStr).getTime() / 1000,
      main: {
        temp: data.hourly.temperature_2m[index],
        humidity: data.hourly.relative_humidity_2m[index],
      },
      wind: {
        speed: data.hourly.wind_speed_10m[index],
      },
      weather: [{
        wmoCode: data.hourly.weather_code[index],
      }],
    };
  });

  return {
    city: { name: city.name, country: city.country_code },
    list: formattedList,
  };
}

//Weather details to respresting Icons 
function getWeatherIcon(wmoCode, isNight) {
  if (wmoCode === 0) return isNight ? require('../assets/weather/moon.png') : require('../assets/weather/sun.png');
  if (wmoCode >= 1 && wmoCode <= 3) return isNight ? require('../assets/weather/night_cloud.png') : require('../assets/weather/cloud.png');
  if (wmoCode >= 45 && wmoCode <= 48) return require('../assets/weather/cloud.png'); // Fog
  if (wmoCode >= 51 && wmoCode <= 57) return require('../assets/weather/drizzle.png');
  if (wmoCode >= 61 && wmoCode <= 67) return isNight ? require('../assets/weather/night_rain.png') : require('../assets/weather/rain.png');
  if (wmoCode >= 71 && wmoCode <= 77) return require('../assets/weather/snow.png');
  if (wmoCode >= 80 && wmoCode <= 82) return isNight ? require('../assets/weather/night_heavy.png') : require('../assets/weather/heavy_rain.png');
  if (wmoCode >= 95 && wmoCode <= 99) return isNight ? require('../assets/weather/night_thunderstrom.png') : require('../assets/weather/thunderstorm.png');
  return require('../assets/weather/thermometer.png');
}

function toWindKm(speed) {
  return `${Math.round(speed)} km/h`;
}

function dayShort(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
}

function dayDate(timestamp) {
  return new Date(timestamp).getDate().toString();
}

function getLocalDayKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function CustomWindIcon({ size, color }) {
  return (
    <Image 
      source={require('../assets/icons/wind.png')} 
      style={{ width: size, height: size, tintColor: color }} 
      resizeMode="contain" 
    />
  );
}

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
          <TouchableOpacity key={tab.key} style={styles.navItem} onPress={() => onTabPress(tab.key)} activeOpacity={0.8}>
            <tab.Icon size={22} color={isActive ? '#A78BFA' : 'rgba(255,255,255,0.58)'} strokeWidth={isActive ? 2.5 : 2} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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
    const cityName = suggestion.name;
    onSearch(cityName);
    closeSearch();
  };

  const handleSubmit = () => {
    if (!city.trim()) return;
    const cleanCity = city.split(',')[0].trim();
    onSearch(cleanCity);
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
              onFocus={() => {
                if (city.length > 1) setShowSuggestions(true);
              }}
            />
            <TouchableOpacity onPress={closeSearch} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XMarkIcon size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={isOpen ? handleSubmit : openSearch} style={isOpen ? styles.searchIconBtnOpen : styles.searchIconBtnClosed}>
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
            const displayName = item.admin1 ? `${item.name}, ${item.admin1}, ${item.country_code}` : `${item.name}, ${item.country_code}`;
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

export default function HourlyScreen({ navigation }) {
  const { savedCity, loaded, displayTempRound, unit } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [cityTitle, setCityTitle] = useState('Colombo, LK');
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [hourlyByDay, setHourlyByDay] = useState({});
  const [forecastList, setForecastList] = useState([]);

  useEffect(() => {
    if (loaded) {
      const safeCity = savedCity ? savedCity.split(',')[0].trim() : 'Colombo';
      loadHourly(safeCity);
    }
  }, [loaded, savedCity]);

  const loadHourly = async (city) => {
    try {
      setLoading(true);
      const data = await fetchForecast(city);
      setCityTitle(`${data.city.name}, ${data.city.country}`);

      const grouped = {};
      data.list.forEach((item) => {
        const localDate = new Date(item.dt * 1000);
        const dayKey = getLocalDayKey(localDate);
        
        if (!grouped[dayKey]) grouped[dayKey] = [];
        grouped[dayKey].push(item);
      });

      const phoneTodayObj = new Date();
      const phoneTodayKey = getLocalDayKey(phoneTodayObj);
      const availableKeys = Object.keys(grouped);
      const seqKeys = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(phoneTodayObj.getDate() + i);
        const key = getLocalDayKey(d);
        
        if (availableKeys.includes(key) || i === 0) {
          seqKeys.push(key);
        }
      }

      setDays(seqKeys);
      setSelectedDay(phoneTodayKey);
      setHourlyByDay(grouped);
      setForecastList(data.list);
    } catch (error) {
      // fallback keep previous data
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (key) => {
    if (key === 'weather') navigation.navigate('ForecastScreen');
    if (key === 'air') navigation.navigate('AirQualityScreen');
    if (key === 'settings') navigation.navigate('settings');
  };

  const rows = useMemo(() => {
    if (!selectedDay || !forecastList.length) return [];

    const todayKey = getLocalDayKey(new Date());
    const isTodayTab = selectedDay === todayKey;
    const now = new Date();
    const startHour = isTodayTab ? now.getHours() : 0;
    const targetHours = Array.from({ length: 24 - startHour }, (_, idx) => idx + startHour);

    const [sYear, sMonth, sDay] = selectedDay.split('-');

    return targetHours.map((hour, index) => {
      const targetDateObj = new Date(sYear, sMonth - 1, sDay, hour, 0, 0);

      const nearest = forecastList.reduce((best, current) => {
        const bestDiff = Math.abs((best.dt * 1000) - targetDateObj.getTime());
        const currentDiff = Math.abs((current.dt * 1000) - targetDateObj.getTime());
        return currentDiff < bestDiff ? current : best;
      }, forecastList[0]);

      const h12 = hour % 12 || 12;
      const ampm = hour >= 12 ? 'PM' : 'AM';

      return {
        source: nearest,
        hourText: `${h12}.00 ${ampm}`,
        isNow: isTodayTab && index === 0,
        rawHour: hour, 
      };
    });
  }, [selectedDay, forecastList]);

  const dayTabs = useMemo(
    () => {
      const todayKey = getLocalDayKey(new Date());
      
      return days.map((dayKey) => {
        const [year, month, day] = dayKey.split('-');
        const dateObj = new Date(year, month - 1, day);
        
        return {
          key: dayKey,
          label: dayKey === todayKey ? 'Today' : dayShort(dateObj.getTime()),
          date: dayDate(dateObj.getTime()),
        };
      });
    },
    [days]
  );

  return (
    <ImageBackground source={require('../assets/images/dark_mode.png')} style={styles.bg} resizeMode="cover">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topContentWrapper}>
          <View style={styles.topRow}>
            <SearchBar onSearch={loadHourly} loading={loading} />
          </View>

          <View style={styles.cityHeader}>
            <Text style={styles.cityLabel}>{cityTitle}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
            {dayTabs.map((dayItem) => {
              const active = dayItem.key === selectedDay;
              return (
                <TouchableOpacity
                  key={dayItem.key}
                  style={[styles.dayTab, active && styles.dayTabActive]}
                  onPress={() => setSelectedDay(dayItem.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayName, active && styles.dayNameActive]}>{dayItem.label}</Text>
                  <Text style={[styles.dayDate, active && styles.dayDateActive]}>{dayItem.date}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listCard}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContentContainer}
          >
            {loading && rows.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#6B7BE0" />
              </View>
            ) : (
              rows.map((item, index) => {
                const weatherCode = item.source.weather[0].wmoCode;
                
                const isNight = item.rawHour >= 19 || item.rawHour < 6;
                const icon = getWeatherIcon(weatherCode, isNight);

                return (
                  <View key={`${item.source.dt}-${index}`}>
                    <View style={styles.row}>
                      <View style={styles.timeCol}>
                        {item.isNow && <Text style={styles.nowText}>NOW</Text>}
                        <Text style={styles.timeText}>{item.hourText}</Text>
                      </View>

                      <Image source={icon} style={styles.rowIcon} resizeMode="contain" />

                      <Text style={styles.tempText}>{displayTempRound(item.source.main.temp)}°{unit}</Text>

                      <View style={styles.metaCol}>
                        <View style={styles.metaItem}>
                          <Image source={require('../assets/icons/wind.png')} style={styles.metaIcon} resizeMode="contain" />
                          <Text style={styles.metaText}>{toWindKm(item.source.wind.speed)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Image source={require('../assets/icons/drop.png')} style={styles.metaIcon} resizeMode="contain" />
                          <Text style={styles.metaText}>{item.source.main.humidity}%</Text>
                        </View>
                      </View>
                    </View>
                    {index !== rows.length - 1 && <View style={styles.rowDivider} />}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>

        <BottomNavBar activeTab="hourly" onTabPress={handleTabPress} />
      </SafeAreaView>
    </ImageBackground>
  );
}

//Styling
const styles = StyleSheet.create({
  bg: { flex: 1 },
  safeArea: { flex: 1 },
  
  topContentWrapper: {
    marginTop: 25, 
  },
  
  topRow: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 10, zIndex: 10 },
  cityHeader: {
    paddingHorizontal: 20,
    marginBottom: 12, 
  },
  cityLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 17,
    fontWeight: '600',
  },
  dayTabs: {
    paddingHorizontal: 20,
    paddingBottom: 12, 
    gap: 8, 
  },
  dayTab: {
    width: 52,
    height: 58,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayTabActive: {
    backgroundColor: 'rgba(255,255,255,0.96)', 
  },
  dayName: {
    color: 'rgba(40,40,40,0.62)',
    fontSize: 10,
    fontWeight: '600',
  },
  dayDate: {
    color: '#30343C',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
    lineHeight: 18,
  },
  dayNameActive: { color: '#30343C' }, 
  dayDateActive: { color: '#2C2D31' }, 
  
  listCard: {
    flex: 1, 
    marginHorizontal: 14,
    marginBottom: 16, 
    borderRadius: 24,
    backgroundColor: '#26124A', 
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 178, 214, 0.45)',
    overflow: 'hidden', 
  },
  
  scrollContentContainer: {
    flexGrow: 1, 
    paddingVertical: 10,
    paddingBottom: 20, 
  },

  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 4,
  },
  rowDivider: {
    height: 1,
    width: '90%', 
    backgroundColor: 'rgba(148, 178, 214, 0.3)', 
    alignSelf: 'center',
  },
  timeCol: {
    width: 76,
  },
  nowText: {
    color: '#1C8CF2',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  timeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  rowIcon: {
    width: 34,
    height: 34,
    marginHorizontal: 4,
  },
  tempText: {
    color: '#fff', 
    fontSize: 30,
    fontWeight: '600',
    width: 76,
    textAlign: 'left',
  },
  metaCol: {
    width: 84,
    alignItems: 'flex-end',
    gap: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    width: 12,
    height: 12,
    tintColor: 'rgba(255,255,255,0.6)', 
  },
  metaText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
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
  navLabel: { marginTop: 4, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.58)' },
  navLabelActive: { color: '#A78BFA', fontWeight: '700' },

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
});