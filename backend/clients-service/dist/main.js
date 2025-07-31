"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Service de Gestion des Clients - Cyber Café')
        .setDescription('API pour la gestion des clients et comptes du cyber café')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    app.setGlobalPrefix('api/v1');
    const port = process.env.CLIENTS_SERVICE_PORT || 8002;
    await app.listen(port);
    console.log(`🚀 Service de gestion des clients démarré sur le port ${port}`);
    console.log(`📚 Documentation disponible sur http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map