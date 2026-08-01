import { AuthRepository } from '../repositories/AuthRepository';
import { User } from '../entities/cattle';

export class GoogleLoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(idToken: string): Promise<User> {
    if (!idToken) {
      throw new Error('Google identity token is missing.');
    }
    return await this.authRepository.loginWithGoogle(idToken);
  }
}

export class SignUpUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string, name?: string): Promise<User> {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long for sign up.');
    }
    return await this.authRepository.signUp(email, password, name);
  }
}
