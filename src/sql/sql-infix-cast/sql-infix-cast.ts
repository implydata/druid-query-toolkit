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

import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlColonAccess } from '../sql-colon-access/sql-colon-access';
import { SqlColumn } from '../sql-column/sql-column';
import { SqlExpression } from '../sql-expression';
import { SqlFunction } from '../sql-function/sql-function';
import type { LiteralValue } from '../sql-literal/sql-literal';
import { SqlType } from '../sql-type/sql-type';

export interface SqlInfixCastValue extends SqlBaseValue {
  expression: SqlExpression;
  castType: SqlType;
}

/**
 * An infix cast, `x::BIGINT`. It is sugar for `CAST(x AS BIGINT)`, or for JSON_VALUE with a
 * RETURNING type when it casts a colon access (see toFunction).
 */
export class SqlInfixCast extends SqlExpression {
  static type: SqlTypeDesignator = 'infixCast';

  static create(
    expression: SqlExpression | LiteralValue,
    castType: SqlType | string,
  ): SqlInfixCast {
    const ex = SqlExpression.wrap(expression);
    return new SqlInfixCast({
      // Only a term, a colon access or another infix cast can stand bare before the `::`
      expression:
        ex instanceof SqlColonAccess || ex instanceof SqlInfixCast
          ? ex
          : SqlColonAccess.ensureTerm(ex),
      castType: SqlType.create(castType),
    });
  }

  public readonly expression: SqlExpression;
  public readonly castType: SqlType;

  constructor(options: SqlInfixCastValue) {
    super(options, SqlInfixCast.type);
    this.expression = options.expression;
    this.castType = options.castType;
  }

  public valueOf() {
    const value = super.valueOf() as SqlInfixCastValue;
    value.expression = this.expression;
    value.castType = this.castType;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.expression.toString(),
      this.getSpace('preDoubleColon', ''),
      '::',
      this.getSpace('postDoubleColon', ''),
      this.castType.toString(),
    ].join('');
  }

  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public changeCastType(castType: SqlType | string): this {
    const value = this.valueOf();
    value.castType = SqlType.create(castType);
    return SqlBase.fromValue(value);
  }

  /**
   * Druid names a cast column after the column (`x::BIGINT` is "x"), and a cast of a colon access
   * or of another infix cast after that (`v:a.b::BIGINT` is "b")
   */
  public getOutputName(): string | undefined {
    const { expression } = this;
    if (
      expression instanceof SqlColumn ||
      expression instanceof SqlColonAccess ||
      expression instanceof SqlInfixCast
    ) {
      return expression.getOutputName();
    }
    return;
  }

  /**
   * The function call that this cast is sugar for: `x::BIGINT` is `CAST(x AS BIGINT)`, and a cast
   * of a colon access is JSON_VALUE with a RETURNING type, so `v:a::BIGINT` is
   * `JSON_VALUE(v, '$.a' RETURNING BIGINT)`. Any parens around the expression are dropped.
   */
  public toFunction(): SqlExpression {
    const expression = this.expression.changeParens([]);
    if (expression instanceof SqlColonAccess) return expression.toJsonValue(this.castType);
    return SqlFunction.cast(expression, this.castType);
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
      ret = ret.changeExpression(expression);
    }

    return ret;
  }
}

SqlBase.register(SqlInfixCast);
