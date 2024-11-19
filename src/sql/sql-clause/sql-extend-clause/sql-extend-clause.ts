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

import type { SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import { SeparatedArray } from '../../utils';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

import type { SqlColumnDeclaration } from './sql-column-declaration';

export interface SqlExtendClauseValue extends SqlClauseValue {
  columnDeclarations: SeparatedArray<SqlColumnDeclaration>;
}

export class SqlExtendClause extends SqlClause {
  static type: SqlTypeDesignator = 'extendClause';

  static DEFAULT_EXTEND_KEYWORD = 'EXTEND';

  static create(columnDeclarations: readonly SqlColumnDeclaration[]): SqlExtendClause {
    return new SqlExtendClause({
      columnDeclarations: SeparatedArray.fromArray(columnDeclarations),
    });
  }

  public readonly columnDeclarations: SeparatedArray<SqlColumnDeclaration>;

  constructor(options: SqlExtendClauseValue) {
    super(options, SqlExtendClause.type);
    this.columnDeclarations = options.columnDeclarations;
  }

  public valueOf(): SqlExtendClauseValue {
    const value = super.valueOf() as SqlExtendClauseValue;
    value.columnDeclarations = this.columnDeclarations;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('extend', SqlExtendClause.DEFAULT_EXTEND_KEYWORD, 'postExtend'),
      '(',
      this.getSpace('postLeftParen', ''),
      this.columnDeclarations.toString(),
      this.getSpace('postColumnDeclarations', ''),
      ')',
    ].join('');
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    const columnDeclarations = SqlBase.walkSeparatedArray(
      this.columnDeclarations,
      nextStack,
      fn,
      postorder,
    );
    if (!columnDeclarations) return;
    if (columnDeclarations !== this.columnDeclarations) {
      ret = ret.changeColumnDeclarations(columnDeclarations);
    }

    return ret;
  }

  public changeColumnDeclarations(
    columnDeclarations: SeparatedArray<SqlColumnDeclaration> | readonly SqlColumnDeclaration[],
  ): this {
    const value = this.valueOf();
    value.columnDeclarations = SeparatedArray.fromArray(columnDeclarations);
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlExtendClause);
