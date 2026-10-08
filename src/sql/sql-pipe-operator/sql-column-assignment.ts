/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SPACE } from '../helpers';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlColumn } from '../sql-column/sql-column';
import { SqlExpression } from '../sql-expression';

export interface SqlColumnAssignmentValue extends SqlBaseValue {
  column: SqlColumn;
  expression: SqlExpression;
}

/**
 * A `column = expression` item, as used by the `|> SET` pipe operator.
 */
export class SqlColumnAssignment extends SqlBase {
  static type: SqlTypeDesignator = 'columnAssignment';

  static create(column: SqlColumn | string, expression: SqlExpression): SqlColumnAssignment {
    return new SqlColumnAssignment({
      column: typeof column === 'string' ? SqlColumn.optionalQuotes(column) : column,
      expression: SqlExpression.verify(expression),
    });
  }

  public readonly column: SqlColumn;
  public readonly expression: SqlExpression;

  constructor(options: SqlColumnAssignmentValue) {
    super(options, SqlColumnAssignment.type);
    this.column = options.column;
    this.expression = options.expression;
  }

  public valueOf(): SqlColumnAssignmentValue {
    const value = super.valueOf() as SqlColumnAssignmentValue;
    value.column = this.column;
    value.expression = this.expression;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.column.toString(),
      this.getSpace('preEquals', SPACE),
      '=',
      this.getSpace('postEquals', SPACE),
      this.expression.toString(),
    ].join('');
  }

  public getColumnName(): string {
    return this.column.getName();
  }

  public changeColumn(column: SqlColumn): this {
    const value = this.valueOf();
    value.column = column;
    return SqlBase.fromValue(value);
  }

  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const column = this.column._walkHelper(nextStack, fn, postorder);
    if (!column) return;
    if (column !== this.column) {
      if (!(column instanceof SqlColumn)) throw new Error('must return a sql column');
      ret = ret.changeColumn(column);
    }

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression);
    }

    return ret;
  }
}

SqlBase.register(SqlColumnAssignment);
