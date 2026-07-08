import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { AssetEntity } from '../assets/infrastructure/typeorm/asset.entity';
import {
  COMPOSE_IMAGE_ROLE_PRIORITY,
  PRODUCT_MEDIA_ROLES,
  type ProductMediaRole,
} from './domain/product-media-kit.constants';
import {
  AddProductMediaKitItemDto,
  ProductMediaKitItemResponseDto,
  ProductMediaKitListResponseDto,
} from './dto/product-media-kit.dto';
import { ProductMediaKitItemEntity } from './infrastructure/typeorm/product-media-kit-item.entity';
import { ProductService } from './product.service';
import type { ContentVisualFormat } from '../content/domain/content.constants';

@Injectable()
export class ProductMediaKitService {
  constructor(
    @InjectRepository(ProductMediaKitItemEntity)
    private readonly kitItems: Repository<ProductMediaKitItemEntity>,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
    private readonly assetService: AssetService,
    private readonly productService: ProductService,
  ) {}

  async listForProduct(
    tenantId: string,
    productId: string,
  ): Promise<ProductMediaKitListResponseDto> {
    await this.productService.findOwnedEntity(tenantId, productId);

    const items = await this.kitItems.find({
      where: { tenantId, productId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const assetIds = items.map((item) => item.assetId);
    const assetMap = await this.loadAssetsMap(tenantId, assetIds);

    return {
      items: items
        .map((item) => this.toResponse(item, assetMap.get(item.assetId)))
        .filter((item): item is ProductMediaKitItemResponseDto => item !== null),
      total: items.length,
    };
  }

  async uploadToKit(
    tenantId: string,
    productId: string,
    file: Express.Multer.File,
    role: ProductMediaRole,
    label?: string,
  ): Promise<ProductMediaKitItemResponseDto> {
    await this.productService.findOwnedEntity(tenantId, productId);
    this.assertValidRole(role);

    const uploaded = await this.assetService.upload(tenantId, file);
    return this.linkAsset(tenantId, productId, {
      assetId: uploaded.id,
      role,
      label,
    });
  }

  async linkAsset(
    tenantId: string,
    productId: string,
    dto: AddProductMediaKitItemDto,
  ): Promise<ProductMediaKitItemResponseDto> {
    await this.productService.findOwnedEntity(tenantId, productId);
    this.assertValidRole(dto.role);

    const asset = await this.assets.findOne({
      where: { id: dto.assetId, tenantId },
    });
    if (!asset) {
      throw new NotFoundException({ error: 'Asset not found', code: 'NOT_FOUND' });
    }

    const existing = await this.kitItems.findOne({
      where: { productId, assetId: dto.assetId },
    });
    if (existing) {
      throw new BadRequestException({
        error: 'Este archivo ya está en el kit del producto',
        code: 'DUPLICATE_KIT_ITEM',
      });
    }

    const count = await this.kitItems.count({ where: { tenantId, productId } });
    const saved = await this.kitItems.save(
      this.kitItems.create({
        tenantId,
        productId,
        assetId: dto.assetId,
        role: dto.role,
        label: dto.label?.trim() || null,
        sortOrder: count,
      }),
    );

    return this.toResponse(saved, asset)!;
  }

  async removeFromKit(
    tenantId: string,
    productId: string,
    itemId: string,
  ): Promise<void> {
    await this.productService.findOwnedEntity(tenantId, productId);
    const item = await this.kitItems.findOne({
      where: { id: itemId, tenantId, productId },
    });
    if (!item) {
      throw new NotFoundException({ error: 'Kit item not found', code: 'NOT_FOUND' });
    }
    await this.kitItems.remove(item);
  }

  async listEntitiesForProduct(
    tenantId: string,
    productId: string,
  ): Promise<ProductMediaKitItemEntity[]> {
    return this.kitItems.find({
      where: { tenantId, productId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  pickVideoAssetId(
    kit: ProductMediaKitItemEntity[],
    postIndex: number,
  ): string | null {
    const demoItems = kit.filter((item) => item.role === 'product-demo');
    if (!demoItems.length) {
      return null;
    }
    return demoItems[postIndex % demoItems.length].assetId;
  }

  async pickImageAssetIdsForCompose(
    tenantId: string,
    kit: ProductMediaKitItemEntity[],
    visualFormat: ContentVisualFormat,
    postIndex: number,
  ): Promise<string[]> {
    const assetIds = kit.map((item) => item.assetId);
    const assets = assetIds.length
      ? await this.assets.find({ where: { tenantId, id: In(assetIds) } })
      : [];
    const imageAssetIds = new Set(
      assets.filter((asset) => asset.type === 'image').map((asset) => asset.id),
    );

    const images = this.filterByRoles(kit, COMPOSE_IMAGE_ROLE_PRIORITY).filter((item) =>
      imageAssetIds.has(item.assetId),
    );
    if (!images.length) {
      return [];
    }

    if (visualFormat === 'carousel') {
      const start = postIndex % images.length;
      const picked: string[] = [];
      for (let i = 0; i < Math.min(3, images.length); i += 1) {
        picked.push(images[(start + i) % images.length].assetId);
      }
      return picked;
    }

    return [images[postIndex % images.length].assetId];
  }

  private filterByRoles(
    kit: ProductMediaKitItemEntity[],
    rolePriority: ProductMediaRole[],
  ): ProductMediaKitItemEntity[] {
    const byRole = new Map<ProductMediaRole, ProductMediaKitItemEntity[]>();
    for (const item of kit) {
      if (!PRODUCT_MEDIA_ROLES.includes(item.role)) {
        continue;
      }
      const list = byRole.get(item.role) ?? [];
      list.push(item);
      byRole.set(item.role, list);
    }

    const ordered: ProductMediaKitItemEntity[] = [];
    for (const role of rolePriority) {
      ordered.push(...(byRole.get(role) ?? []));
    }
    return ordered;
  }

  private async loadAssetsMap(
    tenantId: string,
    assetIds: string[],
  ): Promise<Map<string, AssetEntity>> {
    if (!assetIds.length) {
      return new Map();
    }
    const rows = await this.assets.find({
      where: { tenantId, id: In(assetIds) },
    });
    return new Map(rows.map((row) => [row.id, row]));
  }

  private toResponse(
    item: ProductMediaKitItemEntity,
    asset?: AssetEntity | null,
  ): ProductMediaKitItemResponseDto | null {
    if (!asset) {
      return null;
    }
    return {
      id: item.id,
      productId: item.productId,
      assetId: item.assetId,
      role: item.role,
      label: item.label,
      sortOrder: item.sortOrder,
      assetName: asset.name,
      assetType: asset.type,
      mimeType: asset.mimeType,
      url: asset.url,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private assertValidRole(role: string): asserts role is ProductMediaRole {
    if (!PRODUCT_MEDIA_ROLES.includes(role as ProductMediaRole)) {
      throw new BadRequestException({
        error: 'Invalid media kit role',
        code: 'VALIDATION_ERROR',
      });
    }
  }
}
