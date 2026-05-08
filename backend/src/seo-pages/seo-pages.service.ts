import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoPage, SeoPageStatus } from './entities/seo-page.entity';
import { CreateSeoPageDto } from './dto/create-seo-page.dto';
import { UpdateSeoPageDto } from './dto/update-seo-page.dto';

@Injectable()
export class SeoPagesService {
  constructor(
    @InjectRepository(SeoPage)
    private readonly seoPageRepo: Repository<SeoPage>,
  ) {}

  async create(tenantId: string, productId: string | null, dto: CreateSeoPageDto): Promise<SeoPage> {
    const data: any = {
      ...dto,
      tenantId,
      ...(productId ? { productId } : {}),
    };
    if (dto.status === 'published') {
      data.publishedAt = new Date();
    }
    const page = this.seoPageRepo.create(data) as SeoPage;
    return this.seoPageRepo.save(page) as unknown as Promise<SeoPage>;
  }

  async findAll(tenantId: string, city?: string, productId?: string): Promise<SeoPage[]> {
    const where: any = { tenantId };
    if (city) where.city = city;
    if (productId) where.productId = productId;
    return this.seoPageRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<SeoPage> {
    const page = await this.seoPageRepo.findOne({ where: { id } });
    if (!page) throw new NotFoundException('Página SEO no encontrada');
    return page;
  }

  async findBySlug(tenantId: string, slug: string, productId?: string): Promise<SeoPage> {
    const where: any = { tenantId, slug };
    if (productId) where.productId = productId;
    const page = await this.seoPageRepo.findOne({ where });
    if (!page) throw new NotFoundException('Página SEO no encontrada');
    return page;
  }

  async update(id: string, dto: Partial<CreateSeoPageDto>): Promise<SeoPage> {
    const updates: any = { ...dto };
    if (dto.status === 'published') {
      updates.publishedAt = new Date();
    }
    await this.seoPageRepo.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.seoPageRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Página SEO no encontrada');
    }
  }
}
