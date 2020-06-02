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
import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SeparatedArray } from '../../utils';
import { SqlExpression } from '../sql-expression';

export interface SqlCaseSimpleValue extends SqlBaseValue {
  caseKeyword: string;
  caseExpression: SqlExpression;
  whenThenParts: SeparatedArray<SqlWhenThenPart>;
  elseKeyword?: string;
  elseExpression?: SqlExpression;
  endKeyword: string;
}

export class SqlCaseSimple extends SqlExpression {
  static type = 'caseSimple';

  public readonly caseKeyword: string;
  public readonly caseExpression: SqlExpression;
  public readonly whenThenParts: SeparatedArray<SqlWhenThenPart>;
  public readonly elseKeyword?: string;
  public readonly elseExpression?: SqlExpression;
  public readonly endKeyword: string;

  constructor(options: SqlCaseSimpleValue) {
    super(options, SqlCaseSimple.type);
    this.caseKeyword = options.caseKeyword;
    this.caseExpression = options.caseExpression;
    this.whenThenParts = options.whenThenParts;
    this.elseKeyword = options.elseKeyword;
    this.elseExpression = options.elseExpression;
    this.endKeyword = options.endKeyword;
  }

  public valueOf(): SqlCaseSimpleValue {
    const value = super.valueOf() as SqlCaseSimpleValue;
    value.caseKeyword = this.caseKeyword;
    value.caseExpression = this.caseExpression;
    value.whenThenParts = this.whenThenParts;
    value.elseKeyword = this.elseKeyword;
    value.elseExpression = this.elseExpression;
    value.endKeyword = this.endKeyword;
    return value;
  }

  public toRawString(): string {
    const rawParts: string[] = [
      this.caseKeyword.toString(),
      this.getInnerSpace('postCase'),
      this.caseExpression.toString(),
      this.getInnerSpace('postCaseExpression'),
    ];

    if (this.whenThenParts) {
      rawParts.push(this.whenThenParts.toString(), this.getInnerSpace('postWhenThen'));
    }

    if (this.elseKeyword && this.elseExpression) {
      rawParts.push(
        this.elseKeyword,
        this.getInnerSpace('postElse'),
        this.elseExpression.toString(),
      );
    }

    rawParts.push(this.getInnerSpace('preEnd'), this.endKeyword);

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

  public walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const caseExpression = this.caseExpression.walkHelper(nextStack, fn, postorder);
    if (!caseExpression) return;
    if (caseExpression !== this.caseExpression) {
      ret = ret.changeCaseExpression(caseExpression);
    }

    const whenThenParts = SqlBase.walkSeparatedArray(this.whenThenParts, nextStack, fn, postorder);
    if (!whenThenParts) return;
    if (whenThenParts !== this.whenThenParts) {
      ret = ret.changeWhenThenParts(whenThenParts);
    }

    if (this.elseExpression) {
      const elseExpression = this.elseExpression.walkHelper(nextStack, fn, postorder);
      if (!elseExpression) return;
      if (elseExpression !== this.elseExpression) {
        ret = ret.changeElseExpression(elseExpression);
      }
    }

    return ret;
  }
}

SqlBase.register(SqlCaseSimple.type, SqlCaseSimple);
