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

import { SqlLiteral } from '..';
import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SqlExpression } from '../sql-expression';

// innerSpacing:
// A       <        B
//   preOp   postOp
// Also 'not'

export interface BetweenAndUnit {
  start: SqlLiteral;
  preKeyword: string;
  keyword: string;
  postKeyword: string;
  end: SqlLiteral;
}

export interface LikeEscapeUnit {
  like: SqlLiteral;
  preEscape: string;
  escapeKeyword: string;
  postEscape: string;
  escape: SqlLiteral;
}

export interface SqlComparisonValue extends SqlBaseValue {
  op: string;
  notKeyword?: string;
  lhs: SqlExpression;
  rhs: SqlBase | BetweenAndUnit | LikeEscapeUnit;
}

export class SqlComparison extends SqlExpression {
  static type = 'comparision';

  public readonly op: string;
  public readonly notKeyword?: string;
  public readonly lhs: SqlExpression;
  public readonly rhs: SqlBase | BetweenAndUnit | LikeEscapeUnit;

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

  public toRawString(): string {
    const { lhs, op, notKeyword, rhs } = this;
    const opIsIs = op.toUpperCase() === 'IS';

    const rawParts: string[] = [lhs.toString()];

    if (notKeyword && !opIsIs) {
      rawParts.push(this.getInnerSpace('not'), notKeyword);
    }

    rawParts.push(this.getInnerSpace('preOp'), op, this.getInnerSpace('postOp'));

    if (notKeyword && opIsIs) {
      rawParts.push(notKeyword, this.getInnerSpace('not'));
    }

    if (rhs instanceof SqlBase) {
      rawParts.push(rhs.toString());
    } else {
      if ((rhs as any).start) {
        rawParts.push(
          (rhs as BetweenAndUnit).start.toString(),
          (rhs as BetweenAndUnit).preKeyword,
          (rhs as BetweenAndUnit).keyword,
          (rhs as BetweenAndUnit).postKeyword,
          (rhs as BetweenAndUnit).end.toString(),
        );
      } else {
        rawParts.push(
          (rhs as LikeEscapeUnit).like.toString(),
          (rhs as LikeEscapeUnit).preEscape,
          (rhs as LikeEscapeUnit).escapeKeyword,
          (rhs as LikeEscapeUnit).postEscape,
          (rhs as LikeEscapeUnit).escape.toString(),
        );
      }
    }

    return rawParts.join('');
  }

  public walkInner(
    nextStack: SqlBase[],
    fn: (t: SqlBase, stack: SqlBase[]) => void,
    postorder: boolean,
  ): void {
    this.lhs.walkHelper(nextStack, fn, postorder);
    const { rhs } = this;
    if (rhs instanceof SqlBase) {
      rhs.walkHelper(nextStack, fn, postorder);
    } else {
      if ((rhs as any).start) {
        (rhs as BetweenAndUnit).start.walkHelper(nextStack, fn, postorder);
        (rhs as BetweenAndUnit).end.walkHelper(nextStack, fn, postorder);
      } else {
        (rhs as LikeEscapeUnit).like.walkHelper(nextStack, fn, postorder);
        (rhs as LikeEscapeUnit).escape.walkHelper(nextStack, fn, postorder);
      }
    }
  }
}

SqlBase.register(SqlComparison.type, SqlComparison);
