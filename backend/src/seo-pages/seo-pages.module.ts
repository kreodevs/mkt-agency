import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoPagesController } from './seo-pages.controller';
import { SeoPagesService } from './seo-pages.service';
import { SeoPage } from './entities/seo-page.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeoPage])],
  controllers: [SeoPagesController],
  providers: [SeoPagesService],
  exports: [SeoPagesService],
})
export class SeoPagesModule {}
