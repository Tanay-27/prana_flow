import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Req() req, @Body() body: any) {
    return this.clientsService.create(body, req.user._id);
  }

  @Get()
  findAll(@Req() req, @Query('search') search?: string) {
    return this.clientsService.findAll(req.user._id, search);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.clientsService.findOne(id, req.user._id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.clientsService.update(id, req.user._id, body);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.clientsService.softDelete(id, req.user._id);
  }

  @Post(':id/notes')
  addNote(@Req() req, @Param('id') id: string, @Body('text') text: string) {
    return this.clientsService.addNote(id, req.user._id, text);
  }
}
