import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/entities/cattle';

export class FirebaseAuthRepository implements AuthRepository {
  private mapFirebaseUser(fbUser: FirebaseUser, displayNameOverride?: string): User {
    return {
      id: fbUser.uid,
      name: displayNameOverride || fbUser.displayName || fbUser.email?.split('@')[0] || 'Dairy Farmer',
      email: fbUser.email || '',
      role: 'manager',
      farmName: 'Bovix Green Valley Dairy',
    };
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return this.mapFirebaseUser(userCredential.user);
  }

  async signUp(email: string, password: string, name?: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return this.mapFirebaseUser(userCredential.user, name);
  }

  async loginWithGoogle(idToken: string): Promise<User> {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return this.mapFirebaseUser(userCredential.user);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) {
            resolve(this.mapFirebaseUser(user));
          } else {
            resolve(null);
          }
        },
        () => {
          unsubscribe();
          resolve(null);
        }
      );
    });
  }
}
