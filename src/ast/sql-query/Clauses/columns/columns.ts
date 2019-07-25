import { Column } from './column';
import { parens, renderCloseParens, renderOpenParens } from '../../helpers';

export interface ColumnsValue {
  parens: parens[];
  columns: Column[];
  spacing: string[][];
}

export class Columns {
  public parens: parens[];
  public columns: Column[];
  public spacing: string[][];

  constructor(options: ColumnsValue) {
    this.parens = options.parens;
    this.columns = options.columns;
    this.spacing = options.spacing;
  }

  toString(): string {
    const val: string[] = [];
    renderOpenParens(this.parens);
    this.columns.map((column: Column, index: number) => {
      val.push(column.toString());
      if (index < this.columns.length - 1) {
        val.push(',' + this.spacing[index].join(''));
      }
    });
    renderCloseParens(this.parens);
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new Columns({ parens: this.parens, columns: this.columns, spacing: this.spacing });
  }
}
