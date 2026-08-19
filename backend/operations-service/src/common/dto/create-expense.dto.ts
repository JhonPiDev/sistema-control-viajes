import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export enum ExpenseTypeDto {
  FUEL = 'FUEL',
  TOLL = 'TOLL',
  REPAIR = 'REPAIR',
  OTHER = 'OTHER',
}

export class CreateExpenseDto {
  @IsUUID()
  tripId: string;

  @IsEnum(ExpenseTypeDto)
  type: ExpenseTypeDto;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  concept: string;

  @IsUUID()
  createdById: string;
}
