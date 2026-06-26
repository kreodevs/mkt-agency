import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SessionRecord,
  SessionRepositoryPort,
} from '../../domain/session.repository.port';
import { SessionEntity } from './session.entity';

@Injectable()
export class TypeOrmSessionRepository implements SessionRepositoryPort {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessions: Repository<SessionEntity>,
  ) {}

  async create(params: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<SessionRecord> {
    const entity = this.sessions.create({
      userId: params.userId,
      refreshTokenHash: params.refreshTokenHash,
      expiresAt: params.expiresAt,
      previousRefreshTokenHash: null,
    });
    const saved = await this.sessions.save(entity);
    return this.toRecord(saved);
  }

  async findByRefreshTokenHash(hash: string): Promise<SessionRecord | null> {
    const session = await this.sessions.findOne({
      where: { refreshTokenHash: hash },
    });
    return session ? this.toRecord(session) : null;
  }

  async findReuseByPreviousHash(hash: string): Promise<SessionRecord | null> {
    const session = await this.sessions.findOne({
      where: { previousRefreshTokenHash: hash },
    });
    return session ? this.toRecord(session) : null;
  }

  async rotateRefreshToken(
    sessionId: string,
    newHash: string,
    newExpiresAt: Date,
    previousHash: string,
  ): Promise<void> {
    await this.sessions.update(sessionId, {
      previousRefreshTokenHash: previousHash,
      refreshTokenHash: newHash,
      expiresAt: newExpiresAt,
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.sessions.delete({ id });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.sessions.delete({ userId });
  }

  private toRecord(entity: SessionEntity): SessionRecord {
    return {
      id: entity.id,
      userId: entity.userId,
      refreshTokenHash: entity.refreshTokenHash,
      previousRefreshTokenHash: entity.previousRefreshTokenHash,
      expiresAt: entity.expiresAt,
    };
  }
}
