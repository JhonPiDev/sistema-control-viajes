import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CITIES } from '../constants/cities';

// Solo se puede editar un viaje mientras está PENDIENTE (trips.service.ts lo
// valida). Por eso no incluye passengers ni createdById: la lista de
// pasajeros de origen se sigue manejando por separado, y quién lo creó no
// cambia. `name` se recalcula en el frontend como "origen - destino" cada
// vez que se edita, igual que al crear.
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
