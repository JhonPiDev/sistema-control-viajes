import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CITIES } from '../../common/constants/cities';

export class CreateStopDto {
  @ApiProperty({ enum: CITIES })
  @IsIn(CITIES)
  city: string;
}
