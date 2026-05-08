import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({ ...dto, tenantId });
    return this.productRepo.save(product);
  }

  async findAll(tenantId: string): Promise<Product[]> {
    return this.productRepo.find({ where: { tenantId, isActive: true } });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.productRepo.update(id, data);
    return this.findOne(id);
  }
}