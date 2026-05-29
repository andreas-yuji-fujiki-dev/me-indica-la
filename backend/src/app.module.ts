import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { CategoryModule } from './modules/category/category.module';
import { ServiceModule } from './modules/service/service.module';
import { ProviderModule } from './modules/provider/provider.module';
import { UserModule } from './modules/user/user.module';
import { CityModule } from './modules/city/city.module';
import { ReviewModule } from './modules/review/review.module';
import { AdModule } from './modules/ad/ad.module';
import { EventModule } from './modules/event/event.module';
import { ProviderRequestModule } from './modules/provider-request/provider-request.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { SearchModule } from './modules/search/search.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { SecurityModule } from './modules/security/security.module';
import { ProviderEditRequestModule } from './modules/provider-edit-request/provider-edit-request.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
    SecurityModule,        // Rate limiting global
    AuthModule,            // RBAC global
    PrismaModule,
    CategoryModule,
    ServiceModule,
    ProviderModule,
    UserModule,
    CityModule,
    ReviewModule,
    AdModule,
    EventModule,
    ProviderRequestModule,
    FavoriteModule,
    SearchModule,
    DashboardModule,
    ProviderEditRequestModule,
  ],
  providers: [AppService],
})
export class AppModule {}
