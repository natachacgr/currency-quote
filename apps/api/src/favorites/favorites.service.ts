import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAllByUser(userId: string) {
    return this.prisma.favoriteCurrency.findMany({
      where: {
        userId,
      },
      include: {
        currency: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async add(userId: string, currencyCode: string) {
    const normalizedCode =
      currencyCode.trim().toUpperCase();

    const currency =
      await this.prisma.currency.findUnique({
        where: {
          code: normalizedCode,
        },
      });

    if (!currency) {
      throw new NotFoundException(
        `Currency "${normalizedCode}" was not found`,
      );
    }

    const existingFavorite =
      await this.prisma.favoriteCurrency.findUnique({
        where: {
          userId_currencyId: {
            userId,
            currencyId: currency.id,
          },
        },
      });

    if (existingFavorite) {
      throw new ConflictException(
        `Currency "${normalizedCode}" is already a favorite`,
      );
    }

    return this.prisma.favoriteCurrency.create({
      data: {
        userId,
        currencyId: currency.id,
      },
      include: {
        currency: true,
      },
    });
  }

  async remove(userId: string, currencyCode: string) {
    const normalizedCode =
      currencyCode.trim().toUpperCase();

    const currency =
      await this.prisma.currency.findUnique({
        where: {
          code: normalizedCode,
        },
      });

    if (!currency) {
      throw new NotFoundException(
        `Currency "${normalizedCode}" was not found`,
      );
    }

    const favorite =
      await this.prisma.favoriteCurrency.findUnique({
        where: {
          userId_currencyId: {
            userId,
            currencyId: currency.id,
          },
        },
      });

    if (!favorite) {
      throw new NotFoundException(
        `Currency "${normalizedCode}" is not a favorite`,
      );
    }

    await this.prisma.favoriteCurrency.delete({
      where: {
        id: favorite.id,
      },
    });

    return {
      message: `Currency "${normalizedCode}" removed from favorites`,
    };
  }
}