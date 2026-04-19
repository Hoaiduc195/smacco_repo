import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const CHECKIN_COLLECTION = 'check_ins';

const mapCheckIn = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
  };
};

export function subscribeCheckIns(userId, onData, onError) {
  const ref = collection(db, CHECKIN_COLLECTION);
  const q = query(ref, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      onData?.(snapshot.docs.map(mapCheckIn));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function saveCheckIn(userId, place) {
  const ref = collection(db, CHECKIN_COLLECTION);
  const existingQuery = query(
    ref,
    where('userId', '==', userId),
    where('placeId', '==', place.id)
  );
  const existing = await getDocs(existingQuery);

  if (!existing.empty) {
    return existing.docs[0];
  }

  return addDoc(ref, {
    userId,
    placeId: place.id,
    name: place.name,
    address: place.address || null,
    lat: Number(place.lat),
    lng: Number(place.lng),
    type: place.type || 'place',
    rating: place.rating ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function removeCheckIn(checkInId) {
  const docRef = doc(db, CHECKIN_COLLECTION, checkInId);
  return deleteDoc(docRef);
}
