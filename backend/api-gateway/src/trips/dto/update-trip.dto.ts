import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CITIES } from '../../common/constants/cities';

// Solo se puede editar un viaje mientras está PENDIENTE (trips-service lo
// valida). Sin passengers ni createdById: la lista de pasajeros de origen
// se maneja aparte y quién creó el viaje no cambia al editarlo.
export class UpdateTripDto {
  @ApiProperty({ example: 'Bogotá - Medellín 18/08' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CITIES })
  @IsIn(CITIES)
  origin: string;

  @ApiProperty({ enum: CITIES })
  @IsIn(CITIES)
  destination: string;

  @ApiProperty()
  @IsUUID()
  driverId: string;

  @ApiProperty({
    type: [String],
    enum: CITIES,
    required: false,
    description: 'Paradas intermedias, en orden (origen -> stops -> destino).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(CITIES, { each: true })
  stops?: string[];
}
