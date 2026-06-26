export class CreateSuperadminCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
  ) {}
}

export interface CreateSuperadminResult {
  id: string;
  email: string;
  name: string;
  isSuperadmin: true;
}
