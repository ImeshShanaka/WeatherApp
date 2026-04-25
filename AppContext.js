import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const STORAGE_KEYS = {
  UNIT: '@weather_unit',
  DARK_MODE: '@weather_dark_mode',
  SAVED_CITY: '@weather_city',
};

export function AppProvider({ children }) {
  const [unit, setUnit] = useState('C');
  const [darkMode, setDarkMode] = useState(true);
  const [savedCity, setSavedCity] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // ── Load saved data ───────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedUnit, storedDark, storedCity] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.UNIT),
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_CITY),
        ]);

        if (storedUnit) setUnit(storedUnit);
        if (storedDark !== null) setDarkMode(storedDark === 'true');
        if (storedCity) setSavedCity(storedCity);
      } catch (e) {
        console.warn('Failed to load settings:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ── Update functions ──────────────────────────────
  const updateUnit = async (value) => {
    setUnit(value);
    await AsyncStorage.setItem(STORAGE_KEYS.UNIT, value);
  };

  const updateDarkMode = async (value) => {
    setDarkMode(value);
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(value));
  };

  const updateSavedCity = async (city) => {
    setSavedCity(city);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_CITY, city);
  };

  // ── 🔥 FIX: Safe + consistent conversions ─────────
  const displayTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return '--';

    const c = Number(tempC);

    if (unit === 'F') {
      return ((c * 9) / 5 + 32).toFixed(1);
    }

    return c.toFixed(1);
  };

  const displayTempRound = (tempC) => {
    if (tempC === undefined || tempC === null) return '--';

    const c = Number(tempC);

    if (unit === 'F') {
      return Math.round((c * 9) / 5 + 32);
    }

    return Math.round(c);
  };

  // ── 🔥 IMPORTANT: Memoized context (forces re-render) ──
  const value = useMemo(() => ({
    unit,
    updateUnit,

    darkMode,
    updateDarkMode,

    savedCity,
    updateSavedCity,

    displayTemp,
    displayTempRound,

    loaded,
  }), [unit, darkMode, savedCity, loaded]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}