import { OrExpression } from '../..';
import { parens } from '../helpers';

export interface ExpressionMaybeFilteredValue {
  parens: parens[];
  ex: OrExpression | string;
  filter: any;
  spacing: string[][];
}

export class ExpressionMaybeFiltered {
  public parens: parens[];
  public ex: OrExpression | string;
  public filter: any;
  public spacing: string[][];

  constructor(options: ExpressionMaybeFilteredValue) {
    this.parens = options.parens;
    this.ex = options.ex;
    this.filter = options.filter;
    this.spacing = options.spacing;
  }

  toString() {
    let val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + (paren.open[1] ? paren.open[1].join('') : ''));
    });
    val.push(this.ex === '*' ? '*' : this.ex.toString());
    this.parens.map(paren => {
      val.push((paren.close[0] ? paren.close[0].join('') : '') + paren.close[1]);
    });
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new ExpressionMaybeFiltered({
      parens: this.parens,
      ex: this.ex,
      filter: this.filter,
      spacing: this.spacing,
    });
  }
}
