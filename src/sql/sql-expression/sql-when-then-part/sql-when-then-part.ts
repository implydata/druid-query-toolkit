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

import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SqlExpression } from '../sql-expression';

export interface SqlWhenThenPartValue extends SqlBaseValue {
  whenKeyword: string;
  postWhenSpace: string;
  whenExpression: SqlExpression;
  postWhenExpressionSpace: string;
  thenKeyword: string;
  postThenSpace: string;
  thenExpression: SqlExpression;
}

export class SqlWhenThenPart extends SqlBase {
  static type = 'whenThenPart';

  public readonly whenKeyword: string;
  public readonly postWhenSpace: string;
  public readonly whenExpression: SqlExpression;
  public readonly postWhenExpressionSpace: string;
  public readonly thenKeyword: string;
  public readonly postThenSpace: string;
  public readonly thenExpression: SqlExpression;

  constructor(options: SqlWhenThenPartValue) {
    super(options, SqlWhenThenPart.type);
    this.whenKeyword = options.whenKeyword;
    this.postWhenSpace = options.postWhenSpace;
    this.whenExpression = options.whenExpression;
    this.postWhenExpressionSpace = options.postWhenExpressionSpace;
    this.thenKeyword = options.thenKeyword;
    this.postThenSpace = options.postThenSpace;
    this.thenExpression = options.thenExpression;
  }

  public toRawString(): string {
    return [
      this.whenKeyword,
      this.getInnerSpace('postWhen'),
      this.whenExpression.toString(),
      this.getInnerSpace('postWhenExpression'),
      this.thenKeyword,
      this.getInnerSpace('postThen'),
      this.thenExpression,
    ].join('');
  }

  public walk(fn: (t: SqlBase) => void) {
    super.walk(fn);
    this.whenExpression.walk(fn);
    this.thenExpression.walk(fn);
  }
}

SqlBase.register(SqlWhenThenPart.type, SqlWhenThenPart);
