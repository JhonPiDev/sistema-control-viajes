import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsUUID()
  driverId: string;

  @IsUUID()
  createdById: string;

  // Lista inicial de pasajeros (opcional al crear, también se puede agregar después).
  // IMPORTANTE: necesita decoradores de class-validator porque el
  // ValidationPipe de este microservicio usa whitelist + forbidNonWhitelisted;
  // una propiedad sin decoradores se rechaza con "property passengers should
  // not exist" en vez de simplemente ignorarla.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerInputDto)
  passengers?: PassengerInputDto[];
}
