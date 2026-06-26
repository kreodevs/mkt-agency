export class SubmitFormCommand {
  constructor(
    public readonly formId: string,
    public readonly payload: Record<string, unknown>,
  ) {}
}
