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

import type { SeparatedArray } from '../helpers';
import { NEWLINE } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlWithClause, SqlWithPart } from '../sql-clause';
import { SqlQuery } from '../sql-query/sql-query';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';

export interface SqlWithQueryValue extends SqlQueryBaseValue {
  withClause: SqlWithClause;
  query: SqlQueryBase;
}

export class SqlWithQuery extends SqlQueryBase {
  static type: SqlTypeDesignator = 'withQuery';

  public readonly withClause: SqlWithClause;
  public readonly query: SqlQueryBase;

  constructor(options: SqlWithQueryValue) {
    super(options, SqlWithQuery.type);
    this.withClause = options.withClause;
    this.query = options.query;
  }

  public valueOf(): SqlWithQueryValue {
    const value = super.valueOf() as SqlWithQueryValue;
    value.withClause = this.withClause;
    value.query = this.query;
    return value;
  }

  protected _toRawBodyString(): string {
    const { withClause, query } = this;

    return [withClause.toString(), this.getSpace('postWithClause', NEWLINE), query.toString()].join(
      '',
    );
  }

  public changeWithClause(withClause: SqlWithClause): this {
    if (this.withClause === withClause) return this;
    const value = this.valueOf();
    value.withClause = withClause;
    return SqlBase.fromValue(value);
  }

  public changeQuery(query: SqlQueryBase): this {
    if (this.query === query) return this;
    const value = this.valueOf();
    value.query = query;
    return SqlBase.fromValue(value);
  }

  protected _walkInnerBody(
    ret: this,
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): this | undefined {
    const withClause = this.withClause._walkHelper(nextStack, fn, postorder);
    if (!withClause) return;
    if (withClause !== this.withClause) {
      ret = ret.changeWithClause(withClause as SqlWithClause);
    }

    const query = this.query._walkHelper(nextStack, fn, postorder);
    if (!query) return;
    if (query !== this.query) {
      ret = ret.changeQuery(query as SqlQueryBase);
    }

    return ret;
  }

  /* ~~~~~ WITH ~~~~~ */

  public getWithParts(): readonly SqlWithPart[] {
    const { withClause } = this;
    return withClause.withParts.values;
  }

  public changeWithParts(withParts: SeparatedArray<SqlWithPart> | SqlWithPart[]): this {
    return this.changeWithClause(
      this.withClause
        ? this.withClause.changeWithParts(withParts)
        : SqlWithClause.create(withParts),
    );
  }

  public prependWith(name: string, query: SqlQuery): this {
    return this.changeWithParts(
      [SqlWithPart.simple(name, query.ensureParens())].concat(this.getWithParts()),
    );
  }

  public flattenWith(): SqlQueryBase {
    const innerFlatQuery = this.query.flattenWith();

    // Only a SqlQuery can absorb a WITH clause, anything else (VALUES, TABLE <ref>) has
    // nowhere to put it, so leave such a query as it is.
    if (!(innerFlatQuery instanceof SqlQuery)) return this;

    let flatQuery = innerFlatQuery
      .changeParens([])
      .changeSpaces({ initial: this.spacing['initial'], final: this.spacing['final'] });

    flatQuery = flatQuery.changeWithParts(this.getWithParts().concat(flatQuery.getWithParts()));

    if (this.insertClause) {
      flatQuery = flatQuery.changeInsertClause(this.insertClause);
    } else if (this.replaceClause) {
      flatQuery = flatQuery.changeReplaceClause(this.replaceClause);
    }

    if (this.orderByClause) {
      flatQuery = flatQuery.changeOrderByClause(this.orderByClause);
    }

    if (this.limitClause) {
      flatQuery = flatQuery.combineWithLimitClause(this.limitClause);
    }

    if (this.offsetClause) {
      flatQuery = flatQuery.combineWithOffsetClause(this.offsetClause);
    }

    if (this.partitionedByClause) {
      flatQuery = flatQuery.changePartitionedByClause(this.partitionedByClause);
    }

    if (this.clusteredByClause) {
      flatQuery = flatQuery.changeClusteredByClause(this.clusteredByClause);
    }

    return flatQuery;
  }
}

SqlBase.register(SqlWithQuery);
