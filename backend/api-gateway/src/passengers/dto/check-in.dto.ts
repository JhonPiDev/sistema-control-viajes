import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ enum: ['BOARDED', 'ABSENT', 'PENDING'] })
  @IsIn(['BOARDED', 'ABSENT', 'PENDING'])
  status: 'BOARDED' | 'ABSENT' | 'PENDING';
}
