import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);

  try {
    const seedService = appContext.get(SeedService);
    await seedService.seedIfEmpty();
  } finally {
    await appContext.close();
  }
}

bootstrap().catch((error) => {
  console.error('Seeding failed', error);
  process.exit(1);
});
