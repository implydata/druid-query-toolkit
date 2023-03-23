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

import { SqlBase, SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { RefName } from '../utils';

export interface SqlLabeledExpressionValue extends SqlBaseValue {
  label: RefName;
  expression: SqlExpression;
}

export class SqlLabeledExpression extends SqlExpression {
  static type: SqlTypeDesignator = 'labeledExpression';

  static create(
    label: RefName | string,
    expression: SqlExpression,
    forceQuotes?: boolean,
  ): SqlLabeledExpression {
    if (expression instanceof SqlLabeledExpression) {
      return expression.changeLabel(label, forceQuotes);
    }

    return new SqlLabeledExpression({
      expression: expression,
      label: typeof label === 'string' ? RefName.alias(label, forceQuotes) : label,
    });
  }

  public readonly label: RefName;
  public readonly expression: SqlExpression;

  constructor(options: SqlLabeledExpressionValue) {
    super(options, SqlLabeledExpression.type);
    this.label = options.label;
    this.expression = options.expression;
  }

  public valueOf() {
    const value = super.valueOf() as SqlLabeledExpressionValue;
    value.label = this.label;
    value.expression = this.expression;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.label.toString(),
      this.getSpace('preArrow'),
      '=>',
      this.getSpace('postArrow'),
      this.expression.toString(),
    ].join('');
  }

  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public changeLabel(label: string | RefName, forceQuotes = false): this {
    const newLabel =
      typeof label === 'string'
        ? forceQuotes
          ? RefName.alias(label, forceQuotes)
          : this.label.changeNameAsAlias(label)
        : label;

    const value = this.valueOf();
    value.label = newLabel;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression as any);
    }

    return ret;
  }

  public getLabelName(): string | undefined {
    return this.label.name;
  }

  public getUnderlyingExpression(): SqlExpression {
    return this.expression;
  }
}

SqlBase.register(SqlLabeledExpression);
