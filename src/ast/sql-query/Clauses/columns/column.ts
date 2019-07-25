import { Alias } from '../../alias';
import { CaseExpression } from '../../BasicExpression/caseExpression';
import { parens, renderCloseParens, renderOpenParens } from '../../helpers';

export interface ColumnValue {
  parens: parens[];
  ex: CaseExpression | any;
  alias: Alias | null;
  spacing: any[];
}

export class Column {
  public parens: parens[];
  public ex: CaseExpression | any;
  public alias: Alias | null;
  public spacing: any[];

  constructor(options: ColumnValue) {
    this.parens = options.parens;
    this.ex = options.ex;
    this.alias = options.alias;
    this.spacing = options.spacing;
  }

  getAlias(): Alias | undefined {
    if (this.alias) {
      return this.alias;
    }
    return;
  }

  toString() {
    if (this.alias) {
      return (
        renderOpenParens(this.parens) +
        this.ex +
        this.spacing[0].join('') +
        this.alias.toString() +
        renderCloseParens(this.parens)
      );
    }
    return renderOpenParens(this.parens) + this.ex + renderCloseParens(this.parens);
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new Column({
      parens: this.parens,
      ex: this.ex,
      alias: this.alias,
      spacing: this.spacing,
    });
  }

  getBasicValue() {
    return this.ex.getBasicValue();
  }
}
