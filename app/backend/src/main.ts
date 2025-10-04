// app/backend/src/main.ts
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({ origin: true, credentials: true });
    app.use(cookieParser());
    app.use(helmet());
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true, // <-- ВКЛЮЧАЕМ преобразование типов (строка -> число)
        transformOptions: { enableImplicitConversion: true },
    }));

    const config = new DocumentBuilder()
        .setTitle('API')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                in: 'header',
                name: 'Authorization',
                description: 'Paste raw JWT here (without "Bearer ")',
            },
            'access-token',
        )
        .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie' }, 'cookie-auth')
        .build();

    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc, { swaggerOptions: { persistAuthorization: true } });

    const port = Number(process.env.BACKEND_PORT ?? 5000);
    await app.listen(port, '0.0.0.0');

    console.log(`Backend listening on http://localhost:${port}`);
    console.log(`Swagger UI:         http://localhost:${port}/docs`);
}
bootstrap();
