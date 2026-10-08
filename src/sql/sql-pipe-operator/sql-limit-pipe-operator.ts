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
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlLimitClause, SqlOffsetClause } from '../sql-clause';
import type { SqlLiteral } from '../sql-literal/sql-literal';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlLimitPipeOperatorValue extends SqlPipeOperatorValue {
  limitClause: SqlLimitClause;
  offsetClause?: SqlOffsetClause;
}

/**
 * The `|> LIMIT` pipe operator, which keeps a number of the input rows, optionally after
 * skipping some with `OFFSET`.
 */
export class SqlLimitPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'limitPipeOperator';

  static create(
    limit: SqlLimitClause | SqlLiteral | number,
    offset?: SqlOffsetClause | SqlLiteral | number,
  ): SqlLimitPipeOperator {
    return new SqlLimitPipeOperator({
      limitClause: limit instanceof SqlLimitClause ? limit : SqlLimitClause.create(limit),
      offsetClause:
        typeof offset === 'undefined' || offset instanceof SqlOffsetClause
          ? offset
          : SqlOffsetClause.create(offset),
    });
  }

  public readonly limitClause: SqlLimitClause;
  public readonly offsetClause?: SqlOffsetClause;

  constructor(options: SqlLimitPipeOperatorValue) {
    super(options, SqlLimitPipeOperator.type);
    this.limitClause = options.limitClause;
    this.offsetClause = options.offsetClause;
  }

  public valueOf(): SqlLimitPipeOperatorValue {
    const value = super.valueOf() as SqlLimitPipeOperatorValue;
    value.limitClause = this.limitClause;
    value.offsetClause = this.offsetClause;
    return value;
  }

  protected _toRawOperatorString(): string {
    const { limitClause, offsetClause } = this;
    const rawParts: string[] = [limitClause.toString()];
    if (offsetClause) {
      rawParts.push(this.getSpace('preOffsetClause', SPACE), offsetClause.toString());
    }
    return rawParts.join('');
  }

  public changeLimitClause(limitClause: SqlLimitClause): this {
    const value = this.valueOf();
    value.limitClause = limitClause;
    return SqlBase.fromValue(value);
  }

  public getLimitValue(): number {
    return this.limitClause.getLimitValue();
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

  public getOffsetValue(): number | undefined {
    return this.offsetClause?.getOffsetValue();
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const limitClause = this.limitClause._walkHelper(nextStack, fn, postorder);
    if (!limitClause) return;
    if (limitClause !== this.limitClause) {
      ret = ret.changeLimitClause(limitClause as SqlLimitClause);
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
}

SqlBase.register(SqlLimitPipeOperator);
