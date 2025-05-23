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

import type { SqlBaseValue, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';

export interface SqlClauseValue extends SqlBaseValue {}

export abstract class SqlClause extends SqlBase {
  public _walkHelper(stack: SqlBase[], fn: Substitutor, postorder: boolean): SqlClause | undefined {
    const ret = super._walkHelper(stack, fn, postorder);
    if (!ret) return;
    if (ret === this) return this;
    if (ret instanceof SqlClause) {
      return ret;
    } else {
      throw new Error('must return a sql clause');
    }
  }

  public _walkInner(
    _nextStack: SqlBase[],
    _fn: Substitutor,
    _postorder: boolean,
  ): SqlClause | undefined {
    return this;
  }
}
