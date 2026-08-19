import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePassengerDto {
  @IsUUID()
  tripId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  document: string;
}
