export class AddInteractionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly leadId: string,
    public readonly type: string,
    public readonly description?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}
