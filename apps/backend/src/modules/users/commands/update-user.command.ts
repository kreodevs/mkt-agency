export class UpdateUserProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly ipAddress: string | null = null,
    public readonly tenantId: string | null = null,
  ) {}
}
