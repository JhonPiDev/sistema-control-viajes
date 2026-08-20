import { ApiProperty } from '@nestjs/swagger';
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
import { CITIES } from '../../common/constants/cities';

class PassengerInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  document: string;
}

export class CreateTripDto {
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

  @ApiProperty({ type: [PassengerInputDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerInputDto)
  passengers?: PassengerInputDto[];

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
