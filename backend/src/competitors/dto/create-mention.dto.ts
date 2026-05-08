import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString } from 'class-validator';
import { MentionSource, MentionSentiment } from '../entities/competitor-mention.entity';

export class CreateMentionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['web', 'twitter', 'review', 'other'])
  source: MentionSource;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['positive', 'negative', 'neutral'])
  sentiment: MentionSentiment;

  @IsOptional()
  @IsDateString()
  date?: Date;
}
