import { OrExpression } from '../..';

export interface WhereClauseValue {
  keyword: string;
  filter: OrExpression;
  spacing: string[][];
}

export class WhereClause {
  public keyword: string;
  public filter: OrExpression;
  public spacing: string[][];

  constructor(options: WhereClauseValue) {
    this.keyword = options.keyword;
    this.filter = options.filter;
    this.spacing = options.spacing;
  }

  toString(): string {
    return this.keyword + this.spacing.join('') + this.filter.toString();
  }
}
