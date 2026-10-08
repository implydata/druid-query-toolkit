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

export interface SqlExtendPipeOperatorValue extends SqlPipeOperatorValue {
  expressions: SeparatedArray<SqlExpression>;
}

/**
 * The \`|> EXTEND\` pipe operator, which adds computed columns to the input columns.
 */
export class SqlExtendPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'extendPipeOperator';

  static DEFAULT_EXTEND_KEYWORD = 'EXTEND';

  static create(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[],
  ): SqlExtendPipeOperator {
    return new SqlExtendPipeOperator({
      expressions: SeparatedArray.fromArray(expressions),
    });
  }

  public readonly expressions: SeparatedArray<SqlExpression>;

  constructor(options: SqlExtendPipeOperatorValue) {
    super(options, SqlExtendPipeOperator.type);
    this.expressions = options.expressions;
  }

  public valueOf(): SqlExtendPipeOperatorValue {
    const value = super.valueOf() as SqlExtendPipeOperatorValue;
    value.expressions = this.expressions;
    return value;
  }

  protected _toRawOperatorString(): string {
    const indentSpace = this.expressions.length() > 1 ? NEWLINE_INDENT : SPACE;
    return [
      this.getKeyword('extend', SqlExtendPipeOperator.DEFAULT_EXTEND_KEYWORD),
      this.getSpace('postExtend', indentSpace),
      this.expressions.toString(new Separator({ separator: ',', right: indentSpace })),
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
  ): SqlPipeOperator | undefined {
    let ret = this;

    const expressions = SqlBase.walkSeparatedArray(this.expressions, nextStack, fn, postorder);
    if (!expressions) return;
    if (expressions !== this.expressions) {
      ret = ret.changeExpressions(expressions);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.expressions = this.expressions.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlExtendPipeOperator);
