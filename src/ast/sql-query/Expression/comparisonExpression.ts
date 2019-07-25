import { AdditiveExpression } from './additiveExpression';
import { parens } from '../helpers';

export interface ComparisonExpressionValue {
  parens: parens[];
  rhs: ComparisonExpressionRhs | null;
  ex: any;
  spacing: string[][] | null;
}

export interface ComparisonExpressionRhsValue {
  parens: parens[];
  op: string | null;
  is: string | null;
  not: string | null;
  rhs: any;
  spacing: string[][];
}

export class ComparisonExpression {
  public parens: parens[];
  public ex: any;
  public rhs: ComparisonExpressionRhs | null;
  public spacing: string[][] | null;

  constructor(options: ComparisonExpressionValue | any) {
    this.rhs = options.rhs ? options.rhs : null;
    this.parens = options.parens ? options.parens : [];
    this.ex = options.ex
      ? options.ex
      : new AdditiveExpression({ basicExpression: options.basicExpression });
    this.spacing = options.spacing ? options.spacing : [null];
  }

  toString() {
    let val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1].join(''));
    });
    val.push(this.ex.toString());
    if (this.rhs && this.spacing) {
      val.push((this.spacing[0] ? this.spacing[0] : '') + this.rhs.toString());
    }
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
    return new ComparisonExpression({
      parens: this.parens,
      ex: this.ex,
      spacing: this.spacing,
      rhs: this.rhs,
    });
  }

  // addFilter(column: string, value: any): SqlQuery {
  //   // ToDo:
  // }
}

export class ComparisonExpressionRhs {
  public parens: parens[];
  public op: string | null;
  public is: string | null;
  public not: string | null;
  public rhs: any;
  public spacing: string[][];

  constructor(options: ComparisonExpressionRhsValue) {
    this.rhs = options.rhs;
    this.parens = options.parens;
    this.op = options.op;
    this.is = options.is;
    this.not = options.not;
    this.spacing = options.spacing;
  }

  toString() {
    let val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1].join(''));
    });
    if (this.is) {
      if (this.not) {
        val.push(
          this.is +
            this.spacing[0].join('') +
            this.not +
            this.spacing[1].join('') +
            this.rhs.toString(),
        );
      } else {
        val.push(this.is + (this.spacing[0] ? this.spacing[0].join('') : '') + this.rhs.toString());
      }
    } else if (this.op) {
      if (this.not) {
        val.push(
          this.op +
            this.spacing[0].join('') +
            this.not +
            this.spacing[1].join('') +
            this.rhs.toString(),
        );
      } else {
        val.push(this.op + (this.spacing[0] ? this.spacing[0].join('') : '') + this.rhs.toString());
      }
    } else {
      val.push(this.not + (this.spacing[0] ? this.spacing[0].join('') : '') + this.rhs.toString());
    }
    if (this.is) {
      val.push(this.is + (this.spacing[0] ? this.spacing[0].join('') : '') + this.rhs.toString());
    }
    this.parens.map(paren => {
      val.push(paren.close[0] + paren.close[1].join(''));
    });
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new ComparisonExpressionRhs({
      parens: this.parens,
      op: this.op,
      is: this.is,
      not: this.not,
      rhs: this.rhs,
      spacing: this.spacing,
    });
  }

  // addFilter(column: string, value: any): SqlQuery {
  //   // ToDo:
  // }
}
