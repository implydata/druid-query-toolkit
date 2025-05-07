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

import { NEWLINE, SeparatedArray, SPACE } from '../../helpers';
import type { SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

import type { SqlWithPart } from './sql-with-part';

export interface SqlWithClauseValue extends SqlClauseValue {
  withParts: SeparatedArray<SqlWithPart>;
}

export class SqlWithClause extends SqlClause {
  static type: SqlTypeDesignator = 'withClause';

  static DEFAULT_WITH_KEYWORD = 'WITH';

  static create(withParts: SeparatedArray<SqlWithPart> | SqlWithPart[]): SqlWithClause {
    return new SqlWithClause({
      withParts: SeparatedArray.fromArray(withParts),
    });
  }

  public readonly withParts: SeparatedArray<SqlWithPart>;

  constructor(options: SqlWithClauseValue) {
    super(options, SqlWithClause.type);
    this.withParts = options.withParts;
  }

  public valueOf(): SqlWithClauseValue {
    const value = super.valueOf() as SqlWithClauseValue;
    value.withParts = this.withParts;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.getKeyword('with', SqlWithClause.DEFAULT_WITH_KEYWORD),
      this.getSpace('postWith', this.withParts.length() > 1 ? NEWLINE : SPACE),
    ];

    rawParts.push(this.withParts.toString(',\n'));

    return rawParts.join('');
  }

  public changeWithParts(withParts: SeparatedArray<SqlWithPart> | SqlWithPart[]): this {
    const value = this.valueOf();
    value.withParts = SeparatedArray.fromArray(withParts);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    const withParts = SqlBase.walkSeparatedArray(this.withParts, nextStack, fn, postorder);
    if (!withParts) return;
    if (withParts !== this.withParts) {
      ret = ret.changeWithParts(withParts);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();

    value.withParts = this.withParts.clearSeparators();

    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlWithClause);
