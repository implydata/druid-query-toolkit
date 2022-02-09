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
import { SqlExpression } from '../../sql-expression';
import { SqlLiteral } from '../../sql-literal/sql-literal';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlPartitionedByClauseValue extends SqlClauseValue {
  expression?: SqlExpression;
}

export class SqlPartitionedByClause extends SqlClause {
  static type: SqlType = 'partitionedByClause';

  static DEFAULT_PARTITIONED_KEYWORD = 'PARTITIONED';
  static DEFAULT_BY_KEYWORD = 'BY';
  static DEFAULT_ALL_KEYWORD = 'ALL';

  static create(unit: SqlLiteral | undefined): SqlPartitionedByClause {
    return new SqlPartitionedByClause({ expression: unit });
  }

  public readonly expression?: SqlExpression;

  constructor(options: SqlPartitionedByClauseValue) {
    super(options, SqlPartitionedByClause.type);
    this.expression = options.expression;
  }

  public valueOf(): SqlPartitionedByClauseValue {
    const value = super.valueOf() as SqlPartitionedByClauseValue;
    value.expression = this.expression;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.getKeyword('partitioned', SqlPartitionedByClause.DEFAULT_PARTITIONED_KEYWORD),
      this.getSpace('postPartitioned'),
      this.getKeyword('by', SqlPartitionedByClause.DEFAULT_BY_KEYWORD),
      this.getSpace('postBy'),
    ];

    if (this.expression) {
      rawParts.push(this.expression.toString());
    } else {
      rawParts.push(this.getKeyword('all', SqlPartitionedByClause.DEFAULT_ALL_KEYWORD));

      if (this.keywords['time']) {
        rawParts.push(this.getSpace('preTime'), this.keywords['time']);
      }
    }

    return rawParts.join('');
  }

  public changePartitionedBy(expression: SqlExpression | undefined): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    if (this.expression) {
      const expression = this.expression._walkHelper(nextStack, fn, postorder);
      if (!expression) return;
      if (expression !== this.expression) {
        ret = ret.changePartitionedBy(expression);
      }
    }

    return ret;
  }
}

SqlBase.register(SqlPartitionedByClause);
