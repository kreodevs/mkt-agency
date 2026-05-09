import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // No global prefix — Dokploy manages routing with strip prefix
  // app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve uploaded files
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  // Serve frontend in production (from Docker build)
  const frontendPath = join(process.cwd(), 'public');
  if (existsSync(frontendPath)) {
    app.useStaticAssets(frontendPath);

    // Catch-all: serve index.html for client-side routing
    const indexHtml = join(frontendPath, 'index.html');
    app.use('*', (_req: any, res: any) => {
      if (existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      }
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`MktAgencyOS running on port ${port}`);
}
bootstrap();
