import { OrExpression } from '../..';

export interface SubValue {
  ex: OrExpression | any;
  spacing: string[][];
}

export class Sub {
  public ex: OrExpression | any;
  public spacing: string[][];

  constructor(options: SubValue) {
    this.ex = options.ex;
    this.spacing = options.spacing;
  }

  toString(): string {
    return '(' + this.spacing[0].join('') + this.ex.toString() + this.spacing[1].join('') + ')';
  }

  getBasicValue() {
    return this.ex.getBasicValue();
  }
}
