import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseProductNamesFromText, slugifyProductName } from './domain/product-slug.util';
import {
  BulkCreateProductsDto,
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.request.dto';
import {
  BulkCreateProductsResponseDto,
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/product.response.dto';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import {
  calculateProductOnboardingCompletion,
  isProductOnboardingCompleted,
  isProductOnboardingReady,
} from './domain/product-onboarding.util';
import {
  getProductLogoAssetId,
  getProductLogoSourceUrl,
} from './domain/product-logo.metadata.util';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
  ) {}

  async list(
    tenantId: string,
    query: ListProductsQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const qb = this.products
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .orderBy('p.is_primary', 'DESC')
      .addOrderBy('p.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string): Promise<ProductResponseDto> {
    const product = await this.findOwnedProduct(tenantId, id);
    return this.toResponse(product);
  }

  async findPrimary(tenantId: string): Promise<ProductEntity | null> {
    return this.products.findOne({
      where: { tenantId, isPrimary: true, status: 'active' },
      order: { createdAt: 'ASC' },
    });
  }

  async findOwnedEntity(tenantId: string, id: string): Promise<ProductEntity> {
    return this.findOwnedProduct(tenantId, id);
  }

  async create(tenantId: string, dto: CreateProductDto): Promise<ProductResponseDto> {
    const slug = await this.resolveUniqueSlug(tenantId, dto.name);

    if (dto.isPrimary) {
      await this.clearPrimaryFlag(tenantId);
    }

    const hasPrimary = await this.products.exist({
      where: { tenantId, isPrimary: true, status: 'active' },
    });

    const saved = await this.products.save(
      this.products.create({
        tenantId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() ?? null,
        category: dto.category ?? null,
        priceRange: dto.priceRange?.trim() ?? null,
        targetAudience: dto.targetAudience?.trim() ?? null,
        valueProposition: dto.valueProposition?.trim() ?? null,
        websiteUrl: dto.websiteUrl?.trim() ?? null,
        keywords: dto.keywords ?? [],
        status: 'active',
        isPrimary: dto.isPrimary ?? !hasPrimary,
      }),
    );

    return this.toResponse(saved);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.findOwnedProduct(tenantId, id);

    if (dto.name !== undefined) {
      product.name = dto.name.trim();
      if (dto.name.trim()) {
        product.slug = await this.resolveUniqueSlug(tenantId, dto.name, id);
      }
    }

    if (dto.description !== undefined) {
      product.description = dto.description?.trim() ?? null;
    }
    if (dto.category !== undefined) {
      product.category = dto.category ?? null;
    }
    if (dto.priceRange !== undefined) {
      product.priceRange = dto.priceRange?.trim() ?? null;
    }
    if (dto.targetAudience !== undefined) {
      product.targetAudience = dto.targetAudience?.trim() ?? null;
    }
    if (dto.valueProposition !== undefined) {
      product.valueProposition = dto.valueProposition?.trim() ?? null;
    }
    if (dto.websiteUrl !== undefined) {
      product.websiteUrl = dto.websiteUrl?.trim() ?? null;
    }
    if (dto.keywords !== undefined) {
      product.keywords = dto.keywords;
    }
    if (dto.status !== undefined) {
      product.status = dto.status as ProductEntity['status'];
    }

    if (dto.isPrimary === true) {
      await this.clearPrimaryFlag(tenantId, id);
      product.isPrimary = true;
    } else if (dto.isPrimary === false && product.isPrimary) {
      product.isPrimary = false;
    }

    const saved = await this.products.save(product);
    return this.toResponse(saved);
  }

  async archive(tenantId: string, id: string): Promise<ProductResponseDto> {
    const product = await this.findOwnedProduct(tenantId, id);
    product.status = 'archived';
    if (product.isPrimary) {
      product.isPrimary = false;
    }
    const saved = await this.products.save(product);
    return this.toResponse(saved);
  }

  async bulkCreateFromNames(
    tenantId: string,
    dto: BulkCreateProductsDto,
  ): Promise<BulkCreateProductsResponseDto> {
    const names = [...new Set(dto.names.map((n: string) => n.trim()).filter(Boolean))] as string[];
    if (names.length === 0) {
      throw new BadRequestException({
        error: 'At least one product name is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const existing = await this.products.find({ where: { tenantId } });
    const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));
    const created: ProductResponseDto[] = [];
    let skipped = 0;

    const hasPrimary = existing.some((p) => p.isPrimary && p.status === 'active');

    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      if (existingNames.has(name.toLowerCase())) {
        skipped += 1;
        continue;
      }

      const slug = await this.resolveUniqueSlug(tenantId, name);
      const markPrimary =
        (dto.markFirstAsPrimary !== false && i === 0 && !hasPrimary && created.length === 0) ||
        (dto.markFirstAsPrimary === true && i === 0 && !hasPrimary);

      if (markPrimary) {
        await this.clearPrimaryFlag(tenantId);
      }

      const saved = await this.products.save(
        this.products.create({
          tenantId,
          name,
          slug,
          description: null,
          targetAudience: dto.defaultTargetAudience?.trim() ?? null,
          valueProposition: dto.defaultValueProposition?.trim() ?? null,
          keywords: [],
          status: 'active',
          isPrimary: markPrimary,
        }),
      );

      existingNames.add(name.toLowerCase());
      created.push(this.toResponse(saved));
    }

    return { created, skipped };
  }

  async bulkCreateFromText(
    tenantId: string,
    text: string,
    defaults?: { targetAudience?: string; valueProposition?: string },
  ): Promise<BulkCreateProductsResponseDto> {
    const names = parseProductNamesFromText(text);
    if (names.length === 0) {
      return { created: [], skipped: 0 };
    }

    return this.bulkCreateFromNames(tenantId, {
      names,
      defaultTargetAudience: defaults?.targetAudience,
      defaultValueProposition: defaults?.valueProposition,
      markFirstAsPrimary: true,
    });
  }

  private async findOwnedProduct(tenantId: string, id: string): Promise<ProductEntity> {
    const product = await this.products.findOne({ where: { id, tenantId } });
    if (!product) {
      throw new NotFoundException({
        error: 'Product not found',
        code: 'NOT_FOUND',
      });
    }
    return product;
  }

  private async resolveUniqueSlug(
    tenantId: string,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugifyProductName(name);
    let candidate = base;
    let suffix = 2;

    while (true) {
      const existing = await this.products.findOne({
        where: { tenantId, slug: candidate },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  private async clearPrimaryFlag(tenantId: string, exceptId?: string): Promise<void> {
    const qb = this.products
      .createQueryBuilder()
      .update(ProductEntity)
      .set({ isPrimary: false })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('is_primary = TRUE');

    if (exceptId) {
      qb.andWhere('id != :exceptId', { exceptId });
    }

    await qb.execute();
  }

  private toResponse(product: ProductEntity): ProductResponseDto {
    return {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      priceRange: product.priceRange,
      targetAudience: product.targetAudience,
      valueProposition: product.valueProposition,
      websiteUrl: product.websiteUrl,
      keywords: product.keywords ?? [],
      status: product.status,
      isPrimary: product.isPrimary,
      onboardingCompletionPercentage: calculateProductOnboardingCompletion(product),
      onboardingReady: isProductOnboardingReady(product),
      onboardingCompleted: isProductOnboardingCompleted(product),
      logoAssetId: getProductLogoAssetId(product.metadata),
      logoUrl: getProductLogoAssetId(product.metadata)
        ? `/api/v1/assets/${getProductLogoAssetId(product.metadata)}/file`
        : null,
      logoSourceUrl: getProductLogoSourceUrl(product.metadata),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
