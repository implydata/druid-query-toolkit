import { AndExpression } from './andExpression';
import { parens } from '../helpers';

export interface OrExpressionValue {
  parens: parens[];
  ex: OrPart[];
  spacing: string[][] | null;
}

export class OrExpression {
  public parens: parens[];
  public ex: OrPart[];
  public spacing: string[][] | null;

  constructor(options: OrExpressionValue | any) {
    this.parens = options.parens ? options.parens : [];
    this.ex = options.ex
      ? options.ex
      : [
          new OrPart({
            ex: new AndExpression({ basicExpression: options.basicExpression }),
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

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new OrExpression({ parens: this.parens, ex: this.ex, spacing: this.spacing });
  }

  getBasicValue(): string {
    // @ts-ignore
    return this.ex[0].ex.getBasicValue();
  }
}

export interface OrPartValue {
  ex: AndExpression;
  keyword: string;
  spacing: string[][];
}

export class OrPart {
  public ex: AndExpression;
  public keyword: string;
  public spacing: string[][];

  constructor(options: OrPartValue) {
    this.ex = options.ex;
    this.keyword = options.keyword;
    this.spacing = options.spacing;
  }

  toString() {
    return (this.keyword ? this.keyword : '') + this.spacing[0].join('') + this.ex.toString();
  }
}
