import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Req() req, @Body() body: any) {
    if (body.daysOfWeek && body.startDate && body.endDate) {
      return this.sessionsService.createRecurring(body, req.user._id);
    }
    return this.sessionsService.create(body, req.user._id);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    if (start && end) {
      return this.sessionsService.findByRange(
        req.user._id,
        new Date(start),
        new Date(end)
      );
    }
    // Default to next 30 days if no range
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    return this.sessionsService.findByRange(req.user._id, startDate, endDate);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.sessionsService.update(id, req.user._id, body);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.sessionsService.delete(id, req.user._id);
  }
}
