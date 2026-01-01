import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions/sessions.service';
import { NurturingSessionsService } from './nurturing-sessions/nurturing-sessions.service';
import { ClientsService } from './clients/clients.service';
import { ProtocolsService } from './protocols/protocols.service';
import { PaymentsService } from './payments/payments.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly sessionsService: SessionsService,
    private readonly nurturingSessionsService: NurturingSessionsService,
    private readonly clientsService: ClientsService,
    private readonly protocolsService: ProtocolsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('export')
  async getExport(@Req() req) {
    const userId = req.user._id;
    const [clients, protocols, sessions, payments, nurturing] = await Promise.all([
      this.clientsService.findAll(userId),
      this.protocolsService.findAll(userId),
      this.sessionsService.findByRange(userId, new Date(0), new Date('2100-01-01')),
      this.paymentsService.findAll(userId),
      this.nurturingSessionsService.findAll(userId),
    ]);

    return {
      exportDate: new Date(),
      version: '1.0',
      data: {
        clients,
        protocols,
        sessions,
        payments,
        nurturing,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('agenda')
  async getAgenda(
    @Req() req,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('type') type?: 'healing' | 'nurturing' | 'all',
    @Query('status') status?: string,
  ) {
    const userId = req.user._id;
    const startDate = start ? new Date(start) : new Date();
    if (!start) startDate.setHours(0, 0, 0, 0);
    
    const endDate = end ? new Date(end) : new Date(startDate);
    if (!end) endDate.setDate(endDate.getDate() + 7);

    let sessions: any[] = [];
    let nurturing: any[] = [];

    if (!type || type === 'all' || type === 'healing') {
      sessions = await this.sessionsService.findByRange(userId, startDate, endDate);
    }
    if (!type || type === 'all' || type === 'nurturing') {
      nurturing = await this.nurturingSessionsService.findByRange(userId, startDate, endDate);
    }

    // Format them for a unified agenda view
    let agenda: any[] = [...sessions, ...nurturing];

    if (status) {
      agenda = agenda.filter(item => item.status === status);
    }

    return agenda.sort((a, b) => {
      const dateA = (a as any).scheduled_date || (a as any).date;
      const dateB = (b as any).scheduled_date || (b as any).date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }
}
