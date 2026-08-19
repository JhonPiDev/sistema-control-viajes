import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignatureDto {
  @ApiProperty({ description: 'Imagen de la firma en base64 (data URL)' })
  @IsString()
  @IsNotEmpty()
  signatureData: string;
}
