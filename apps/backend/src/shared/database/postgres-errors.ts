import { QueryFailedError } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

function getPostgresErrorCode(error: QueryFailedError): string | undefined {
  const driver = (
    error as QueryFailedError & { driverError?: { code?: string } }
  ).driverError;
  return driver?.code ?? (error as { code?: string }).code;
}

export function rethrowKnownDatabaseError(error: unknown): never {
  if (!(error instanceof QueryFailedError)) {
    throw error;
  }

  const code = getPostgresErrorCode(error);

  if (code === '23505') {
    throw new ConflictException({
      error: 'El email del owner o el slug del tenant ya existen',
      code: 'CONFLICT',
    });
  }

  if (code === '23503') {
    throw new BadRequestException({
      error: 'Paquete o referencia inválida',
      code: 'VALIDATION_ERROR',
    });
  }

  if (code === '42703') {
    throw new BadRequestException({
      error: 'Esquema de base de datos desactualizado. Redeploy del API para aplicar migraciones.',
      code: 'SCHEMA_OUTDATED',
    });
  }

  throw new InternalServerErrorException({
    error: 'Database error while saving tenant',
    code: 'DATABASE_ERROR',
  });
}
