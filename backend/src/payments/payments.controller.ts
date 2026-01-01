import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  create(@Req() req, @Body() body: any) {
    return this.service.create(body, req.user._id);
  }

  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.user._id);
  }

  @Get('client/:clientId')
  findByClient(@Req() req, @Param('clientId') clientId: string) {
    return this.service.findByClient(req.user._id, clientId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.service.update(id, req.user._id, body);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.service.remove(id, req.user._id);
  }
}
