import { OrExpression } from '../..';

export interface HavingClauseValue {
  keyword: string;
  having: OrExpression;
  spacing: string[][];
}

export class HavingClause {
  public keyword: string;
  public having: OrExpression;
  public spacing: string[][];

  constructor(options: HavingClauseValue) {
    this.keyword = options.keyword;
    this.having = options.having;
    this.spacing = options.spacing;
  }

  toString(): string {
    let val = this.keyword + this.spacing[0].join('') + this.having.toString();
    return val;
  }
}
