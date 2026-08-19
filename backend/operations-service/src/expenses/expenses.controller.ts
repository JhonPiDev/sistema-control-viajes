import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from '../common/dto/create-expense.dto';

@UseGuards(InternalAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Get('trip/:tripId')
  findByTrip(@Param('tripId') tripId: string) {
    return this.expensesService.findByTrip(tripId);
  }

  @Get('trip/:tripId/total')
  totalByTrip(@Param('tripId') tripId: string) {
    return this.expensesService.totalByTrip(tripId);
  }
}
