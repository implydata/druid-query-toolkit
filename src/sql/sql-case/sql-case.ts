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

import { SeparatedArray, SPACE } from '../helpers';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import type { LiteralValue } from '../sql-literal/sql-literal';

import { SqlWhenThenPart } from './sql-when-then-part';

export interface SqlCaseValue extends SqlBaseValue {
  caseExpression?: SqlExpression;
  whenThenParts: SeparatedArray<SqlWhenThenPart>;
  elseExpression?: SqlExpression;
}

export class SqlCase extends SqlExpression {
  static type: SqlTypeDesignator = 'case';

  static DEFAULT_CASE_KEYWORD = 'CASE';
  static DEFAULT_ELSE_KEYWORD = 'ELSE';
  static DEFAULT_END_KEYWORD = 'END';

  static ifThenElse(
    conditionExpression: SqlExpression,
    thenExpression: SqlExpression | LiteralValue,
    elseExpression?: SqlExpression | LiteralValue,
  ) {
    return new SqlCase({
      whenThenParts: SeparatedArray.fromSingleValue(
        SqlWhenThenPart.create(conditionExpression, thenExpression),
      ),
      elseExpression:
        typeof elseExpression !== 'undefined' ? SqlExpression.wrap(elseExpression) : undefined,
    });
  }

  public readonly caseExpression?: SqlExpression;
  public readonly whenThenParts: SeparatedArray<SqlWhenThenPart>;
  public readonly elseExpression?: SqlExpression;

  constructor(options: SqlCaseValue) {
    super(options, SqlCase.type);
    this.caseExpression = options.caseExpression;
    this.whenThenParts = options.whenThenParts;
    this.elseExpression = options.elseExpression;
  }

  public valueOf(): SqlCaseValue {
    const value = super.valueOf() as SqlCaseValue;
    value.caseExpression = this.caseExpression;
    value.whenThenParts = this.whenThenParts;
    value.elseExpression = this.elseExpression;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.getKeyword('case', SqlCase.DEFAULT_CASE_KEYWORD),
      this.getSpace('postCase'),
    ];

    if (this.caseExpression) {
      rawParts.push(this.caseExpression.toString(), this.getSpace('postCaseExpression'));
    }

    rawParts.push(this.whenThenParts.toString(SPACE));

    if (this.elseExpression) {
      rawParts.push(
        this.getSpace('preElse'),
        this.getKeyword('else', SqlCase.DEFAULT_ELSE_KEYWORD),
        this.getSpace('postElse'),
        this.elseExpression.toString(),
      );
    }

    rawParts.push(this.getSpace('preEnd'), this.getKeyword('end', SqlCase.DEFAULT_END_KEYWORD));

    return rawParts.join('');
  }

  public changeCaseExpression(caseExpression: SqlExpression): this {
    const value = this.valueOf();
    value.caseExpression = caseExpression;
    return SqlBase.fromValue(value);
  }

  public changeWhenThenParts(whenThenParts: SeparatedArray<SqlWhenThenPart>): this {
    const value = this.valueOf();
    value.whenThenParts = whenThenParts;
    return SqlBase.fromValue(value);
  }

  public changeElseExpression(elseExpression: SqlExpression): this {
    const value = this.valueOf();
    value.elseExpression = elseExpression;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    if (this.caseExpression) {
      const caseExpression = this.caseExpression._walkHelper(nextStack, fn, postorder);
      if (!caseExpression) return;
      if (caseExpression !== this.caseExpression) {
        ret = ret.changeCaseExpression(caseExpression);
      }
    }

    const whenThenParts = SqlBase.walkSeparatedArray(this.whenThenParts, nextStack, fn, postorder);
    if (!whenThenParts) return;
    if (whenThenParts !== this.whenThenParts) {
      ret = ret.changeWhenThenParts(whenThenParts);
    }

    if (this.elseExpression) {
      const elseExpression = this.elseExpression._walkHelper(nextStack, fn, postorder);
      if (!elseExpression) return;
      if (elseExpression !== this.elseExpression) {
        ret = ret.changeElseExpression(elseExpression);
      }
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.whenThenParts = this.whenThenParts.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlCase);
