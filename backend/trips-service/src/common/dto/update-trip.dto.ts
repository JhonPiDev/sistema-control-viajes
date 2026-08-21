import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CITIES } from '../constants/cities';

// Solo editable en PENDIENTE (validado en trips.service.ts); no incluye
// passengers ni createdById, que no cambian al editar.
export class UpdateTripDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(CITIES)
  origin: string;

  @IsIn(CITIES)
  destination: string;

  @IsUUID()
  driverId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(CITIES, { each: true })
  stops?: string[];
}
