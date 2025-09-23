// src/main.ts  [BFF]
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './modules/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // CORS для Vite dev server
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  const port = Number(process.env.BFF_PORT ?? 4000); // [ADDED] порт BFF по умолчанию 4000
  await app.listen(port, '0.0.0.0');
  console.log(`BFF listening on http://localhost:${port}`);
  console.log(`GraphQL:             http://localhost:${port}/graphql`);
}
bootstrap();
