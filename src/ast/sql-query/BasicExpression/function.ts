import { parens } from '../helpers';

export interface FunctionValue {
  parens: parens[];
  fn: any;
  value: any[];
  spacing: any[];
  distinct: any;
}

export class Function {
  public parens: parens[];
  public fn: any;
  public value: any[];
  public spacing: any[];
  public distinct: any;

  constructor(options: FunctionValue) {
    this.parens = options.parens;
    this.fn = options.fn;
    this.value = options.value;
    this.spacing = options.spacing;
    this.distinct = options.distinct;
  }

  toString() {
    let val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + (paren.open[1] ? paren.open[1].join('') : ''));
    });
    val.push(this.fn + '(' + (this.spacing[0] ? this.spacing[0].join('') : ''));
    if (this.distinct) {
      val.push(this.distinct[0] + this.distinct[1].join(''));
    }
    this.value.map((value, index: number) => {
      val.push(value.toString());
      if (index !== 0) {
        val.push(',' + this.spacing[1][index].join(''));
      }
    });
    val.push((this.spacing[2] ? this.spacing[2].join('') : '') + ')');
    this.parens.map(paren => {
      val.push((paren.close[0] ? paren.close[0].join('') : '') + paren.close[1]);
    });
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new Function({
      parens: this.parens,
      fn: this.fn,
      value: this.value,
      spacing: this.spacing,
      distinct: this.distinct,
    });
  }
}
