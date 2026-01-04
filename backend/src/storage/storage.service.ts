import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000'),
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
    });
    this.bucketName = this.configService.get<string>('MINIO_BUCKET') || 'pranaflow-storage';
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );
    // In a real setup, we might return a presigned URL or a public URL
    // For local dev, we'll return the path
    return fileName;
  }

  async getFileUrl(fileName: string): Promise<string> {
    return this.minioClient.presignedUrl('GET', this.bucketName, fileName, 24 * 60 * 60);
  }

  async getFilesUrls(fileNames: string[]): Promise<string[]> {
    if (!fileNames || fileNames.length === 0) return [];
    return Promise.all(fileNames.map(name => this.getFileUrl(name)));
  }

  getPathFromUrl(url: string): string {
    if (!url.includes('?')) return url; // Already a path or clean url
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/');
      // Pathname is /bucket/folder/file.ext -> we want folder/file.ext
      // Shift out the first empty part and the bucket name
      return pathParts.slice(2).join('/');
    } catch {
      return url;
    }
  }
}
