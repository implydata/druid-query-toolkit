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
import type { SqlExpression } from '../../sql-expression';
import { SeparatedArray } from '../../utils';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

export interface SqlPartitionByClauseValue extends SqlClauseValue {
  expressions: SeparatedArray<SqlExpression>;
}

export class SqlPartitionByClause extends SqlClause {
  static type: SqlTypeDesignator = 'partitionByClause';

  static DEFAULT_PARTITION_BY_KEYWORD = 'PARTITION BY';

  static create(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[],
  ): SqlPartitionByClause {
    return new SqlPartitionByClause({
      expressions: SeparatedArray.fromArray(expressions),
    });
  }

  public readonly expressions: SeparatedArray<SqlExpression>;

  constructor(options: SqlPartitionByClauseValue) {
    super(options, SqlPartitionByClause.type);
    this.expressions = options.expressions;
  }

  public valueOf(): SqlPartitionByClauseValue {
    const value = super.valueOf() as SqlPartitionByClauseValue;
    value.expressions = this.expressions;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('partitionBy', SqlPartitionByClause.DEFAULT_PARTITION_BY_KEYWORD),
      this.getSpace('postPartitionBy'),
      this.expressions.toString(),
    ].join('');
  }

  public changeExpressions(expressions: SeparatedArray<SqlExpression> | SqlExpression[]): this {
    const value = this.valueOf();
    value.expressions = SeparatedArray.fromArray(expressions);
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

    return ret;
  }
}

SqlBase.register(SqlPartitionByClause);
