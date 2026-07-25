import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AssetSchema } from '../../common/storage/schemas';
import { AssetService } from './asset.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Asset', schema: AssetSchema }]),
  ],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetsModule {}
