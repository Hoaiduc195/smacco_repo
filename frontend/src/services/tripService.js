import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const TRIPS_COLLECTION = 'trips';

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
};

const mapTripDoc = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
  };
};

export function subscribeTrips(userId, onData, onError) {
  const tripRef = collection(db, TRIPS_COLLECTION);
  const tripQuery = query(tripRef, where('userId', '==', userId));

  return onSnapshot(
    tripQuery,
    (snapshot) => {
      const trips = snapshot.docs
        .map(mapTripDoc)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData?.(trips);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function createTrip(userId, payload) {
  const tripRef = collection(db, TRIPS_COLLECTION);
  const destination = payload?.destination || null;

  return addDoc(tripRef, {
    userId,
    name: payload?.name || destination?.name || 'Chuyen di moi',
    destination,
    accommodation: payload?.accommodation || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTrip(tripId, patch) {
  const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
  return updateDoc(tripDocRef, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
