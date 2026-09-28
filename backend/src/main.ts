import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  configureApp(app);
  const configService = app.get(ConfigService);

  const frontendDir = configService.get<string>('FRONTEND_DIR');
  if (frontendDir) {
    const root = resolve(frontendDir);
    const index = join(root, 'index.html');
    if (existsSync(index)) {
      app.useStaticAssets(root, { index: false });
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET' || req.path.startsWith('/api')) {
          next();
          return;
        }
        res.sendFile(index);
      });
    }
  }

  const port = Number(configService.get<string>('PORT') ?? 3000);
  await app.listen(port);
}
void bootstrap();
