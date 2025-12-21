import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap the Nest application', error);
  process.exit(1);
});
