import { BaseAst } from '../base-ast';

export interface SqlQueryValue {
  queryType: any;
  selectParts: any;
  fromClause: any;
  where: any;
  groupby: any;
  having: any;
  orderBy: any;
  limit: any;
  unionAll: any;
  syntax: any;
  spacing: any;
  endSpacing: any;
}

export class SqlQuery extends BaseAst {
  public queryType: any;
  public selectParts: any;
  public fromClause: any;
  public where: any;
  public groupby: any;
  public having: any;
  public orderBy: any;
  public limit: any;
  public unionAll: any;
  public syntax: any;
  public spacing: any;
  public endSpacing: any;

  constructor(options: SqlQueryValue) {
    super('query');
    this.queryType = options.queryType;
    this.selectParts = options.selectParts;
    this.fromClause = options.fromClause;
    this.where = options.where;
    this.groupby = options.groupby;
    this.having = options.having;
    this.orderBy = options.orderBy;
    this.limit = options.limit;
    this.unionAll = options.unionAll;
    this.syntax = options.syntax;
    this.spacing = options.spacing;
    this.endSpacing = options.endSpacing;
  }

  toString() {
    return '......';
  }

  addFilter(column: string, value: any): SqlQuery {
    // ToDo:
  }
}
