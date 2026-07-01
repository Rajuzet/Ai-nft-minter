import { Module } from '@nestjs/common';
import { DefiController } from './defi.controller';
import { DefiService } from './defi.service';

@Module({
  controllers: [DefiController],
  providers: [DefiService],
  exports: [DefiService],
})
export class DefiModule {}
