import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateDriverDto {
  @ApiProperty({ example: 'Carlos Ramírez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}
