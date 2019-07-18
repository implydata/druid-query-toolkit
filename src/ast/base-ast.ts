export abstract class BaseAst {
  public type: string;

  constructor(type: string) {
    this.type = type;
  }

  abstract toString(indent?: string): string;
}
