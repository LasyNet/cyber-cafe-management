import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Service de Gestion des Clients - Cyber Café')
    .setDescription('API pour la gestion des clients et comptes du cyber café')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Préfixe global pour l'API
  app.setGlobalPrefix('api/v1');

  const port = process.env.CLIENTS_SERVICE_PORT || 8002;
  await app.listen(port);
  
  console.log(`🚀 Service de gestion des clients démarré sur le port ${port}`);
  console.log(`📚 Documentation disponible sur http://localhost:${port}/docs`);
}

bootstrap(); 