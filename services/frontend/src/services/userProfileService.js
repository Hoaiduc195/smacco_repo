import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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
}
