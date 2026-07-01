"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dotenv = require("dotenv");
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'https://*.vercel.app',
            process.env.FRONTEND_URL || '*',
        ],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true }));
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/api/v1/health', (_req, res) => {
        res.json({
            status: 'ok',
            version: '1.0.0',
            service: 'WCOS Backend',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development',
        });
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Web3 Creator Operating System (WCOS) Backend')
        .setDescription('WCOS API gateway — AI Studio, Collections, Marketplace, DeFi, DAO, Analytics, Profile')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`WCOS Backend API gateway running on: http://0.0.0.0:${port}`);
    console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
    console.log(`Health check: http://localhost:${port}/api/v1/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map