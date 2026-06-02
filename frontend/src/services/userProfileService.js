import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import apiClient from './api';

const USER_COLLECTION = 'users';

export async function upsertUserProfile(user) {
  if (!user?.uid) return;

  const userDocRef = doc(db, USER_COLLECTION, user.uid);
  await setDoc(
    userDocRef,
    {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    await apiClient.post('/users/upsert', {
      uid: user.uid,
      email: user.email || null,
      name: user.displayName || null,
    });
  } catch (error) {
    console.error('Không thể đồng bộ hồ sơ người dùng lên backend', error);
  }
}
