import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'in_progress', 'completed', 'skipped'])
  status: string;
}
