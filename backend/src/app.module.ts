import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
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
import { SeoPagesModule } from './seo-pages/seo-pages.module';
import { CompetitorsModule } from './competitors/competitors.module';
import { SeoRankingsModule } from './seo-rankings/seo-rankings.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SettingsModule } from './settings/settings.module';
import { AiModule } from './ai/ai.module';
import { ProposalsModule } from './proposals/proposals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
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
    SeoPagesModule,
    CompetitorsModule,
    SeoRankingsModule,
    OnboardingModule,
    SettingsModule,
    ProposalsModule,
    AiModule,
  ],
})
export class AppModule {}