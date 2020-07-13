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

import { LiteralValue, SqlLiteral } from '..';
import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SqlExpression } from '../sql-expression';

import { SqlBetweenAndUnit } from './sql-between-and-unit';
import { SqlLikeEscapeUnit } from './sql-like-escape-unit';

export interface SqlComparisonValue extends SqlBaseValue {
  op: string;
  notKeyword?: string;
  lhs: SqlExpression;
  rhs: SqlBase;
}

export class SqlComparison extends SqlExpression {
  static type = 'comparison';

  static equal(lhs: SqlExpression, rhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: '=',
      lhs,
      rhs,
    });
  }

  static unequal(lhs: SqlExpression, rhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: '!=',
      lhs,
      rhs,
    });
  }

  static lessThan(lhs: SqlExpression, rhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: '<',
      lhs,
      rhs,
    });
  }

  static greaterThan(lhs: SqlExpression, rhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: '>',
      lhs,
      rhs,
    });
  }

  static lessThanOrEqual(lhs: SqlExpression, rhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: '<=',
      lhs,
      rhs,
    });
  }

  static greaterThanOrEqual(lhs: SqlExpression, rhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: '>=',
      lhs,
      rhs,
    });
  }

  static isNull(lhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: 'IS',
      lhs,
      rhs: SqlLiteral.NULL,
    });
  }

  static isNotNull(lhs: SqlExpression): SqlComparison {
    return new SqlComparison({
      op: 'IS',
      notKeyword: 'NOT',
      lhs,
      rhs: SqlLiteral.NULL,
    });
  }

  static like(
    lhs: SqlExpression,
    rhs: SqlLiteral | string,
    escape?: SqlLiteral | string,
  ): SqlComparison {
    const rhsLiteral = SqlLiteral.create(rhs);
    return new SqlComparison({
      op: 'LIKE',
      lhs,
      rhs:
        typeof escape === 'undefined'
          ? rhsLiteral
          : SqlLikeEscapeUnit.create(rhsLiteral, SqlLiteral.create(escape)),
    });
  }

  static between(
    lhs: SqlExpression,
    start: SqlLiteral | LiteralValue,
    end: SqlLiteral | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: 'BETWEEN',
      lhs,
      rhs: SqlBetweenAndUnit.create(SqlLiteral.create(start), SqlLiteral.create(end)),
    });
  }

  static betweenSymmetric(
    lhs: SqlExpression,
    start: SqlLiteral | LiteralValue,
    end: SqlLiteral | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: 'BETWEEN SYMMETRIC',
      lhs,
      rhs: SqlBetweenAndUnit.create(SqlLiteral.create(start), SqlLiteral.create(end)),
    });
  }

  public readonly op: string;
  public readonly notKeyword?: string;
  public readonly lhs: SqlExpression;
  public readonly rhs: SqlBase;

  constructor(options: SqlComparisonValue) {
    super(options, SqlComparison.type);
    this.op = options.op;
    this.notKeyword = options.notKeyword;
    this.lhs = options.lhs;
    this.rhs = options.rhs;
  }

  public valueOf(): SqlComparisonValue {
    const value = super.valueOf() as SqlComparisonValue;
    value.op = this.op;
    value.notKeyword = this.notKeyword;
    value.lhs = this.lhs;
    value.rhs = this.rhs;
    return value;
  }

  protected _toRawString(): string {
    const { lhs, op, notKeyword, rhs } = this;
    const opIsIs = this.getEffectiveOp() === 'IS';

    const rawParts: string[] = [lhs.toString()];

    if (notKeyword && !opIsIs) {
      rawParts.push(this.getInnerSpace('not'), notKeyword);
    }

    rawParts.push(this.getInnerSpace('preOp'), op, this.getInnerSpace('postOp'));

    if (notKeyword && opIsIs) {
      rawParts.push(notKeyword, this.getInnerSpace('not'));
    }

    rawParts.push(rhs.toString());

    return rawParts.join('');
  }

  public getEffectiveOp(): string {
    return this.op.toUpperCase();
  }

  public changeLhs(lhs: SqlExpression): this {
    const value = this.valueOf();
    value.lhs = lhs;
    return SqlBase.fromValue(value);
  }

  public changeRhs(rhs: SqlBase): this {
    const value = this.valueOf();
    value.rhs = rhs;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const lhs = this.lhs._walkHelper(nextStack, fn, postorder);
    if (!lhs) return;
    if (lhs !== this.lhs) {
      ret = ret.changeLhs(lhs);
    }

    const rhs = this.rhs._walkHelper(nextStack, fn, postorder);
    if (!rhs) return;
    if (rhs !== this.rhs) {
      ret = ret.changeRhs(rhs);
    }

    return ret;
  }
}

SqlBase.register(SqlComparison.type, SqlComparison);
