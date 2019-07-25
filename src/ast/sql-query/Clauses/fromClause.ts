import { Alias } from '../alias';
import { parens, renderCloseParens, renderOpenParens } from '../helpers';

export interface FromClauseValue {
  parens: parens[];
  keyword: string;
  fc: any;
  spacing: string[][];
  alias: Alias;
}

export class FromClause {
  public parens: parens[];
  public keyword: string;
  public fc: any;
  public spacing: string[][];
  public alias: Alias;

  constructor(options: FromClauseValue) {
    this.parens = options.parens;
    this.keyword = options.keyword;
    this.fc = options.fc;
    this.spacing = options.spacing;
    this.alias = options.alias;
  }

  toString(): string {
    if (this.alias) {
      return (
        renderOpenParens(this.parens) +
        this.keyword +
        this.spacing[0].join('') +
        this.fc.toString() +
        this.spacing[1].join('') +
        Alias.toString() +
        renderCloseParens(this.parens)
      );
    }
    return (
      renderOpenParens(this.parens) +
      this.keyword +
      this.spacing[0] +
      this.fc.toString() +
      renderCloseParens(this.parens)
    );
  }

  getFromNameSpace(): string {
    return this.fc.namespace;
  }

  getFromName(): string {
    return this.fc.name;
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new FromClause({
      parens: this.parens,
      keyword: this.keyword,
      fc: this.fc,
      alias: this.alias,
      spacing: this.spacing,
    });
  }
}
