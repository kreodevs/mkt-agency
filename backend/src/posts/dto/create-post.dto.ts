import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  scheduledAt?: string;
}

export class ApprovePostDto {
  @IsString()
  @IsNotEmpty()
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  feedbackText?: string;
}