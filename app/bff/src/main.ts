import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Разрешаем фронт (Vite) и куки
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  const port = process.env.BFF_PORT ? Number(process.env.BFF_PORT) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`BFF listening on http://localhost:${port}/graphql`);
}
bootstrap();
