import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('product_settings')
export class ProductSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  // X/Twitter credentials (stored encrypted in production, plain for now)
  @Column({ nullable: true })
  xApiKey: string;

  @Column({ nullable: true })
  xApiSecret: string;

  @Column({ nullable: true })
  xAccessToken: string;

  @Column({ nullable: true })
  xAccessSecret: string;

  // Google Ads
  @Column({ nullable: true })
  googleAdsDeveloperToken: string;

  @Column({ nullable: true })
  googleAdsClientId: string;

  @Column({ nullable: true })
  googleAdsClientSecret: string;

  // WhatsApp
  @Column({ nullable: true })
  whatsappPhoneNumberId: string;

  @Column({ nullable: true })
  whatsappToken: string;

  // Brand
  @Column({ nullable: true })
  logoUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  brandAssets: { name: string; url: string; type: string }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
