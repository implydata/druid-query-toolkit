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

import { SPACE } from '../helpers';
import type { SqlBaseValue, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';

export interface SqlPipeOperatorValue extends SqlBaseValue {}

/**
 * The common base of the pipe operators, the `|> ...` steps of a pipe syntax query. Each
 * operator renders its own `|>` so it prints on its own as `|> WHERE x`.
 */
export abstract class SqlPipeOperator extends SqlBase {
  static PIPE = '|>';

  protected _toRawString(): string {
    return [
      SqlPipeOperator.PIPE,
      this.getSpace('postPipe', SPACE),
      this._toRawOperatorString(),
    ].join('');
  }

  /**
   * The part of the operator that comes after the `|>`.
   */
  protected abstract _toRawOperatorString(): string;

  public _walkHelper(
    stack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    const ret = super._walkHelper(stack, fn, postorder);
    if (!ret) return;
    if (ret === this) return this;
    if (ret instanceof SqlPipeOperator) {
      return ret;
    } else {
      throw new Error('must return a sql pipe operator');
    }
  }

  public abstract _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined;
}
