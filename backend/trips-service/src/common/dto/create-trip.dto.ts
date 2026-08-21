import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CITIES } from '../constants/cities';

class PassengerInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  document: string;
}

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(CITIES)
  origin: string;

  @IsIn(CITIES)
  destination: string;

  @IsUUID()
  driverId: string;

  @IsUUID()
  createdById: string;

  // Lista inicial de pasajeros (opcional). Necesita decoradores porque el
  // ValidationPipe (whitelist) rechaza propiedades sin declarar.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerInputDto)
  passengers?: PassengerInputDto[];

  // Paradas intermedias, en orden (origin -> stops[0] -> ... -> destination).
  // Se guardan con el mismo orden en que llegan en el arreglo.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(CITIES, { each: true })
  stops?: string[];
}
