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

import { SqlBase, SqlType, Substitutor } from '../../sql-base';
import { SqlLiteral } from '../../sql-expression';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlOffsetClauseValue extends SqlClauseValue {
  offset: SqlLiteral;
}

export class SqlOffsetClause extends SqlClause {
  static type: SqlType = 'offsetClause';

  static DEFAULT_OFFSET_KEYWORD = 'OFFSET';

  static create(offset: SqlLiteral | number): SqlOffsetClause {
    return new SqlOffsetClause({
      offset: SqlLiteral.create(offset),
    });
  }

  public readonly offset: SqlLiteral;

  constructor(options: SqlOffsetClauseValue) {
    super(options, SqlOffsetClause.type);
    this.offset = options.offset;
  }

  public valueOf(): SqlOffsetClauseValue {
    const value = super.valueOf() as SqlOffsetClauseValue;
    value.offset = this.offset;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('offset', SqlOffsetClause.DEFAULT_OFFSET_KEYWORD),
      this.getSpace('postOffset'),
      this.offset.toString(),
    ].join('');
  }

  public changeOffset(offset: SqlLiteral | number): this {
    const value = this.valueOf();
    value.offset = SqlLiteral.create(offset);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    const offset = this.offset._walkHelper(nextStack, fn, postorder);
    if (!offset) return;
    if (offset !== this.offset) {
      ret = ret.changeOffset(offset as SqlLiteral);
    }

    return ret;
  }
}

SqlBase.register(SqlOffsetClause);
