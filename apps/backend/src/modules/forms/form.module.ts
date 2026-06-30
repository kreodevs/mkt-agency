import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { CrmModule } from '../crm/crm.module';
import { ProductModule } from '../product/product.module';
import { FormSubmissionEntity } from './infrastructure/typeorm/form-submission.entity';
import { FormEntity } from './infrastructure/typeorm/form.entity';
import { FormController } from './form.controller';
import { FormService } from './form.service';

@Module({
  imports: [
    AuthSharedModule,
    CrmModule,
    ProductModule,
    TypeOrmModule.forFeature([FormEntity, FormSubmissionEntity]),
  ],
  controllers: [FormController],
  providers: [FormService],
  exports: [FormService],
})
export class FormsModule {}
