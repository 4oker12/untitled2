// app/backend/src/main.ts
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
// Swagger (совместимо с NestJS 10 + @nestjs/swagger 7.x)
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // базовые миддлвары
  app.use(cookieParser());
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // выбрасывает лишние поля
    forbidNonWhitelisted: true, // 400, если прислали поля вне DTO
    transform: true,            // преобразует типы по DTO
  }));

  // Swagger конфиг
  const config = new DocumentBuilder()
      .setTitle('Backend API')
      .setDescription('Auth & Users API (register/login/me, admin users)')
      .setVersion('1.0')
      .addCookieAuth('access_token') // токен у тебя в HttpOnly cookie
      .build();

  // Генерация схемы и роут /docs
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.BACKEND_PORT ?? 5000);
  await app.listen(port, '0.0.0.0');

  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`Swagger UI:         http://localhost:${port}/docs`);
}

bootstrap();

