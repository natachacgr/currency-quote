import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as argon2 from 'argon2';

import type { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

interface MockUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

describe('AuthService', () => {
  let authService: AuthService;

  let usersService: {
    findByEmail: jest.Mock<
      (email: string) => Promise<MockUser | null>
    >;
    create: jest.Mock<
      (
        name: string,
        email: string,
        passwordHash: string,
      ) => Promise<MockUser>
    >;
  };

  let jwtService: {
    signAsync: jest.Mock<
      (
        payload: {
          sub: string;
          email: string;
        },
      ) => Promise<string>
    >;
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and return an access token', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      usersService.create.mockImplementation(
        async (
          name: string,
          email: string,
          passwordHash: string,
        ) => ({
          id: 'user-1',
          name,
          email,
          passwordHash,
        }),
      );

      jwtService.signAsync.mockResolvedValue(
        'access-token',
      );

      const result = await authService.register({
        name: 'Natacha',
        email: 'NATACHA@EMAIL.COM',
        password: 'password123',
      });

      expect(
        usersService.findByEmail,
      ).toHaveBeenCalledWith(
        'natacha@email.com',
      );

      expect(
        usersService.create,
      ).toHaveBeenCalledTimes(1);

      const [
        name,
        email,
        passwordHash,
      ] = usersService.create.mock.calls[0];

      expect(name).toBe('Natacha');
      expect(email).toBe('natacha@email.com');

      expect(
        await argon2.verify(
          passwordHash,
          'password123',
        ),
      ).toBe(true);

      expect(
        jwtService.signAsync,
      ).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'natacha@email.com',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        user: {
          id: 'user-1',
          name: 'Natacha',
          email: 'natacha@email.com',
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'Natacha',
        email: 'natacha@email.com',
        passwordHash: 'hashed-password',
      });

      await expect(
        authService.register({
          name: 'Natacha',
          email: 'natacha@email.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(
        usersService.create,
      ).not.toHaveBeenCalled();

      expect(
        jwtService.signAsync,
      ).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate a user and return an access token', async () => {
      const passwordHash = await argon2.hash(
        'password123',
      );

      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'Natacha',
        email: 'natacha@email.com',
        passwordHash,
      });

      jwtService.signAsync.mockResolvedValue(
        'access-token',
      );

      const result = await authService.login({
        email: 'NATACHA@EMAIL.COM',
        password: 'password123',
      });

      expect(
        usersService.findByEmail,
      ).toHaveBeenCalledWith(
        'natacha@email.com',
      );

      expect(
        jwtService.signAsync,
      ).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'natacha@email.com',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        user: {
          id: 'user-1',
          name: 'Natacha',
          email: 'natacha@email.com',
        },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@email.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        jwtService.signAsync,
      ).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const passwordHash = await argon2.hash(
        'password123',
      );

      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'Natacha',
        email: 'natacha@email.com',
        passwordHash,
      });

      await expect(
        authService.login({
          email: 'natacha@email.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        jwtService.signAsync,
      ).not.toHaveBeenCalled();
    });
  });
});