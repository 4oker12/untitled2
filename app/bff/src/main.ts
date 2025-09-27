// app/bff/src/main.ts
import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {
  json,
  urlencoded,
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from 'express';

import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

// Совместимо и с default- и c *-импортом модуля playground
import playgroundPkg from 'graphql-playground-middleware-express';
const expressPlayground: any = (playgroundPkg as any).default || (playgroundPkg as any);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальные парсеры
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // CORS (фронт на 5173)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Underlying Express-приложение
  const server = app.getHttpAdapter().getInstance() as unknown as Application;

  // Лог заходов на /graphql (для дебага)
  server.use('/graphql', (req: Request, _res: Response, next: NextFunction) => {
    console.log('Incoming /graphql', req.method, req.headers['content-type']);
    next();
  });

  // 💥 Надёжный парсинг тела на /graphql при любом Content-Type
  server.use('/graphql', bodyParser.json({ limit: '10mb', type: '*/*' }));
  server.use('/graphql', bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  // 🧰 Классический GraphQL Playground (как раньше)
  // Открывай: http://localhost:4000/playground
  server.get('/playground', expressPlayground({ endpoint: '/graphql' }));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, () => {
    console.log(`[BFF] GraphQL:    http://localhost:${port}/graphql    (Apollo Sandbox)`);
    console.log(`[BFF] Playground: http://localhost:${port}/playground (Classic UI)`);
    console.log(`[BFF] BACKEND_URL = ${process.env.BACKEND_URL}`);
  });
}

bootstrap();

