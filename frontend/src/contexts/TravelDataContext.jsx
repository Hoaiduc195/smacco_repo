import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { normalizeFirestoreError } from '../services/firestoreError';
import {
  subscribeOwnedPlaces,
  saveOwnedPlace as saveOwnedPlaceDoc,
  removeOwnedPlace as removeOwnedPlaceDoc,
} from '../services/ownedPlaceService';
import {
  subscribeCheckIns,
  saveCheckIn as saveCheckInDoc,
  removeCheckIn as removeCheckInDoc,
} from '../services/checkInService';
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
  const [ownedPlaces, setOwnedPlaces] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setOwnedPlaces([]);
      setCheckIns([]);
      return;
    }

    setLoading(true);
    setError('');

    upsertUserProfile(currentUser).catch((err) => {
      console.error('Không thể cập nhật hồ sơ người dùng', err);
    });

    const unsubOwnedPlaces = subscribeOwnedPlaces(
      currentUser.uid,
      (nextOwnedPlaces) => {
        setOwnedPlaces(nextOwnedPlaces);
        // Only stop loading if both subs are done or just one? Let's keep it simple.
        setLoading(false);
      },
      (err) => {
        setError(normalizeFirestoreError(err, 'Không thể tải địa điểm đã lưu.'));
        setLoading(false);
      }
    );

    const unsubCheckIns = subscribeCheckIns(
      currentUser.uid,
      (nextCheckIns) => {
        setCheckIns(nextCheckIns);
      },
      (err) => {
        console.error('Error subscribing to check-ins:', err);
      }
    );

    return () => {
      unsubOwnedPlaces?.();
      unsubCheckIns?.();
    };
  }, [currentUser]);

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

  const saveCheckIn = async (place) => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập để check-in.');
      return null;
    }

    try {
      setError('');
      return await saveCheckInDoc(currentUser.uid, place);
    } catch (err) {
      setError(normalizeFirestoreError(err, 'Không thể thực hiện check-in.'));
      throw err;
    }
  };

  const removeCheckIn = async (checkInId) => {
    try {
      setError('');
      await removeCheckInDoc(checkInId);
    } catch (err) {
      setError(normalizeFirestoreError(err, 'Không thể xóa check-in.'));
      throw err;
    }
  };

  const value = {
    loading,
    error,
    ownedPlaces,
    checkIns,
    saveOwnedPlace,
    removeOwnedPlace,
    saveCheckIn,
    removeCheckIn,
  };

  return <TravelDataContext.Provider value={value}>{children}</TravelDataContext.Provider>;
}
