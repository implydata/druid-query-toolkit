import { OrExpression } from '../..';
import { parens, renderCloseParens, renderOpenParens } from '../helpers';

export interface CaseExpressionValue {
  parens: parens[];
  keyword: string;
  expr: any;
  cases: CasePart[];
  else: any[];
  end: string[];
}

export class CaseExpression {
  public parens: parens[];
  public keyword: string;
  public expr: any;
  public cases: CasePart[];
  public else: any[];
  public end: any[];

  constructor(options: CaseExpressionValue) {
    this.parens = options.parens;
    this.keyword = options.keyword;
    this.expr = options.expr;
    this.cases = options.cases;
    this.else = options.else;
    this.end = options.end;
  }

  toString() {
    let val: string[] = [];
    val.push(renderOpenParens(this.parens));
    val.push(this.keyword + (this.expr ? this.expr[0].join('') + this.expr[2].toString() : ''));
    this.cases.map((caseValue: any) => {
      val.push(caseValue[0].join('') + caseValue[1].toString());
    });
    val.push(this.else[0].join('') + this.else[1] + this.else[2] + this.else[3].toString());
    val.push(this.end[0].join('') + this.end[1]);
    val.push(renderCloseParens(this.parens));
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new CaseExpression({
      parens: this.parens,
      keyword: this.keyword,
      expr: this.expr,
      cases: this.cases,
      else: this.else,
      end: this.end,
    });
  }
}

export interface CaseValue {
  whenKeyword: string;
  whenExpr: OrExpression;
  thenKeyword: string;
  thenExpr: OrExpression;
  spacing: string[][];
}

export class CasePart {
  public whenKeyword: string;
  public whenExpr: OrExpression;
  public thenKeyword: string;
  public thenExpr: OrExpression;
  public spacing: string[][];

  constructor(options: CaseValue) {
    this.whenKeyword = options.whenKeyword;
    this.whenExpr = options.whenExpr;
    this.thenKeyword = options.thenKeyword;
    this.thenExpr = options.thenExpr;
    this.spacing = options.spacing;
  }

  toString() {
    return (
      this.whenKeyword +
      this.spacing[0].join('') +
      this.whenExpr.toString() +
      this.spacing[1].join('') +
      this.thenKeyword +
      this.spacing[2].join('') +
      this.thenExpr.toString()
    );
  }
}
