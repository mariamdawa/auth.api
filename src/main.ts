import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppConfig } from './base/app-config/app.config';
import { AppModule } from './base/app.module';
import { LoggerAdapter } from './common/logger/adapter/logger.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerAdapter);
  const appConfig = app.get(AppConfig);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Authentication API')
    .setDescription(
      'A robust and secure authentication service built with NestJS.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Validation global pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //	Strip unknown properties
      transform: true, //Convert inputs to expected DTO types
    }),
  );

  process.on('unhandledRejection', (reason: any) => {
    const message =
      reason instanceof Error ? reason.message : JSON.stringify(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger.error(
      `Unhandled Rejection: ${message}`,
      stack,
      'UnhandledRejection',
    );
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error(
      `Uncaught Exception: ${error.message}`,
      error.stack,
      'UncaughtException',
    );
  });

  // CORS
  app.enableCors({
    origin: '*',
  });

  app.use(helmet()); // Sets various HTTP headers to secure the app from common vulnerabilities

  await app
    .listen(
      appConfig.config?.server?.port ?? 3000,
      appConfig.config?.server?.host ?? '127.0.0.1',
    )
    .then(async () => {
      const url = await app.getUrl();
      console.log(`Server  running on ${url}`);
      console.log(`Swagger running on ${url}/api`);
    });
}
bootstrap();
