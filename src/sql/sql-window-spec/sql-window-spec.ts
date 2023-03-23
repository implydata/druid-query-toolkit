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

import { SqlBase, SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlOrderByClause } from '../sql-clause';
import { SqlPartitionByClause } from '../sql-clause/sql-partition-by-clause/sql-partition-by-clause';
import { RefName } from '../utils';

export interface SqlWindowSpecValue extends SqlBaseValue {
  windowName?: RefName;
  orderByClause?: SqlOrderByClause;
  partitionByClause?: SqlPartitionByClause;
}

export class SqlWindowSpec extends SqlBase {
  static type: SqlTypeDesignator = 'windowSpec';

  public readonly windowName?: RefName;
  public readonly orderByClause?: SqlOrderByClause;
  public readonly partitionByClause?: SqlPartitionByClause;

  constructor(options: SqlWindowSpecValue) {
    super(options, SqlWindowSpec.type);
    this.windowName = options.windowName;
    this.orderByClause = options.orderByClause;
    this.partitionByClause = options.partitionByClause;
  }

  public valueOf(): SqlWindowSpecValue {
    const value = super.valueOf() as SqlWindowSpecValue;
    value.windowName = this.windowName;
    value.orderByClause = this.orderByClause;
    value.partitionByClause = this.partitionByClause;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = ['(', this.getSpace('postLeftParen')];

    if (this.windowName) {
      rawParts.push(this.windowName.toString(), this.getSpace('postWindowName'));
    }

    if (this.orderByClause) {
      rawParts.push(this.orderByClause.toString(), this.getSpace('postOrderBy'));
    }

    if (this.partitionByClause) {
      rawParts.push(this.partitionByClause.toString(), this.getSpace('postPartitionBy'));
    }

    rawParts.push(')');

    return rawParts.join('');
  }

  public changeWindowName(windowName: RefName | string | undefined): this {
    const value = this.valueOf();
    if (windowName) {
      value.windowName = RefName.create(windowName);
    } else {
      value.spacing = this.getSpacingWithout('postWindowName');
    }
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

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlWindowSpec | undefined {
    let ret = this;

    if (this.orderByClause) {
      const orderByClause = this.orderByClause._walkHelper(nextStack, fn, postorder);
      if (!orderByClause) return;
      if (orderByClause !== this.orderByClause) {
        ret = ret.changeOrderByClause(orderByClause as SqlOrderByClause);
      }
    }

    return ret;
  }

  // public clearOwnSeparators(): this {
  //   const value = this.valueOf();
  //
  //   value.expressions = this.expressions.clearSeparators();
  //
  //   if (this.joinParts) {
  //     value.joinParts = this.joinParts.clearSeparators();
  //   }
  //
  //   return SqlBase.fromValue(value);
  // }
}

SqlBase.register(SqlWindowSpec);
