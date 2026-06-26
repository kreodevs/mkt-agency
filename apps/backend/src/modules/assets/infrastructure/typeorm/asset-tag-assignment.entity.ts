import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';
import { AssetTagEntity } from './asset-tag.entity';

@Entity({ name: 'asset_tag_assignments' })
export class AssetTagAssignmentEntity {
  @PrimaryColumn({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset!: AssetEntity;

  @ManyToOne(() => AssetTagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: AssetTagEntity;
}
