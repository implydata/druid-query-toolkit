import { ComparisonExpression } from './comparisonExpression';
import { parens } from '../helpers';

export interface NotExpressionValue {
  parens: parens[];
  keyword: string | null;
  ex: any;
  spacing: string[][] | null;
}

export class NotExpression {
  public parens: parens[];
  public ex: any;
  public keyword: string | null;
  public spacing: string[][] | null;

  constructor(options: NotExpressionValue | any) {
    this.keyword = options.keyword ? options.keyword : null;
    this.parens = options.parens ? options.parens : [];
    this.ex = options.ex
      ? options.ex
      : new ComparisonExpression({ basicExpression: options.basicExpression });
    this.spacing = options.spacing ? options.spacing : null;
  }

  toString() {
    let val = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1].join(''));
    });
    val.push(
      (this.keyword ? this.keyword : '') +
        (this.spacing ? this.spacing[0].join('') : '') +
        this.ex.toString(),
    );
    this.parens.map(paren => {
      val.push(paren.close[0] + paren.close[1].join(''));
    });
    return val.join('');
  }

  getBasicValue(): string {
    return this.ex.getBasicValue();
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new NotExpression({
      parens: this.parens,
      ex: this.ex,
      spacing: this.spacing,
      keyword: this.keyword,
    });
  }
}
