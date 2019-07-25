import { MultiplicativeExpression } from './multipilcativeExpression';
import { parens } from '../helpers';

export interface AdditiveExpressionValue {
  parens: parens[];
  op: string[] | null;
  ex: any;
  spacing: any[][];
}

export class AdditiveExpression {
  public parens: parens[];
  public ex: any;
  public op: string[] | null;
  public spacing: any[][];

  constructor(options: AdditiveExpressionValue | any) {
    this.parens = options.parens ? options.parens : [];
    this.op = options.op ? options.op : null;
    this.ex = options.ex
      ? options.ex
      : [new MultiplicativeExpression({ basicExpression: options.basicExpression })];
    this.spacing = options.spacing ? options.spacing : [['']];
  }

  toString() {
    let val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1].join(''));
    });
    this.ex.map((ex: any, index: number) => {
      val.push(ex.toString());
      if (index > 0) {
        val.push(
          this.spacing[index][0].join('') +
            this.spacing[index][1] +
            this.spacing[index][2].join(''),
        );
      }
    });
    this.parens.map(paren => {
      val.push(paren.close[0] + paren.close[1].join(''));
    });
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new AdditiveExpression({
      parens: this.parens,
      ex: this.ex,
      spacing: this.spacing,
      op: this.op,
    });
  }

  getBasicValue(): string {
    return this.ex[0].getBasicValue();
  }

  // addFilter(column: string, value: any): SqlQuery {
  //   // ToDo:
  // }
}
