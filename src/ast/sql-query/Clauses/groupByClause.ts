import { OrExpression } from '../..';

export interface GroupByClauseValue {
  groupKeyword: string;
  byKeyword: string;
  groupBy: OrExpression[];
  spacing: string[][];
}

export class GroupByClause {
  public groupKeyword: string;
  public byKeyword: string;
  public groupBy: OrExpression[];
  public spacing: string[][];

  constructor(options: GroupByClauseValue) {
    this.groupKeyword = options.groupKeyword;
    this.byKeyword = options.byKeyword;
    this.groupBy = options.groupBy;
    this.spacing = options.spacing;
  }

  toString(): string {
    let val = [
      this.groupKeyword + this.spacing[0].join('') + this.byKeyword + this.spacing[1].join(''),
    ];
    this.groupBy.map((groupBy, index: number) => {
      val.push(groupBy.toString());
      if (index < this.groupBy.length - 1) {
        val.push(',' + this.spacing[2][index]);
      }
    });
    return val.join('');
  }
}
