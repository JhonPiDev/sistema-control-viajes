import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePassengerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    required: false,
    description: 'Parada donde aborda (si no viene, se asume que aborda en el origen).',
  })
  @IsOptional()
  @IsUUID()
  stopId?: string;
}
