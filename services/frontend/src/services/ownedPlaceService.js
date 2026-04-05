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

const OWNED_PLACE_COLLECTION = 'owned_places';

const mapOwnedPlace = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
  };
};

export function subscribeOwnedPlaces(userId, onData, onError) {
  const placeRef = collection(db, OWNED_PLACE_COLLECTION);
  const placeQuery = query(placeRef, where('ownerId', '==', userId));

  return onSnapshot(
    placeQuery,
    (snapshot) => {
      onData?.(snapshot.docs.map(mapOwnedPlace));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function saveOwnedPlace(userId, place) {
  const placeRef = collection(db, OWNED_PLACE_COLLECTION);
  const existingQuery = query(
    placeRef,
    where('ownerId', '==', userId),
    where('sourcePlaceId', '==', place.id)
  );
  const existing = await getDocs(existingQuery);

  if (!existing.empty) {
    return existing.docs[0];
  }

  return addDoc(placeRef, {
    ownerId: userId,
    sourcePlaceId: place.id,
    name: place.name,
    description: place.description || null,
    address: place.address || null,
    lat: Number(place.lat),
    lng: Number(place.lng),
    type: place.type || 'saved',
    rating: place.rating ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function removeOwnedPlace(ownedPlaceId) {
  const placeDocRef = doc(db, OWNED_PLACE_COLLECTION, ownedPlaceId);
  return deleteDoc(placeDocRef);
}
