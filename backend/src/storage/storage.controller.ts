import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const path = await this.storageService.uploadFile(file);
    const url = await this.storageService.getFileUrl(path);
    return { path, url };
  }

  @Get('url/:path(*)')
  async getUrl(@Param('path') path: string) {
    const url = await this.storageService.getFileUrl(path);
    return { url };
  }
}
