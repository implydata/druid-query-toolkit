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

import { SqlWhenThenPart } from '..';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../../sql-base';
import { SeparatedArray } from '../../utils';
import { SqlExpression } from '../sql-expression';

export interface SqlCaseValue extends SqlBaseValue {
  caseKeyword?: string;
  caseExpression?: SqlExpression;
  whenThenParts: SeparatedArray<SqlWhenThenPart>;
  elseKeyword?: string;
  elseExpression?: SqlExpression;
  endKeyword?: string;
}

export class SqlCase extends SqlExpression {
  static type: SqlType = 'case';

  static DEFAULT_CASE_KEYWORD = 'CASE';
  static DEFAULT_ELSE_KEYWORD = 'ELSE';
  static DEFAULT_END_KEYWORD = 'END';

  static ifThenElse(
    conditionExpression: SqlExpression,
    thenExpression: SqlExpression,
    elseExpression?: SqlExpression,
  ) {
    return new SqlCase({
      whenThenParts: SeparatedArray.fromSingleValue(
        SqlWhenThenPart.create(conditionExpression, thenExpression),
      ),
      elseExpression,
    });
  }

  public readonly caseKeyword?: string;
  public readonly caseExpression?: SqlExpression;
  public readonly whenThenParts: SeparatedArray<SqlWhenThenPart>;
  public readonly elseKeyword?: string;
  public readonly elseExpression?: SqlExpression;
  public readonly endKeyword?: string;

  constructor(options: SqlCaseValue) {
    super(options, SqlCase.type);
    this.caseKeyword = options.caseKeyword;
    this.caseExpression = options.caseExpression;
    this.whenThenParts = options.whenThenParts;
    this.elseKeyword = options.elseKeyword;
    this.elseExpression = options.elseExpression;
    this.endKeyword = options.endKeyword;
  }

  public valueOf(): SqlCaseValue {
    const value = super.valueOf() as SqlCaseValue;
    value.caseKeyword = this.caseKeyword;
    value.caseExpression = this.caseExpression;
    value.whenThenParts = this.whenThenParts;
    value.elseKeyword = this.elseKeyword;
    value.elseExpression = this.elseExpression;
    value.endKeyword = this.endKeyword;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.caseKeyword || SqlCase.DEFAULT_CASE_KEYWORD,
      this.getInnerSpace('postCase'),
    ];

    if (this.caseExpression) {
      rawParts.push(this.caseExpression.toString(), this.getInnerSpace('postCaseExpression'));
    }

    rawParts.push(this.whenThenParts.toString(' '));

    if (this.elseExpression) {
      rawParts.push(
        this.getInnerSpace('preElse'),
        this.elseKeyword || SqlCase.DEFAULT_ELSE_KEYWORD,
        this.getInnerSpace('postElse'),
        this.elseExpression.toString(),
      );
    }

    rawParts.push(this.getInnerSpace('preEnd'), this.endKeyword || SqlCase.DEFAULT_END_KEYWORD);

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

  public clearOwnStaticKeywords(): this {
    const value = this.valueOf();
    delete value.caseKeyword;
    delete value.endKeyword;
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlCase);
