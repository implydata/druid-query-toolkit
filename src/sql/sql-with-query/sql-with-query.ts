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

import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../sql-base';
import {
  SqlExplainClause,
  SqlInsertClause,
  SqlLimitClause,
  SqlOffsetClause,
  SqlOrderByClause,
  SqlOrderByExpression,
  SqlWithClause,
  SqlWithPart,
} from '../sql-clause';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';
import { SqlQuery } from '../sql-query/sql-query';
import { SqlTableRef } from '../sql-table-ref/sql-table-ref';
import { SeparatedArray } from '../utils';

export interface SqlWithQueryValue extends SqlBaseValue {
  explainClause?: SqlExplainClause;
  insertClause?: SqlInsertClause;
  withClause: SqlWithClause;

  query: SqlQuery | SqlWithQuery;

  orderByClause?: SqlOrderByClause;
  limitClause?: SqlLimitClause;
  offsetClause?: SqlOffsetClause;
}

export class SqlWithQuery extends SqlExpression {
  static type: SqlType = 'withQuery';

  public readonly explainClause?: SqlExplainClause;
  public readonly insertClause?: SqlInsertClause;
  public readonly withClause: SqlWithClause;
  public readonly query: SqlQuery | SqlWithQuery;
  public readonly orderByClause?: SqlOrderByClause;
  public readonly limitClause?: SqlLimitClause;
  public readonly offsetClause?: SqlOffsetClause;

  constructor(options: SqlWithQueryValue) {
    super(options, SqlWithQuery.type);
    this.explainClause = options.explainClause;
    this.insertClause = options.insertClause;
    this.withClause = options.withClause;
    this.query = options.query;
    this.orderByClause = options.orderByClause;
    this.limitClause = options.limitClause;
    this.offsetClause = options.offsetClause;
  }

  public valueOf(): SqlWithQueryValue {
    const value = super.valueOf() as SqlWithQueryValue;
    value.explainClause = this.explainClause;
    value.insertClause = this.insertClause;
    value.withClause = this.withClause;
    value.query = this.query;
    value.orderByClause = this.orderByClause;
    value.limitClause = this.limitClause;
    value.offsetClause = this.offsetClause;
    return value;
  }

  protected _toRawString(): string {
    const {
      explainClause,
      insertClause,
      withClause,
      query,
      orderByClause,
      limitClause,
      offsetClause,
    } = this;

    const rawParts: string[] = [this.getSpace('preQuery', '')];

    // Explain clause
    if (explainClause) {
      rawParts.push(explainClause.toString(), this.getSpace('postExplainClause', '\n'));
    }

    // INSERT clause
    if (insertClause) {
      rawParts.push(insertClause.toString(), this.getSpace('postInsertClause', '\n'));
    }

    // WITH clause
    rawParts.push(withClause.toString(), this.getSpace('postWithClause', '\n'));

    // Sub query
    rawParts.push(query.toString());

    if (orderByClause) {
      rawParts.push(this.getSpace('preOrderByClause', '\n'), orderByClause.toString());
    }

    if (limitClause) {
      rawParts.push(this.getSpace('preLimitClause', '\n'), limitClause.toString());
    }

    if (offsetClause) {
      rawParts.push(this.getSpace('preOffsetClause', '\n'), offsetClause.toString());
    }

    rawParts.push(this.getSpace('postQuery', ''));

    return rawParts.join('');
  }

  public changeExplainClause(explainClause: SqlExplainClause | undefined): this {
    if (this.explainClause === explainClause) return this;
    const value = this.valueOf();
    if (explainClause) {
      value.explainClause = explainClause;
    } else {
      delete value.explainClause;
      value.spacing = this.getSpacingWithout('postExplainClause');
    }
    return SqlBase.fromValue(value);
  }

  public changeInsertClause(insertClause: SqlInsertClause | undefined): this {
    if (this.insertClause === insertClause) return this;
    const value = this.valueOf();
    if (insertClause) {
      value.insertClause = insertClause;
    } else {
      delete value.insertClause;
      value.spacing = this.getSpacingWithout('postInsertClause');
    }
    return SqlBase.fromValue(value);
  }

  public changeWithClause(withClause: SqlWithClause): this {
    if (this.withClause === withClause) return this;
    const value = this.valueOf();
    value.withClause = withClause;
    return SqlBase.fromValue(value);
  }

  public changeQuery(query: SqlQuery): this {
    if (this.query === query) return this;
    const value = this.valueOf();
    value.query = query;
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
    if (!orderByExpressions) return this.changeOrderByClause(undefined);
    return this.changeOrderByClause(
      this.orderByClause
        ? this.orderByClause.changeExpressions(orderByExpressions)
        : SqlOrderByClause.create(orderByExpressions),
    );
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
  ): SqlWithQuery | undefined {
    let ret: SqlWithQuery = this;

    if (this.insertClause) {
      const insertClause = this.insertClause._walkHelper(nextStack, fn, postorder);
      if (!insertClause) return;
      if (insertClause !== this.insertClause) {
        ret = ret.changeInsertClause(insertClause as SqlInsertClause);
      }
    }

    const withClause = this.withClause._walkHelper(nextStack, fn, postorder);
    if (!withClause) return;
    if (withClause !== this.withClause) {
      ret = ret.changeWithClause(withClause as SqlWithClause);
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

  /* ~~~~~ EXPLAIN ~~~~~ */

  public makeExplain(): this {
    if (this.explainClause) return this;
    return this.changeExplainClause(SqlExplainClause.create());
  }

  /* ~~~~~ INSERT ~~~~~ */

  public getInsertIntoTable(): SqlTableRef | undefined {
    return this.insertClause?.table;
  }

  public changeInsertIntoTable(table: SqlTableRef | string | undefined): this {
    const value = this.valueOf();
    value.insertClause = table
      ? value.insertClause
        ? value.insertClause.changeTable(table)
        : SqlInsertClause.create(table)
      : undefined;
    return SqlBase.fromValue(value);
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

  public flattenWith(): SqlQuery {
    let flatQuery = this.query.flattenWith().changeParens([]);

    flatQuery = flatQuery.changeWithParts(this.getWithParts().concat(flatQuery.getWithParts()));

    if (this.insertClause) {
      flatQuery = flatQuery.changeInsertClause(this.insertClause);
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

    return flatQuery;
  }

  /* ~~~~~ ORDER BY ~~~~~ */

  public hasOrderBy(): boolean {
    return Boolean(this.orderByClause);
  }

  public getOrderByExpressions(): readonly SqlOrderByExpression[] {
    const { orderByClause } = this;
    if (!orderByClause) return [];
    return orderByClause.expressions.values;
  }

  public getOrderByForExpression(ex: SqlExpression): SqlOrderByExpression | undefined {
    if (!this.orderByClause) return;
    return this.orderByClause.toArray().find(orderByExpression => {
      return orderByExpression.expression.equals(ex);
    });
  }

  public addOrderBy(orderBy: SqlOrderByExpression): this {
    return this.changeOrderByClause(
      this.orderByClause ? this.orderByClause.addFirst(orderBy) : SqlOrderByClause.create(orderBy),
    );
  }

  /* ~~~~~ LIMIT ~~~~~ */

  public hasLimit(): boolean {
    return Boolean(this.limitClause);
  }

  /* ~~~~~ OFFSET ~~~~~ */

  public hasOffset(): boolean {
    return Boolean(this.offsetClause);
  }
}

SqlBase.register(SqlWithQuery);
