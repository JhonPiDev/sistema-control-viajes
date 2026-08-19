import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { callService } from '../common/rpc.helper';
import { OPERATIONS_SERVICE_URL } from '../common/service-urls';
import { CreateExpenseDto } from './dto/create-expense.dto';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips/:tripId/expenses')
export class ExpensesController {
  @Post()
  @Roles('DRIVER')
  create(
    @Param('tripId') tripId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return callService(OPERATIONS_SERVICE_URL, 'POST', '/expenses', {
      tripId,
      ...dto,
      createdById: user.id,
    });
  }

  @Get()
  @Roles('ADMIN', 'DRIVER')
  findByTrip(@Param('tripId') tripId: string) {
    return callService(OPERATIONS_SERVICE_URL, 'GET', `/expenses/trip/${tripId}`);
  }
}
