import { User } from '../entities/cattle';

export interface AuthRepository {
  login(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, name?: string): Promise<User>;
  loginWithGoogle(idToken: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
