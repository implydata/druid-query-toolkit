export class Integer {
  public value: number;

  constructor(options: number) {
    this.value = options;
  }

  toString(): string {
    return this.value.toString();
  }

  getBasicValue() {
    return this.value;
  }
}
