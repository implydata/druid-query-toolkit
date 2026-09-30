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

import { SeparatedArray } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlColumn } from '../sql-column/sql-column';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlDropPipeOperatorValue extends SqlPipeOperatorValue {
  columns: SeparatedArray<SqlColumn>;
}

/**
 * The \`|> DROP\` pipe operator, which removes columns from the input.
 */
export class SqlDropPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'dropPipeOperator';

  static DEFAULT_DROP_KEYWORD = 'DROP';

  static create(columns: SeparatedArray<SqlColumn> | SqlColumn[]): SqlDropPipeOperator {
    return new SqlDropPipeOperator({
      columns: SeparatedArray.fromArray(columns),
    });
  }

  public readonly columns: SeparatedArray<SqlColumn>;

  constructor(options: SqlDropPipeOperatorValue) {
    super(options, SqlDropPipeOperator.type);
    this.columns = options.columns;
  }

  public valueOf(): SqlDropPipeOperatorValue {
    const value = super.valueOf() as SqlDropPipeOperatorValue;
    value.columns = this.columns;
    return value;
  }

  protected _toRawOperatorString(): string {
    return [
      this.getKeyword('drop', SqlDropPipeOperator.DEFAULT_DROP_KEYWORD),
      this.getSpace('postDrop'),
      this.columns.toString(),
    ].join('');
  }

  public changeColumns(columns: SeparatedArray<SqlColumn> | SqlColumn[]): this {
    const value = this.valueOf();
    value.columns = SeparatedArray.fromArray(columns);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const columns = SqlBase.walkSeparatedArray(this.columns, nextStack, fn, postorder);
    if (!columns) return;
    if (columns !== this.columns) {
      ret = ret.changeColumns(columns);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.columns = this.columns.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlDropPipeOperator);
