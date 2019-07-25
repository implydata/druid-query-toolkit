export interface StringValue {
  chars: string;
  quote: string;
  spacing: string[][];
}

export class String {
  public chars: string;
  public quote: string;
  public spacing: string[][];

  constructor(options: StringValue) {
    this.chars = options.chars;
    this.quote = options.quote;
    this.spacing = options.spacing;
  }

  toString(): string {
    return (
      this.quote +
      (this.spacing[0] ? this.spacing[0].join('') : '') +
      this.chars +
      (this.spacing[0] ? this.spacing[1].join('') : '') +
      this.quote
    );
  }

  getBasicValue(): string {
    return this.chars;
  }
}
