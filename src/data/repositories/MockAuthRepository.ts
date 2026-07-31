import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/entities/cattle';

export class MockAuthRepository implements AuthRepository {
  private currentUser: User | null = null;

  async login(email: string): Promise<User> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const user: User = {
      id: 'usr_101',
      name: 'Ashlee Farmer',
      email: email,
      role: 'manager',
      farmName: 'Bovix Green Valley Dairy',
    };
    this.currentUser = user;
    return user;
  }

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }
}
