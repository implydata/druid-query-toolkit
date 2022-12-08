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
import {
  SqlLimitClause,
  SqlOffsetClause,
  SqlOrderByClause,
  SqlOrderByExpression,
} from '../sql-clause';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';
import { SqlRecord } from '../sql-record/sql-record';
import { SeparatedArray, Separator } from '../utils';

export interface SqlValuesValue extends SqlBaseValue {
  records: SeparatedArray<SqlRecord>;
  orderByClause?: SqlOrderByClause;
  limitClause?: SqlLimitClause;
  offsetClause?: SqlOffsetClause;
}

export class SqlValues extends SqlExpression {
  static type: SqlTypeDesignator = 'values';

  static DEFAULT_VALUES_KEYWORD = 'VALUES';

  static create(records: SqlValues | SeparatedArray<SqlRecord> | SqlRecord[]): SqlValues {
    if (records instanceof SqlValues) return records;
    return new SqlValues({
      records: SeparatedArray.fromArray(records),
    }).ensureParens();
  }

  public readonly records: SeparatedArray<SqlRecord>;
  public readonly orderByClause?: SqlOrderByClause;
  public readonly limitClause?: SqlLimitClause;
  public readonly offsetClause?: SqlOffsetClause;

  constructor(options: SqlValuesValue) {
    super(options, SqlValues.type);
    this.records = options.records;
    this.orderByClause = options.orderByClause;
    this.limitClause = options.limitClause;
    this.offsetClause = options.offsetClause;
  }

  public valueOf(): SqlValuesValue {
    const value = super.valueOf() as SqlValuesValue;
    value.records = this.records;
    value.orderByClause = this.orderByClause;
    value.limitClause = this.limitClause;
    value.offsetClause = this.offsetClause;
    return value;
  }

  protected _toRawString(): string {
    const { records, orderByClause, limitClause, offsetClause } = this;

    const multiline = records.length() > 1;
    const rawParts: string[] = [
      this.getKeyword('values', SqlValues.DEFAULT_VALUES_KEYWORD),
      this.getSpace('postValues', multiline ? '\n' : ' '),
      records.toString(multiline ? Separator.COMMA_NEW_LINE : Separator.COMMA),
    ];

    if (orderByClause) {
      rawParts.push(this.getSpace('preOrderByClause', '\n'), orderByClause.toString());
    }

    if (limitClause) {
      rawParts.push(this.getSpace('preLimitClause', '\n'), limitClause.toString());
    }

    if (offsetClause) {
      rawParts.push(this.getSpace('preOffsetClause', '\n'), offsetClause.toString());
    }

    return rawParts.join('');
  }

  public changeRecords(records: SeparatedArray<SqlRecord> | SqlRecord[]): this {
    const value = this.valueOf();
    value.records = SeparatedArray.fromArray(records, Separator.COMMA);
    return SqlBase.fromValue(value);
  }

  public changeOrderByClause(orderByClause: SqlOrderByClause | undefined): this {
    if (this.orderByClause === orderByClause) return this;
    const value = this.valueOf();
    if (orderByClause) {
      value.orderByClause = orderByClause;
    } else {
      delete value.orderByClause;
      value.spacing = this.getSpacingWithout('preOrderByClause');
    }
    return SqlBase.fromValue(value);
  }

  public changeOrderByExpressions(
    orderByExpressions: SeparatedArray<SqlOrderByExpression> | SqlOrderByExpression[] | undefined,
  ): this {
    if (!orderByExpressions || isEmptyArray(orderByExpressions)) {
      return this.changeOrderByClause(undefined);
    } else {
      return this.changeOrderByClause(
        this.orderByClause
          ? this.orderByClause.changeExpressions(orderByExpressions)
          : SqlOrderByClause.create(orderByExpressions),
      );
    }
  }

  public changeOrderByExpression(orderByExpression: SqlOrderByExpression | undefined): this {
    if (!orderByExpression) return this.changeOrderByClause(undefined);
    return this.changeOrderByExpressions([orderByExpression]);
  }

  public changeLimitClause(limitClause: SqlLimitClause | undefined): this {
    if (this.limitClause === limitClause) return this;
    const value = this.valueOf();
    if (limitClause) {
      value.limitClause = limitClause;
    } else {
      delete value.limitClause;
      value.spacing = this.getSpacingWithout('preLimitClause');
    }
    return SqlBase.fromValue(value);
  }

  public changeLimitValue(limitValue: SqlLiteral | number | undefined): this {
    if (typeof limitValue === 'undefined') return this.changeLimitClause(undefined);
    return this.changeLimitClause(
      this.limitClause
        ? this.limitClause.changeLimit(limitValue)
        : SqlLimitClause.create(limitValue),
    );
  }

  public changeOffsetClause(offsetClause: SqlOffsetClause | undefined): this {
    if (this.offsetClause === offsetClause) return this;
    const value = this.valueOf();
    if (offsetClause) {
      value.offsetClause = offsetClause;
    } else {
      delete value.offsetClause;
      value.spacing = this.getSpacingWithout('preOffsetClause');
    }
    return SqlBase.fromValue(value);
  }

  public changeOffsetValue(offsetValue: SqlLiteral | number | undefined): this {
    if (typeof offsetValue === 'undefined') return this.changeOffsetClause(undefined);
    return this.changeOffsetClause(
      this.offsetClause
        ? this.offsetClause.changeOffset(offsetValue)
        : SqlOffsetClause.create(offsetValue),
    );
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const records = SqlBase.walkSeparatedArray(this.records, nextStack, fn, postorder);
    if (!records) return;
    if (records !== this.records) {
      ret = ret.changeRecords(records);
    }

    if (this.orderByClause) {
      const orderByClause = this.orderByClause._walkHelper(nextStack, fn, postorder);
      if (!orderByClause) return;
      if (orderByClause !== this.orderByClause) {
        ret = ret.changeOrderByClause(orderByClause as SqlOrderByClause);
      }
    }

    if (this.limitClause) {
      const limitClause = this.limitClause._walkHelper(nextStack, fn, postorder);
      if (!limitClause) return;
      if (limitClause !== this.limitClause) {
        ret = ret.changeLimitClause(limitClause as SqlLimitClause);
      }
    }

    if (this.offsetClause) {
      const offsetClause = this.offsetClause._walkHelper(nextStack, fn, postorder);
      if (!offsetClause) return;
      if (offsetClause !== this.offsetClause) {
        ret = ret.changeOffsetClause(offsetClause as SqlOffsetClause);
      }
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.records = this.records.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlValues);
