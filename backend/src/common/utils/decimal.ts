import { Prisma } from '@prisma/client';

export function toNumber(value: Prisma.Decimal | number | string): number {
  return new Prisma.Decimal(value).toNumber();
}
