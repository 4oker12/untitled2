import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.use(helmet());
  app.use(cookieParser());
  app.use(json({ limit: '10kb' }));

  const port = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 5000;

  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}
bootstrap();
