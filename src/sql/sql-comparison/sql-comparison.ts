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
import { LiteralValue, SqlLiteral } from '../sql-literal/sql-literal';
import { SqlRecord } from '../sql-record/sql-record';

import { SqlBetweenPart } from './sql-between-part';
import { SqlLikePart } from './sql-like-part';

export type SqlComparisonOp =
  | '='
  | '<>'
  | '<'
  | '>'
  | '<='
  | '>='
  | 'IS'
  | 'IS NOT'
  | 'IN'
  | 'NOT IN'
  | 'LIKE'
  | 'NOT LIKE'
  | 'BETWEEN'
  | 'NOT BETWEEN';
export type SqlComparisonDecorator = 'ALL' | 'ANY';
export type SpecialLikeType = 'includes' | 'prefix' | 'postfix' | 'exact';

const ANTI_OP: Record<SqlComparisonOp, SqlComparisonOp> = {
  '=': '<>',
  '<>': '=',
  '<': '>=',
  '>': '<=',
  '<=': '>',
  '>=': '<',
  'IS': 'IS NOT',
  'IS NOT': 'IS',
  'IN': 'NOT IN',
  'NOT IN': 'IN',
  'LIKE': 'NOT LIKE',
  'NOT LIKE': 'LIKE',
  'BETWEEN': 'NOT BETWEEN',
  'NOT BETWEEN': 'BETWEEN',
};

export interface SqlComparisonValue extends SqlBaseValue {
  op: SqlComparisonOp;
  negated?: boolean;
  lhs: SqlExpression;
  decorator?: SqlComparisonDecorator;
  rhs: SqlBase;
}

export class SqlComparison extends SqlExpression {
  static type: SqlTypeDesignator = 'comparison';

  static equal(
    lhs: SqlExpression | LiteralValue,
    rhs: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: '=',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlExpression.wrap(rhs),
    });
  }

  static unequal(
    lhs: SqlExpression | LiteralValue,
    rhs: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: '<>',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlExpression.wrap(rhs),
    });
  }

  static lessThan(
    lhs: SqlExpression | LiteralValue,
    rhs: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: '<',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlExpression.wrap(rhs),
    });
  }

  static greaterThan(
    lhs: SqlExpression | LiteralValue,
    rhs: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: '>',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlExpression.wrap(rhs),
    });
  }

  static lessThanOrEqual(
    lhs: SqlExpression | LiteralValue,
    rhs: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: '<=',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlExpression.wrap(rhs),
    });
  }

  static greaterThanOrEqual(
    lhs: SqlExpression | LiteralValue,
    rhs: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: '>=',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlExpression.wrap(rhs),
    });
  }

  static isNull(lhs: SqlExpression | LiteralValue): SqlComparison {
    return new SqlComparison({
      op: 'IS',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlLiteral.NULL,
    });
  }

  static isNotNull(lhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.isNull(lhs).negate();
  }

  static in(lhs: SqlExpression, values: (SqlExpression | LiteralValue)[]): SqlComparison {
    return new SqlComparison({
      op: 'IN',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlRecord.createWithoutKeyword(values.map(v => SqlExpression.wrap(v))),
    });
  }

  static notIn(lhs: SqlExpression, values: (SqlExpression | LiteralValue)[]): SqlComparison {
    return SqlComparison.in(lhs, values).negate();
  }

  static like(
    lhs: SqlExpression | string,
    rhs: SqlExpression | string,
    escape?: SqlExpression | string,
  ): SqlComparison {
    const rhsEx = SqlExpression.wrap(rhs);
    return new SqlComparison({
      op: 'LIKE',
      lhs: SqlExpression.wrap(lhs),
      rhs: typeof escape === 'undefined' ? rhsEx : SqlLikePart.create(rhsEx, escape),
    });
  }

  static notLike(
    lhs: SqlExpression,
    rhs: SqlExpression | string,
    escape?: SqlExpression | string,
  ): SqlComparison {
    return SqlComparison.like(lhs, rhs, escape).negate();
  }

  static between(
    lhs: SqlExpression | LiteralValue,
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: 'BETWEEN',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlBetweenPart.create(SqlExpression.wrap(start), SqlExpression.wrap(end)),
    });
  }

  static notBetween(
    lhs: SqlExpression | LiteralValue,
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return SqlComparison.between(lhs, start, end).negate();
  }

  static betweenSymmetric(
    lhs: SqlExpression | LiteralValue,
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return new SqlComparison({
      op: 'BETWEEN',
      lhs: SqlExpression.wrap(lhs),
      rhs: SqlBetweenPart.symmetric(SqlExpression.wrap(start), SqlExpression.wrap(end)),
    });
  }

  static notBetweenSymmetric(
    lhs: SqlExpression | LiteralValue,
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return SqlComparison.betweenSymmetric(lhs, start, end).negate();
  }

  public readonly op: SqlComparisonOp;
  public readonly lhs: SqlExpression;
  public readonly decorator?: SqlComparisonDecorator;
  public readonly rhs: SqlBase;

  constructor(options: SqlComparisonValue) {
    super(options, SqlComparison.type);
    this.op = options.op;
    this.lhs = options.lhs;
    this.decorator = options.decorator;
    this.rhs = options.rhs;
  }

  public valueOf(): SqlComparisonValue {
    const value = super.valueOf() as SqlComparisonValue;
    value.op = this.op;
    value.lhs = this.lhs;
    value.decorator = this.decorator;
    value.rhs = this.rhs;
    return value;
  }

  protected _toRawString(): string {
    const { lhs, op, decorator, rhs } = this;

    const rawParts: string[] = [
      lhs.toString(),
      this.getSpace('preOp'),
      this.getKeyword('op', op),
      this.getSpace('postOp'),
    ];

    if (decorator) {
      rawParts.push(this.getKeyword('decorator', decorator), this.getSpace('postDecorator'));
    }

    rawParts.push(rhs.toString());

    return rawParts.join('');
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

  public negate(): this {
    const { op, decorator } = this;

    const value = this.valueOf();
    value.op = ANTI_OP[op];
    value.keywords = this.getKeywordsWithout('op');
    if (decorator) {
      value.decorator = decorator === 'ALL' ? 'ANY' : 'ALL';
    }

    return SqlBase.fromValue(value);
  }

  public hasNot(): boolean {
    return this.op.includes('NOT');
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

  public getLikeMatchPattern(): string | undefined {
    const { op, rhs } = this;
    if (op !== 'LIKE') return;
    if (rhs instanceof SqlLiteral) {
      return rhs.getStringValue();
    } else if (rhs instanceof SqlLikePart && rhs.like instanceof SqlLiteral) {
      return rhs.like.getStringValue();
    }
    return;
  }

  public getSpecialLikeType(): SpecialLikeType | undefined {
    const likeMatchPattern = this.getLikeMatchPattern();
    if (typeof likeMatchPattern !== 'string') return;
    if (likeMatchPattern.endsWith('%')) {
      if (likeMatchPattern.startsWith('%')) {
        return 'includes'; // %blah%
      } else {
        return 'prefix'; // blah%
      }
    } else if (likeMatchPattern.startsWith('%')) {
      return 'postfix'; // %blah
    } else {
      return 'exact'; // blah
    }
  }
}

SqlBase.register(SqlComparison);
