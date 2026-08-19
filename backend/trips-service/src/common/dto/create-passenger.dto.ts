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

/** Igual que CreatePassengerDto pero sin tripId, porque en la ruta REST
 * (POST /trips/:tripId/passengers) ese dato viaja en la URL, no en el body. */
export class AddPassengerBodyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  document: string;
}
