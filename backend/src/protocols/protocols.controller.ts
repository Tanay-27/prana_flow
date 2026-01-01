import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ProtocolsService } from './protocols.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('protocols')
export class ProtocolsController {
  constructor(private readonly service: ProtocolsService) {}

  @Post()
  create(@Req() req, @Body() body: any) {
    return this.service.create(body, req.user._id);
  }

  @Get()
  findAll(@Req() req, @Query('search') search?: string) {
    return this.service.findAll(req.user._id, search);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user._id);
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
