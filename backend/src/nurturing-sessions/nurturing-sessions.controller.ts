import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { NurturingSessionsService } from './nurturing-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('nurturing-sessions')
export class NurturingSessionsController {
  constructor(private readonly service: NurturingSessionsService) {}

  @Post()
  create(@Req() req, @Body() body: any) {
    return this.service.create(body, req.user._id);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return this.service.findAll(req.user._id, startDate, endDate);
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
