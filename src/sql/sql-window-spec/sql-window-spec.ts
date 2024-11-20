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

import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlOrderByClause } from '../sql-clause';
import type { SqlPartitionByClause } from '../sql-clause/sql-partition-by-clause/sql-partition-by-clause';
import { RefName } from '../utils';

import type { SqlFrameBound } from './sql-frame-bound';

export type FrameType = 'rows' | 'range';

export interface SqlWindowSpecValue extends SqlBaseValue {
  windowName?: RefName;
  partitionByClause?: SqlPartitionByClause;
  orderByClause?: SqlOrderByClause;
  frameType?: FrameType;
  frameBound1?: SqlFrameBound;
  frameBound2?: SqlFrameBound;
}

export class SqlWindowSpec extends SqlBase {
  static DEFAULT_ROWS_KEYWORD = 'ROWS';
  static DEFAULT_RANGE_KEYWORD = 'RANGE';
  static DEFAULT_BETWEEN_KEYWORD = 'BETWEEN';
  static DEFAULT_AND_KEYWORD = 'AND';

  static type: SqlTypeDesignator = 'windowSpec';

  public readonly windowName?: RefName;
  public readonly partitionByClause?: SqlPartitionByClause;
  public readonly orderByClause?: SqlOrderByClause;
  public readonly frameType?: FrameType;
  public readonly frameBound1?: SqlFrameBound;
  public readonly frameBound2?: SqlFrameBound;

  constructor(options: SqlWindowSpecValue) {
    super(options, SqlWindowSpec.type);
    this.windowName = options.windowName;
    this.partitionByClause = options.partitionByClause;
    this.orderByClause = options.orderByClause;
    this.frameType = options.frameType;
    this.frameBound1 = options.frameBound1;
    this.frameBound2 = options.frameBound2;
  }

  public valueOf(): SqlWindowSpecValue {
    const value = super.valueOf() as SqlWindowSpecValue;
    value.windowName = this.windowName;
    value.partitionByClause = this.partitionByClause;
    value.orderByClause = this.orderByClause;
    value.frameType = this.frameType;
    value.frameBound1 = this.frameBound1;
    value.frameBound2 = this.frameBound2;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = ['(', this.getSpace('postLeftParen')];

    if (this.windowName) {
      rawParts.push(this.windowName.toString(), this.getSpace('postWindowName'));
    }

    if (this.partitionByClause) {
      rawParts.push(this.partitionByClause.toString(), this.getSpace('postPartitionBy'));
    }

    if (this.orderByClause) {
      rawParts.push(this.orderByClause.toString(), this.getSpace('postOrderBy'));
    }

    if (this.frameType && this.frameBound1) {
      rawParts.push(
        this.frameType === 'rows'
          ? this.getKeyword('rows', SqlWindowSpec.DEFAULT_ROWS_KEYWORD)
          : this.getKeyword('range', SqlWindowSpec.DEFAULT_RANGE_KEYWORD),
        this.getSpace('postFrameType'),
      );

      if (this.frameBound2) {
        rawParts.push(
          this.getKeyword('between', SqlWindowSpec.DEFAULT_BETWEEN_KEYWORD),
          this.getSpace('postBetween'),
        );
      }

      rawParts.push(this.frameBound1.toString());

      if (this.frameBound2) {
        rawParts.push(
          this.getSpace('preAnd'),
          this.getKeyword('and', SqlWindowSpec.DEFAULT_AND_KEYWORD),
          this.getSpace('postAnd'),
          this.frameBound2.toString(),
        );
      }

      rawParts.push(this.getSpace('postFrame'));
    }

    rawParts.push(')');

    return rawParts.join('');
  }

  public changeWindowName(windowName: RefName | string | undefined): this {
    const value = this.valueOf();
    if (windowName) {
      value.windowName = RefName.create(windowName);
    } else {
      delete value.windowName;
      value.spacing = this.getSpacingWithout('postWindowName');
    }
    return SqlBase.fromValue(value);
  }

  public changePartitionByClause(partitionByClause: SqlPartitionByClause | undefined): this {
    if (this.partitionByClause === partitionByClause) return this;
    const value = this.valueOf();
    if (partitionByClause) {
      value.partitionByClause = partitionByClause;
    } else {
      delete value.partitionByClause;
      value.spacing = this.getSpacingWithout('postPartitionBy');
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
      value.spacing = this.getSpacingWithout('postOrderBy');
    }
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlWindowSpec | undefined {
    let ret = this;

    if (this.partitionByClause) {
      const partitionByClause = this.partitionByClause._walkHelper(nextStack, fn, postorder);
      if (!partitionByClause) return;
      if (partitionByClause !== this.partitionByClause) {
        ret = ret.changePartitionByClause(partitionByClause as SqlPartitionByClause);
      }
    }

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
