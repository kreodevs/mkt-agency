import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { WebsiteAnalyzerService } from '../agents/website-analyzer.service';
import {
  CreateProductDto,
  CreateProductFromAnalysisDto,
  UpdateProductDto,
  AutoCreateProductsDto,
} from './dto/product.request.dto';
import {
  ProductListResponseDto,
  ProductResponseDto,
} from './dto/product.response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly analyzer: WebsiteAnalyzerService,
  ) {}

  async list(tenantId: string): Promise<ProductListResponseDto> {
    const items = await this.products.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return { items: items.map((item) => this.toResponse(item)) };
  }

  async get(tenantId: string, id: string): Promise<ProductResponseDto> {
    const product = await this.findOwned(tenantId, id);
    return this.toResponse(product);
  }

  async create(
    tenantId: string,
    dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const existing = await this.products.findOne({
      where: {
        tenantId,
        name: dto.name.trim(),
      },
    });
    if (existing) {
      throw new ConflictException({
        error: `Ya existe un producto con el nombre "${dto.name.trim()}"`,
        code: 'PRODUCT_ALREADY_EXISTS',
      });
    }

    const saved = await this.products.save(
      this.products.create({
        tenantId,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        website: dto.website?.trim() ?? null,
      }),
    );
    return this.toResponse(saved);
  }

  async autoCreate(
    tenantId: string,
    dto: AutoCreateProductsDto,
  ): Promise<ProductListResponseDto> {
    const existing = await this.products.find({ where: { tenantId } });
    const existingNames = new Set(
      existing.map((p) => p.name.trim().toLowerCase()),
    );

    const created: ProductEntity[] = [];
    for (const name of dto.names) {
      const trimmed = name.trim();
      if (!trimmed || existingNames.has(trimmed.toLowerCase())) continue;

      const saved = await this.products.save(
        this.products.create({
          tenantId,
          name: trimmed,
        }),
      );
      existingNames.add(trimmed.toLowerCase());
      created.push(saved);
    }

    return { items: created.map((item) => this.toResponse(item)) };
  }

  async fromAnalysis(
    tenantId: string,
    dto: CreateProductFromAnalysisDto,
  ): Promise<ProductResponseDto> {
    const result = await this.analyzer.analyze(dto.url);

    const name = result.companyName?.trim();
    if (!name) {
      throw new BadRequestException({
        error:
          'No se pudo extraer un nombre de la URL. Conecta un proveedor LLM o crea el producto manualmente.',
        code: 'ANALYSIS_INCOMPLETE',
      });
    }

    const seoTags = dto.seoTags ?? this.normalizeSeoTags(result.seoTags);

    const saved = await this.products.save(
      this.products.create({
        tenantId,
        name,
        description: result.description?.trim() || null,
        website: dto.url.trim(),
        seoTags,
      }),
    );
    return this.toResponse(saved);
  }

  private normalizeSeoTags(
    tags: { title: string; description: string; keywords: string[]; h1: string; focusKeyphrase?: string; ogTitle?: string; ogDescription?: string } | undefined,
  ): Record<string, string[]> | null {
    if (!tags) return null;
    const out: Record<string, string[]> = {};
    const put = (key: string, value: string | undefined) => {
      if (value && value.trim()) out[key] = [value.trim()];
    };
    put('title', tags.title);
    put('description', tags.description);
    put('h1', tags.h1);
    put('focusKeyphrase', tags.focusKeyphrase);
    put('ogTitle', tags.ogTitle);
    put('ogDescription', tags.ogDescription);
    if (tags.keywords?.length) out.keywords = tags.keywords;
    return Object.keys(out).length ? out : null;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.findOwned(tenantId, id);

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.description !== undefined) product.description = dto.description?.trim() ?? null;
    if (dto.website !== undefined) product.website = dto.website?.trim() ?? null;
    if (dto.seoTags !== undefined) product.seoTags = dto.seoTags;

    const saved = await this.products.save(product);
    return this.toResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const product = await this.findOwned(tenantId, id);
    await this.products.remove(product);
  }

  private async findOwned(
    tenantId: string,
    id: string,
  ): Promise<ProductEntity> {
    const product = await this.products.findOne({
      where: { id, tenantId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private toResponse(entity: ProductEntity): ProductResponseDto {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      description: entity.description,
      website: entity.website,
      seoTags: entity.seoTags,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}