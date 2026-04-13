import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { normalizeFirestoreError } from '../services/firestoreError';
import {
  subscribeTrips,
  createTrip as createTripDoc,
  updateTrip,
} from '../services/tripService';
import {
  subscribeOwnedPlaces,
  saveOwnedPlace as saveOwnedPlaceDoc,
  removeOwnedPlace as removeOwnedPlaceDoc,
} from '../services/ownedPlaceService';
import { upsertUserProfile } from '../services/userProfileService';

const TravelDataContext = createContext(null);

export function useTravelData() {
  const context = useContext(TravelDataContext);
  if (!context) {
    throw new Error('useTravelData phải được dùng bên trong TravelDataProvider');
  }
  return context;
}

export function TravelDataProvider({ children }) {
  const { currentUser } = useAuth();
  const [trips, setTrips] = useState([]);
  const [ownedPlaces, setOwnedPlaces] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setTrips([]);
      setOwnedPlaces([]);
      setActiveTripId(null);
      return;
    }

    setLoading(true);
    setError('');

    upsertUserProfile(currentUser).catch((err) => {
      console.error('Không thể cập nhật hồ sơ người dùng', err);
    });

    const unsubTrips = subscribeTrips(
      currentUser.uid,
      (nextTrips) => {
        setTrips(nextTrips);
        setLoading(false);
      },
      (err) => {
        setError(normalizeFirestoreError(err, 'Không thể tải danh sách chuyến đi.'));
        setLoading(false);
      }
    );

    const unsubOwnedPlaces = subscribeOwnedPlaces(
      currentUser.uid,
      (nextOwnedPlaces) => {
        setOwnedPlaces(nextOwnedPlaces);
      },
      (err) => {
        setError(normalizeFirestoreError(err, 'Không thể tải địa điểm đã lưu.'));
      }
    );

    return () => {
      unsubTrips?.();
      unsubOwnedPlaces?.();
    };
  }, [currentUser]);

  const activeTrip = useMemo(
    () => trips.find((trip) => trip.id === activeTripId) || null,
    [activeTripId, trips]
  );

  const createTrip = async ({ name, destination }) => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập để tạo chuyến đi.');
      return null;
    }

    try {
      setError('');
      const result = await createTripDoc(currentUser.uid, { name, destination });
      setActiveTripId(result.id);
      return result;
    } catch (err) {
      setError(normalizeFirestoreError(err, 'Không thể tạo chuyến đi.'));
      throw err;
    }
  };

  const assignAccommodation = async (tripId, accommodation) => {
    try {
      setError('');
      await updateTrip(tripId, { accommodation });
    } catch (err) {
      setError(normalizeFirestoreError(err, 'Không thể cập nhật nơi ở.'));
      throw err;
    }
  };

  const saveOwnedPlace = async (place) => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập để lưu địa điểm.');
      return null;
    }

    try {
      setError('');
      return await saveOwnedPlaceDoc(currentUser.uid, place);
    } catch (err) {
      setError(normalizeFirestoreError(err, 'Không thể lưu địa điểm.'));
      throw err;
    }
  };

  const removeOwnedPlace = async (ownedPlaceId) => {
    try {
      setError('');
      await removeOwnedPlaceDoc(ownedPlaceId);
    } catch (err) {
      setError(normalizeFirestoreError(err, 'Không thể xóa địa điểm đã lưu.'));
      throw err;
    }
  };

  const value = {
    loading,
    error,
    trips,
    activeTrip,
    activeTripId,
    setActiveTripId,
    ownedPlaces,
    createTrip,
    assignAccommodation,
    saveOwnedPlace,
    removeOwnedPlace,
  };

  return <TravelDataContext.Provider value={value}>{children}</TravelDataContext.Provider>;
}
