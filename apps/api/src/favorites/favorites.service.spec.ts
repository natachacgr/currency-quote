import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma/prisma.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let favoritesService: FavoritesService;

  let prismaService: {
    favoriteCurrency: {
      findMany: jest.Mock<(args: unknown) => Promise<unknown>>;
      findUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
      create: jest.Mock<(args: unknown) => Promise<unknown>>;
      delete: jest.Mock<(args: unknown) => Promise<unknown>>;
    };
    currency: {
      findUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
    };
  };

  beforeEach(() => {
    prismaService = {
      favoriteCurrency: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      currency: {
        findUnique: jest.fn(),
      },
    };

    favoritesService = new FavoritesService(
      prismaService as unknown as PrismaService,
    );

    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('should return all favorites for a user', async () => {
      const favorites = [
        {
          id: 'favorite-1',
          userId: 'user-1',
          currencyId: 'currency-usd',
          createdAt: new Date('2026-09-28T12:00:00.000Z'),
          currency: {
            id: 'currency-usd',
            code: 'USD',
            name: 'Dólar Americano',
          },
        },
        {
          id: 'favorite-2',
          userId: 'user-1',
          currencyId: 'currency-eur',
          createdAt: new Date('2026-09-28T13:00:00.000Z'),
          currency: {
            id: 'currency-eur',
            code: 'EUR',
            name: 'Euro',
          },
        },
      ];

      prismaService.favoriteCurrency.findMany.mockResolvedValue(favorites);

      const result = await favoritesService.findAllByUser('user-1');

      expect(prismaService.favoriteCurrency.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        include: {
          currency: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      expect(prismaService.favoriteCurrency.findMany).toHaveBeenCalledTimes(1);

      expect(result).toEqual(favorites);
    });
  });

  describe('add', () => {
    it('should add a currency to the user favorites', async () => {
      const currency = {
        id: 'currency-usd',
        code: 'USD',
        name: 'Dólar Americano',
      };

      const favorite = {
        id: 'favorite-1',
        userId: 'user-1',
        currencyId: 'currency-usd',
        createdAt: new Date('2026-09-28T12:00:00.000Z'),
        currency,
      };

      prismaService.currency.findUnique.mockResolvedValue(currency);

      prismaService.favoriteCurrency.findUnique.mockResolvedValue(null);

      prismaService.favoriteCurrency.create.mockResolvedValue(favorite);

      const result = await favoritesService.add('user-1', ' usd ');

      expect(prismaService.currency.findUnique).toHaveBeenCalledWith({
        where: {
          code: 'USD',
        },
      });

      expect(prismaService.favoriteCurrency.findUnique).toHaveBeenCalledWith({
        where: {
          userId_currencyId: {
            userId: 'user-1',
            currencyId: 'currency-usd',
          },
        },
      });

      expect(prismaService.favoriteCurrency.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          currencyId: 'currency-usd',
        },
        include: {
          currency: true,
        },
      });

      expect(result).toEqual(favorite);
    });

    it('should throw NotFoundException when currency does not exist', async () => {
      prismaService.currency.findUnique.mockResolvedValue(null);

      await expect(favoritesService.add('user-1', ' xyz ')).rejects.toThrow(
        new NotFoundException('Currency "XYZ" was not found'),
      );

      expect(prismaService.currency.findUnique).toHaveBeenCalledWith({
        where: {
          code: 'XYZ',
        },
      });

      expect(prismaService.favoriteCurrency.findUnique).not.toHaveBeenCalled();

      expect(prismaService.favoriteCurrency.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when currency is already a favorite', async () => {
      const currency = {
        id: 'currency-usd',
        code: 'USD',
        name: 'Dólar Americano',
      };

      const existingFavorite = {
        id: 'favorite-1',
        userId: 'user-1',
        currencyId: 'currency-usd',
        createdAt: new Date('2026-09-28T12:00:00.000Z'),
      };

      prismaService.currency.findUnique.mockResolvedValue(currency);

      prismaService.favoriteCurrency.findUnique.mockResolvedValue(
        existingFavorite,
      );

      await expect(favoritesService.add('user-1', 'usd')).rejects.toThrow(
        new ConflictException('Currency "USD" is already a favorite'),
      );

      expect(prismaService.favoriteCurrency.findUnique).toHaveBeenCalledWith({
        where: {
          userId_currencyId: {
            userId: 'user-1',
            currencyId: 'currency-usd',
          },
        },
      });

      expect(prismaService.favoriteCurrency.create).not.toHaveBeenCalled();
    });
  });
  describe('remove', () => {
    it('should remove a currency from the user favorites', async () => {
      const currency = {
        id: 'currency-usd',
        code: 'USD',
        name: 'Dólar Americano',
      };

      const favorite = {
        id: 'favorite-1',
        userId: 'user-1',
        currencyId: 'currency-usd',
        createdAt: new Date('2026-09-28T12:00:00.000Z'),
      };

      prismaService.currency.findUnique.mockResolvedValue(currency);

      prismaService.favoriteCurrency.findUnique.mockResolvedValue(favorite);

      prismaService.favoriteCurrency.delete.mockResolvedValue(favorite);

      const result = await favoritesService.remove('user-1', ' usd ');

      expect(prismaService.currency.findUnique).toHaveBeenCalledWith({
        where: {
          code: 'USD',
        },
      });

      expect(prismaService.favoriteCurrency.findUnique).toHaveBeenCalledWith({
        where: {
          userId_currencyId: {
            userId: 'user-1',
            currencyId: 'currency-usd',
          },
        },
      });

      expect(prismaService.favoriteCurrency.delete).toHaveBeenCalledWith({
        where: {
          id: 'favorite-1',
        },
      });

      expect(result).toEqual({
        message: 'Currency "USD" removed from favorites',
      });
    });

    it('should throw NotFoundException when currency does not exist', async () => {
      prismaService.currency.findUnique.mockResolvedValue(null);

      await expect(favoritesService.remove('user-1', ' xyz ')).rejects.toThrow(
        new NotFoundException('Currency "XYZ" was not found'),
      );

      expect(prismaService.currency.findUnique).toHaveBeenCalledWith({
        where: {
          code: 'XYZ',
        },
      });

      expect(prismaService.favoriteCurrency.findUnique).not.toHaveBeenCalled();

      expect(prismaService.favoriteCurrency.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when currency is not a favorite', async () => {
      const currency = {
        id: 'currency-usd',
        code: 'USD',
        name: 'Dólar Americano',
      };

      prismaService.currency.findUnique.mockResolvedValue(currency);

      prismaService.favoriteCurrency.findUnique.mockResolvedValue(null);

      await expect(favoritesService.remove('user-1', 'usd')).rejects.toThrow(
        new NotFoundException('Currency "USD" is not a favorite'),
      );

      expect(prismaService.favoriteCurrency.findUnique).toHaveBeenCalledWith({
        where: {
          userId_currencyId: {
            userId: 'user-1',
            currencyId: 'currency-usd',
          },
        },
      });

      expect(prismaService.favoriteCurrency.delete).not.toHaveBeenCalled();
    });
  });
});
