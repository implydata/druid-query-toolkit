import { NotExpression } from './notExpression';
import { parens } from '../helpers';

export interface AndExpressionValue {
  parens: parens[];
  ex: AndPart[];
  spacing: string[][] | null;
}

export class AndExpression {
  public parens: parens[];
  public ex: AndPart[];
  public spacing: string[][] | null;

  constructor(options: AndExpressionValue | any) {
    this.parens = options.parens ? options.parens : [];
    this.ex = options.ex
      ? options.ex
      : [
          new AndPart({
            ex: new NotExpression({ basicExpression: options.basicExpression }),
            keyword: '',
            spacing: [['']],
          }),
        ];
    this.spacing = options.spacing ? options.spacing : null;
  }

  toString() {
    let val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1].join(''));
    });
    this.ex.map((part, index: number) => {
      if (index !== 0 && this.spacing) {
        val.push(this.spacing[index - 1].join(''));
      }
      val.push(part.toString());
    });
    this.parens.map(paren => {
      val.push(paren.close[0] + paren.close[1].join(''));
    });
    return val.join('');
  }

  getBasicValue(): string {
    return this.ex[0].ex.getBasicValue();
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new AndExpression({ parens: this.parens, ex: this.ex, spacing: this.spacing });
  }
  // addFilter(column: string, value: any): SqlQuery {
  //   // ToDo:
  // }
}

export interface AndPartValue {
  keyword: string;
  ex: NotExpression;
  spacing: string[][];
}

export class AndPart {
  public ex: NotExpression;
  public keyword: string;
  public spacing: string[][];

  constructor(options: AndPartValue) {
    this.ex = options.ex;
    this.keyword = options.keyword;
    this.spacing = options.spacing;
  }

  toString() {
    return (this.keyword ? this.keyword : '') + this.spacing[0].join('') + this.ex.toString();
  }

  getBasicValue(): string {
    return this.ex.getBasicValue();
  }
  // addFilter(column: string, value: any): SqlQuery {
  //   // ToDo:
  // }
}
