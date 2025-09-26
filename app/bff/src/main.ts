import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  // Глобальные парсеры тела — чтобы Apollo видел req.body
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS для фронта (Vite по умолчанию 5173)
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  const port = Number(process.env.BFF_PORT || 4000);
  await app.listen(port);
  console.log(`[BFF] http://localhost:${port}/graphql`);
  console.log('[BFF] BACKEND_URL =', process.env.BACKEND_URL);
}
bootstrap();
