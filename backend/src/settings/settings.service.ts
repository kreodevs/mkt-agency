import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { ProductSettings } from './entities/product-settings.entity';
import { UploadedFile } from './entities/uploaded-file.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ProductSettings)
    private readonly settingsRepo: Repository<ProductSettings>,
    @InjectRepository(UploadedFile)
    private readonly uploadedFileRepo: Repository<UploadedFile>,
  ) {}

  async getOrCreate(productId: string): Promise<ProductSettings> {
    let settings = await this.settingsRepo.findOne({ where: { productId } });
    if (!settings) {
      settings = this.settingsRepo.create({ productId });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async update(productId: string, dto: UpdateSettingsDto): Promise<ProductSettings> {
    const settings = await this.getOrCreate(productId);
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  async uploadFile(
    tenantId: string,
    productId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; fileName: string; originalName: string }> {
    const uploadDir = path.join(process.cwd(), 'uploads', tenantId, productId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const fileName = `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const url = `/uploads/${tenantId}/${productId}/${fileName}`;

    const uploadedFile = this.uploadedFileRepo.create({
      tenantId,
      productId,
      originalName: file.originalname,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      url,
    });
    await this.uploadedFileRepo.save(uploadedFile);

    return { url, fileName, originalName: file.originalname };
  }

  async getUploads(tenantId: string, productId: string): Promise<UploadedFile[]> {
    return this.uploadedFileRepo.find({
      where: { tenantId, productId },
      order: { createdAt: 'DESC' },
    });
  }
}
