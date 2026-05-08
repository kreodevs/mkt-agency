import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}