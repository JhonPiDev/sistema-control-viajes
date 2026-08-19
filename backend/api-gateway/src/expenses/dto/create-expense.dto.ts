import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export enum ExpenseTypeDto {
  FUEL = 'FUEL',
  TOLL = 'TOLL',
  REPAIR = 'REPAIR',
  OTHER = 'OTHER',
}

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseTypeDto })
  @IsEnum(ExpenseTypeDto)
  type: ExpenseTypeDto;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept: string;
}
