import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { IpfsController } from './ipfs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [IpfsController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

