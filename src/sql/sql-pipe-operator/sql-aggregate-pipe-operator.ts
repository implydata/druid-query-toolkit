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

import { NEWLINE, NEWLINE_INDENT, SeparatedArray, Separator, SPACE } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlGroupByClause } from '../sql-clause';
import type { SqlExpression } from '../sql-expression';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlAggregatePipeOperatorValue extends SqlPipeOperatorValue {
  expressions?: SeparatedArray<SqlExpression>;
  groupByClause?: SqlGroupByClause;
}

/**
 * The `|> AGGREGATE` pipe operator, which computes aggregates over the input rows, optionally
 * grouped with a `GROUP BY`. The output has the grouping columns followed by the aggregates.
 */
export class SqlAggregatePipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'aggregatePipeOperator';

  static DEFAULT_AGGREGATE_KEYWORD = 'AGGREGATE';

  static create(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
    groupBy?: SqlGroupByClause | SeparatedArray<SqlExpression> | SqlExpression[],
  ): SqlAggregatePipeOperator {
    return new SqlAggregatePipeOperator({
      expressions: SeparatedArray.fromPossiblyEmptyArray(expressions),
      groupByClause:
        typeof groupBy === 'undefined' || groupBy instanceof SqlGroupByClause
          ? groupBy
          : SqlGroupByClause.create(groupBy),
    });
  }

  public readonly expressions?: SeparatedArray<SqlExpression>;
  public readonly groupByClause?: SqlGroupByClause;

  constructor(options: SqlAggregatePipeOperatorValue) {
    super(options, SqlAggregatePipeOperator.type);
    this.expressions = options.expressions;
    this.groupByClause = options.groupByClause;
    if (!this.expressions && !this.groupByClause) {
      throw new Error('an AGGREGATE pipe operator needs aggregates or a GROUP BY');
    }
  }

  public valueOf(): SqlAggregatePipeOperatorValue {
    const value = super.valueOf() as SqlAggregatePipeOperatorValue;
    value.expressions = this.expressions;
    value.groupByClause = this.groupByClause;
    return value;
  }

  protected _toRawOperatorString(): string {
    const { expressions, groupByClause } = this;
    const rawParts: string[] = [
      this.getKeyword('aggregate', SqlAggregatePipeOperator.DEFAULT_AGGREGATE_KEYWORD),
    ];

    const multiline = Boolean(expressions && expressions.length() > 1);
    const indentSpace = multiline ? NEWLINE_INDENT : SPACE;

    if (expressions) {
      rawParts.push(
        this.getSpace('postAggregate', indentSpace),
        expressions.toString(new Separator({ separator: ',', right: indentSpace })),
      );
    }

    if (groupByClause) {
      rawParts.push(
        expressions
          ? this.getSpace('preGroupByClause', multiline ? NEWLINE : SPACE)
          : this.getSpace('postAggregate'),
        groupByClause.toString(),
      );
    }

    return rawParts.join('');
  }

  public changeExpressions(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    const value = this.valueOf();
    value.expressions = SeparatedArray.fromPossiblyEmptyArray(expressions);
    return SqlBase.fromValue(value);
  }

  public changeGroupByClause(groupByClause: SqlGroupByClause | undefined): this {
    if (this.groupByClause === groupByClause) return this;
    const value = this.valueOf();
    if (groupByClause) {
      value.groupByClause = groupByClause;
    } else {
      delete value.groupByClause;
      value.spacing = this.getSpacingWithout('preGroupByClause');
    }
    return SqlBase.fromValue(value);
  }

  public getGroupByExpressions(): readonly SqlExpression[] {
    return this.groupByClause?.expressions?.values || [];
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    if (this.expressions) {
      const expressions = SqlBase.walkSeparatedArray(this.expressions, nextStack, fn, postorder);
      if (!expressions) return;
      if (expressions !== this.expressions) {
        ret = ret.changeExpressions(expressions);
      }
    }

    if (this.groupByClause) {
      const groupByClause = this.groupByClause._walkHelper(nextStack, fn, postorder);
      if (!groupByClause) return;
      if (groupByClause !== this.groupByClause) {
        ret = ret.changeGroupByClause(groupByClause as SqlGroupByClause);
      }
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    if (!this.expressions) return this;
    const value = this.valueOf();
    value.expressions = this.expressions.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlAggregatePipeOperator);
