export class DeleteLeadCommand {
  constructor(
    public readonly tenantId: string,
    public readonly leadId: string,
  ) {}
}
