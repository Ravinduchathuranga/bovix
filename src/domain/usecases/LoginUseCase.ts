import { AuthRepository } from '../repositories/AuthRepository';
import { User } from '../entities/cattle';

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }
    return await this.authRepository.login(email, password);
  }
}
