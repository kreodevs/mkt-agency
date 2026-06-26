export class DeleteAssetCommand {
  constructor(
    public readonly tenantId: string,
    public readonly assetId: string,
  ) {}
}
