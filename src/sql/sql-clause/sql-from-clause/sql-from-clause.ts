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

import { NEWLINE, SeparatedArray } from '../../helpers';
import type { SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import type { SqlExpression } from '../../sql-expression';
import { SqlQuery } from '../../sql-query/sql-query';
import { SqlWithQuery } from '../../sql-with-query/sql-with-query';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

import type { SqlJoinPart } from './sql-join-part';

export interface SqlFromClauseValue extends SqlClauseValue {
  expressions: SeparatedArray<SqlExpression>;
  joinParts?: SeparatedArray<SqlJoinPart>;
}

export class SqlFromClause extends SqlClause {
  static type: SqlTypeDesignator = 'fromClause';

  static DEFAULT_FROM_KEYWORD = 'FROM';

  static create(expressions: SeparatedArray<SqlExpression> | SqlExpression[]): SqlFromClause {
    return new SqlFromClause({
      expressions: SeparatedArray.fromArray(expressions).map(ex =>
        ex instanceof SqlQuery || ex instanceof SqlWithQuery ? ex.ensureParens() : ex,
      ),
    });
  }

  public readonly expressions: SeparatedArray<SqlExpression>;
  public readonly joinParts?: SeparatedArray<SqlJoinPart>;

  constructor(options: SqlFromClauseValue) {
    super(options, SqlFromClause.type);
    this.expressions = options.expressions;
    this.joinParts = options.joinParts;
  }

  public valueOf(): SqlFromClauseValue {
    const value = super.valueOf() as SqlFromClauseValue;
    value.expressions = this.expressions;
    value.joinParts = this.joinParts;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.getKeyword('from', SqlFromClause.DEFAULT_FROM_KEYWORD),
      this.getSpace('postFrom'),
    ];

    rawParts.push(this.expressions.toString());

    if (this.joinParts) {
      rawParts.push(this.getSpace('preJoin', NEWLINE), this.joinParts.toString(NEWLINE));
    }

    return rawParts.join('');
  }

  public changeExpressions(expressions: SeparatedArray<SqlExpression> | SqlExpression[]): this {
    const value = this.valueOf();
    value.expressions = SeparatedArray.fromArray(expressions);
    return SqlBase.fromValue(value);
  }

  public changeJoinParts(joinParts: SeparatedArray<SqlJoinPart> | SqlJoinPart[] | undefined): this {
    const value = this.valueOf();
    if (joinParts) {
      value.joinParts = SeparatedArray.fromArray(joinParts);
    } else {
      value.spacing = this.getSpacingWithout('preJoin');
      delete value.joinParts;
    }
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    const expressions = SqlBase.walkSeparatedArray(this.expressions, nextStack, fn, postorder);
    if (!expressions) return;
    if (expressions !== this.expressions) {
      ret = ret.changeExpressions(expressions);
    }

    if (this.joinParts) {
      const joinParts = SqlBase.walkSeparatedArray(this.joinParts, nextStack, fn, postorder);
      if (!joinParts) return;
      if (joinParts !== this.joinParts) {
        ret = ret.changeJoinParts(joinParts);
      }
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();

    value.expressions = this.expressions.clearSeparators();

    if (this.joinParts) {
      value.joinParts = this.joinParts.clearSeparators();
    }

    return SqlBase.fromValue(value);
  }

  public hasJoin(): boolean {
    return Boolean(this.joinParts);
  }

  public getJoins(): readonly SqlJoinPart[] {
    if (!this.joinParts) return [];
    return this.joinParts.values;
  }

  public addJoin(join: SqlJoinPart) {
    return this.changeJoinParts(
      this.joinParts ? this.joinParts.append(join) : SeparatedArray.fromSingleValue(join),
    );
  }

  public removeAllJoins() {
    return this.changeJoinParts(undefined);
  }
}

SqlBase.register(SqlFromClause);
