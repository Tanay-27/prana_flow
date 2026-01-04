import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, UploadedFiles, UseGuards } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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

  @Post('bulk-upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const results = await Promise.all(
      files.map(async (file) => {
        const path = await this.storageService.uploadFile(file);
        const url = await this.storageService.getFileUrl(path);
        return { path, url };
      }),
    );
    return results;
  }

  @Get('url/*path')
  async getUrl(@Param('path') path: string) {
    const url = await this.storageService.getFileUrl(path);
    return { url };
  }
}
