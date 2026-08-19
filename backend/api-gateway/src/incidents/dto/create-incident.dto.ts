import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum IncidentTypeDto {
  DELAY = 'DELAY',
  PASSENGER_ISSUE = 'PASSENGER_ISSUE',
  DETOUR = 'DETOUR',
  OTHER = 'OTHER',
}

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentTypeDto })
  @IsEnum(IncidentTypeDto)
  type: IncidentTypeDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}
