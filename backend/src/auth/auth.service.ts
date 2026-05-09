import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantUser } from '../users/entities/tenant-user.entity';
import { Product } from '../products/entities/product.entity';
import { LoginDto, RegisterDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepo: Repository<TenantUser>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya está registrado');

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: this.hashPassword(dto.password),
      isSuperAdmin: true,
    });
    await this.userRepo.save(user);

    const tenant = this.tenantRepo.create({ name: dto.tenantName, ownerId: user.id });
    await this.tenantRepo.save(tenant);

    const defaultProduct = this.productRepo.create({
      tenantId: tenant.id,
      name: 'Producto Principal',
      type: 'saas',
    });
    await this.productRepo.save(defaultProduct);

    const tenantUser = this.tenantUserRepo.create({
      tenantId: tenant.id,
      userId: user.id,
      role: 'admin',
    });
    await this.tenantUserRepo.save(tenantUser);

    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || user.password !== this.hashPassword(dto.password)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.buildResponse(user);
  }

  async hasUsers(): Promise<{ hasUsers: boolean }> {
    const count = await this.userRepo.count();
    return { hasUsers: count > 0 };
  }

  async setup(dto: RegisterDto) {
    const count = await this.userRepo.count();
    if (count > 0) {
      throw new ConflictException('Ya existe un administrador. Usa el login.');
    }
    return this.register(dto);
  }

  private async buildResponse(user: User) {
    const tenantUsers = await this.tenantUserRepo.find({
      where: { userId: user.id },
      relations: ['tenant'],
    });

    const tenants = await Promise.all(
      tenantUsers.map(async (tu) => {
        const products = await this.productRepo.find({
          where: { tenantId: tu.tenantId, isActive: true },
        });
        return {
          id: tu.tenant.id,
          name: tu.tenant.name,
          role: tu.role,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
          })),
        };
      }),
    );

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        tenants,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId, isActive: true } });
  }
}