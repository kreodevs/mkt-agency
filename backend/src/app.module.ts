import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { PostsModule } from './posts/posts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ActivitiesModule } from './activities/activities.module';
import { AlertsModule } from './alerts/alerts.module';
import { ChatModule } from './chat/chat.module';
import { TrialsModule } from './trials/trials.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'mktos-pg',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'mktos',
      password: process.env.DB_PASSWORD || 'mktos_secret',
      database: process.env.DB_NAME || 'mktos',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TenantsModule,
    ProductsModule,
    UsersModule,
    LeadsModule,
    PostsModule,
    CampaignsModule,
    ActivitiesModule,
    AlertsModule,
    ChatModule,
    TrialsModule,
    WebhooksModule,
  ],
})
export class AppModule {}