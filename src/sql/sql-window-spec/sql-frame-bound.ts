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

import type { SqlBaseValue, SqlTypeDesignator } from '../sql-base';
import { SqlBase } from '../sql-base';

export type BoundValue = number | 'unbounded' | 'currentRow';

export interface SqlFrameBoundValue extends SqlBaseValue {
  boundValue: BoundValue;
  following?: boolean;
}

export class SqlFrameBound extends SqlBase {
  static type: SqlTypeDesignator = 'frameBound';

  static DEFAULT_CURRENT_ROW_KEYWORD = 'CURRENT ROW';
  static DEFAULT_UNBOUNDED_KEYWORD = 'UNBOUNDED';
  static DEFAULT_PRECEDING_KEYWORD = 'PRECEDING';
  static DEFAULT_FOLLOWING_KEYWORD = 'FOLLOWING';

  static CURRENT_ROW: SqlFrameBound;

  static preceding(n: number | 'unbounded') {
    return new SqlFrameBound({
      boundValue: n,
      following: false,
    });
  }

  static following(n: number | 'unbounded') {
    return new SqlFrameBound({
      boundValue: n,
      following: true,
    });
  }

  public readonly boundValue: BoundValue;
  public readonly following?: boolean;

  constructor(options: SqlFrameBoundValue) {
    super(options, SqlFrameBound.type);
    this.boundValue = options.boundValue;
    this.following = options.following;
  }

  public valueOf(): SqlFrameBoundValue {
    const value = super.valueOf() as SqlFrameBoundValue;
    value.boundValue = this.boundValue;
    value.following = this.following;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [];

    if (this.boundValue === 'currentRow') {
      rawParts.push(this.getKeyword('currentRow', SqlFrameBound.DEFAULT_CURRENT_ROW_KEYWORD));
    } else {
      if (this.boundValue === 'unbounded') {
        rawParts.push(this.getKeyword('unbounded', SqlFrameBound.DEFAULT_UNBOUNDED_KEYWORD));
      } else {
        rawParts.push(String(this.boundValue));
      }

      rawParts.push(
        this.getSpace('postBoundValue'),
        this.following
          ? this.getKeyword('following', SqlFrameBound.DEFAULT_FOLLOWING_KEYWORD)
          : this.getKeyword('preceding', SqlFrameBound.DEFAULT_PRECEDING_KEYWORD),
      );
    }

    return rawParts.join('');
  }
}

SqlBase.register(SqlFrameBound);

SqlFrameBound.CURRENT_ROW = new SqlFrameBound({ boundValue: 'currentRow' });
