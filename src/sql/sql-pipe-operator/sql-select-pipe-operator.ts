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

import { NEWLINE_INDENT, SeparatedArray, Separator, SPACE } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlExpression } from '../sql-expression';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlSelectPipeOperatorValue extends SqlPipeOperatorValue {
  selectExpressions: SeparatedArray<SqlExpression>;
}

/**
 * The \`|> SELECT\` pipe operator, which computes a new set of columns from the input.
 */
export class SqlSelectPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'selectPipeOperator';

  static DEFAULT_SELECT_KEYWORD = 'SELECT';

  static create(
    selectExpressions: SeparatedArray<SqlExpression> | SqlExpression[],
  ): SqlSelectPipeOperator {
    return new SqlSelectPipeOperator({
      selectExpressions: SeparatedArray.fromArray(selectExpressions),
    });
  }

  public readonly selectExpressions: SeparatedArray<SqlExpression>;

  constructor(options: SqlSelectPipeOperatorValue) {
    super(options, SqlSelectPipeOperator.type);
    this.selectExpressions = options.selectExpressions;
  }

  public valueOf(): SqlSelectPipeOperatorValue {
    const value = super.valueOf() as SqlSelectPipeOperatorValue;
    value.selectExpressions = this.selectExpressions;
    return value;
  }

  protected _toRawOperatorString(): string {
    const indentSpace = this.selectExpressions.length() > 1 ? NEWLINE_INDENT : SPACE;
    return [
      this.getKeyword('select', SqlSelectPipeOperator.DEFAULT_SELECT_KEYWORD),
      this.getSpace('postSelect', indentSpace),
      this.selectExpressions.toString(new Separator({ separator: ',', right: indentSpace })),
    ].join('');
  }

  public changeSelectExpressions(
    selectExpressions: SeparatedArray<SqlExpression> | SqlExpression[],
  ): this {
    const value = this.valueOf();
    value.selectExpressions = SeparatedArray.fromArray(selectExpressions);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const selectExpressions = SqlBase.walkSeparatedArray(
      this.selectExpressions,
      nextStack,
      fn,
      postorder,
    );
    if (!selectExpressions) return;
    if (selectExpressions !== this.selectExpressions) {
      ret = ret.changeSelectExpressions(selectExpressions);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.selectExpressions = this.selectExpressions.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlSelectPipeOperator);
