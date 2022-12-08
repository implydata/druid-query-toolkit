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

import { isEmptyArray } from '../../utils';
import { SqlBase, SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { LiteralValue } from '../sql-literal/sql-literal';
import { SeparatedArray, Separator } from '../utils';

export interface SqlRecordValue extends SqlBaseValue {
  expressions?: SeparatedArray<SqlExpression>;
}

export class SqlRecord extends SqlExpression {
  static type: SqlTypeDesignator = 'record';

  static DEFAULT_ROW_KEYWORD = 'ROW';

  static create(
    expressions?: SqlRecord | SeparatedArray<SqlExpression> | SqlExpression[],
  ): SqlRecord {
    if (expressions instanceof SqlRecord) return expressions;
    return new SqlRecord({
      expressions:
        !expressions || isEmptyArray(expressions)
          ? undefined
          : SeparatedArray.fromArray(expressions, Separator.COMMA),
    });
  }

  static createWithoutKeyword(
    expressions?: SqlRecord | SeparatedArray<SqlExpression> | SqlExpression[],
  ): SqlRecord {
    if (expressions instanceof SqlRecord) return expressions;
    return new SqlRecord({
      keywords: {
        row: '',
      },
      expressions:
        !expressions || isEmptyArray(expressions)
          ? undefined
          : SeparatedArray.fromArray(expressions, Separator.COMMA),
    });
  }

  public readonly expressions?: SeparatedArray<SqlExpression>;

  constructor(options: SqlRecordValue) {
    super(options, SqlRecord.type);
    this.expressions = options.expressions;
  }

  public valueOf(): SqlRecordValue {
    const value = super.valueOf() as SqlRecordValue;
    value.expressions = this.expressions;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.getKeyword(
        'row',
        this.expressions?.length() === 1 ? SqlRecord.DEFAULT_ROW_KEYWORD : '',
        'postRow',
        '',
      ),
    ];

    rawParts.push('(', this.getSpace('postLeftParen', ''));

    if (this.expressions) {
      rawParts.push(
        this.expressions.toString(Separator.COMMA),
        this.getSpace('postExpressions', ''),
      );
    }

    rawParts.push(')');

    return rawParts.join('');
  }

  public changeExpressions(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    const value = this.valueOf();
    if (!expressions || isEmptyArray(expressions)) {
      delete value.expressions;
    } else {
      value.expressions = SeparatedArray.fromArray(expressions, Separator.COMMA);
    }
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    if (this.expressions) {
      const expressions = SqlBase.walkSeparatedArray(this.expressions, nextStack, fn, postorder);
      if (!expressions) return;
      if (expressions !== this.expressions) {
        ret = ret.changeExpressions(expressions);
      }
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    if (!this.expressions) return this;
    const value = this.valueOf();
    value.expressions = this.expressions.clearSeparators();
    return SqlBase.fromValue(value);
  }

  public prepend(expression: SqlExpression | LiteralValue): SqlRecord {
    const { expressions } = this;
    const ex = SqlExpression.wrap(expression);
    return this.changeExpressions(
      expressions ? expressions.prepend(ex) : SeparatedArray.fromSingleValue(ex),
    );
  }

  public append(expression: SqlExpression | LiteralValue): SqlRecord {
    const { expressions } = this;
    const ex = SqlExpression.wrap(expression);
    return this.changeExpressions(
      expressions ? expressions.append(ex) : SeparatedArray.fromSingleValue(ex),
    );
  }

  public unwrapIfSingleton(): SqlExpression {
    const { expressions } = this;
    if (expressions?.length() !== 1 || this.keywords.row) return this;
    return expressions
      .get(0)!
      .addParens(this.getSpace('postLeftParen', ''), this.getSpace('postExpressions', ''));
  }
}

SqlBase.register(SqlRecord);
