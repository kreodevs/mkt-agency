export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  previousRefreshTokenHash: string | null;
  expiresAt: Date;
}

export interface SessionRepositoryPort {
  create(params: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<SessionRecord>;
  findByRefreshTokenHash(hash: string): Promise<SessionRecord | null>;
  findReuseByPreviousHash(hash: string): Promise<SessionRecord | null>;
  rotateRefreshToken(
    sessionId: string,
    newHash: string,
    newExpiresAt: Date,
    previousHash: string,
  ): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
