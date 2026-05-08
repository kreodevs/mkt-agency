import { Expose } from 'class-transformer';

export class TenantResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  ownerId: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  products: { id: string; name: string; type: string }[];
}