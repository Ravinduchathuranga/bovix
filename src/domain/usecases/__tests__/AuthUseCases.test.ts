import { LoginUseCase } from '../LoginUseCase';
import { SignUpUseCase, GoogleLoginUseCase } from '../AuthUseCases';
import { AuthRepository } from '../../repositories/AuthRepository';
import { User } from '../../entities/cattle';

describe('AuthUseCases', () => {
  let mockAuthRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      loginWithGoogle: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
    };
  });

  describe('LoginUseCase', () => {
    it('should successfully log in with valid email and password', async () => {
      const useCase = new LoginUseCase(mockAuthRepository);
      const mockUser: User = {
        id: 'usr_1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'farmer',
        farmName: 'Bovix Farm',
      };

      mockAuthRepository.login.mockResolvedValue(mockUser);

      const result = await useCase.execute('john@example.com', 'password123');

      expect(mockAuthRepository.login).toHaveBeenCalledWith('john@example.com', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error for invalid email format', async () => {
      const useCase = new LoginUseCase(mockAuthRepository);
      await expect(useCase.execute('invalid-email', 'password123')).rejects.toThrow(
        'Please enter a valid email address.'
      );
    });

    it('should throw an error for password shorter than 4 characters', async () => {
      const useCase = new LoginUseCase(mockAuthRepository);
      await expect(useCase.execute('john@example.com', '123')).rejects.toThrow(
        'Password must be at least 4 characters long.'
      );
    });
  });

  describe('SignUpUseCase', () => {
    it('should successfully create account with valid details', async () => {
      const useCase = new SignUpUseCase(mockAuthRepository);
      const mockUser: User = {
        id: 'usr_2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'farmer',
        farmName: 'Bovix Farm',
      };

      mockAuthRepository.signUp.mockResolvedValue(mockUser);

      const result = await useCase.execute('jane@example.com', 'securepass123', 'Jane Doe');

      expect(mockAuthRepository.signUp).toHaveBeenCalledWith(
        'jane@example.com',
        'securepass123',
        'Jane Doe'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error if email is invalid on sign up', async () => {
      const useCase = new SignUpUseCase(mockAuthRepository);
      await expect(useCase.execute('jane-at-example.com', 'securepass123')).rejects.toThrow(
        'Please enter a valid email address.'
      );
    });

    it('should throw error if password is less than 6 characters on sign up', async () => {
      const useCase = new SignUpUseCase(mockAuthRepository);
      await expect(useCase.execute('jane@example.com', 'pass5')).rejects.toThrow(
        'Password must be at least 6 characters long for sign up.'
      );
    });
  });

  describe('GoogleLoginUseCase', () => {
    it('should log in using valid idToken', async () => {
      const useCase = new GoogleLoginUseCase(mockAuthRepository);
      const mockUser: User = {
        id: 'usr_3',
        name: 'Google User',
        email: 'google@example.com',
        role: 'farmer',
        farmName: 'Bovix Farm',
      };

      mockAuthRepository.loginWithGoogle.mockResolvedValue(mockUser);

      const result = await useCase.execute('valid_id_token_123');

      expect(mockAuthRepository.loginWithGoogle).toHaveBeenCalledWith('valid_id_token_123');
      expect(result).toEqual(mockUser);
    });

    it('should throw error if idToken is empty', async () => {
      const useCase = new GoogleLoginUseCase(mockAuthRepository);
      await expect(useCase.execute('')).rejects.toThrow('Google identity token is missing.');
    });
  });
});
