import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export enum IncidentTypeDto {
  DELAY = 'DELAY',
  PASSENGER_ISSUE = 'PASSENGER_ISSUE',
  DETOUR = 'DETOUR',
  OTHER = 'OTHER',
}

export class CreateIncidentDto {
  @IsUUID()
  tripId: string;

  @IsEnum(IncidentTypeDto)
  type: IncidentTypeDto;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  createdById: string;
}
