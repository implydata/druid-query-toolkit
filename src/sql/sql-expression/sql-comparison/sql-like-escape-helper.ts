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
import { SqlExpression, SqlLiteral } from '..';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../../sql-base';

export interface SqlLikeEscapeHelperValue extends SqlBaseValue {
  like: SqlExpression;
  escape: SqlExpression;
}

export class SqlLikeEscapeHelper extends SqlBase {
  static type: SqlType = 'likeEscapeHelper';

  static DEFAULT_ESCAPE_KEYWORD = 'ESCAPE';

  static create(like: SqlExpression | string, escape: SqlExpression | string): SqlLikeEscapeHelper {
    const likeEx: SqlExpression = typeof like === 'string' ? SqlLiteral.create(like) : like;
    const escapeEx: SqlExpression = typeof escape === 'string' ? SqlLiteral.create(escape) : escape;
    return new SqlLikeEscapeHelper({
      like: likeEx,
      escape: escapeEx,
    });
  }

  public readonly like: SqlExpression;
  public readonly escape: SqlExpression;

  constructor(options: SqlLikeEscapeHelperValue) {
    super(options, SqlLikeEscapeHelper.type);
    this.like = options.like;
    this.escape = options.escape;
  }

  public valueOf(): SqlLikeEscapeHelperValue {
    const value = super.valueOf() as SqlLikeEscapeHelperValue;
    value.like = this.like;
    value.escape = this.escape;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.like.toString(),
      this.getSpace('preEscape'),
      this.getKeyword('escape', SqlLikeEscapeHelper.DEFAULT_ESCAPE_KEYWORD),
      this.getSpace('postEscape'),
      this.escape.toString(),
    ];

    return rawParts.join('');
  }

  public changeLike(like: SqlLiteral): this {
    const value = this.valueOf();
    value.like = like;
    return SqlBase.fromValue(value);
  }

  public changeEscape(escape: SqlLiteral): this {
    const value = this.valueOf();
    value.escape = escape;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const like = ret.like._walkHelper(nextStack, fn, postorder);
    if (!like) return;
    if (like !== ret.like) {
      ret = ret.changeLike(like as SqlLiteral);
    }

    const escape = ret.escape._walkHelper(nextStack, fn, postorder);
    if (!escape) return;
    if (escape !== ret.escape) {
      ret = ret.changeEscape(escape as SqlLiteral);
    }

    return ret;
  }
}

SqlBase.register(SqlLikeEscapeHelper);
