import { IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  answer!: string;
}