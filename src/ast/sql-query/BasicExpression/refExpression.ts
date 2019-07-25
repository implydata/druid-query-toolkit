export interface RefExpressionValue {
  namespace: string;
  name: string;
}

export class RefExpression {
  public namespace: string;
  public name: string;

  constructor(options: RefExpressionValue) {
    this.namespace = options.namespace;
    this.name = options.name;
  }

  toString(): string {
    if (this.namespace) {
      return this.namespace + '.' + this.name;
    }
    return this.name;
  }

  getBasicValue(): string {
    return this.toString();
  }
}
