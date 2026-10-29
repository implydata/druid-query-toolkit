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

import type { SqlQueryBase, SqlQueryDecorator } from '..';
import { SeparatedArray } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { QUERY_TYPE_DESIGNATORS, SqlBase } from '../sql-base';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlUnionPipeOperatorValue extends SqlPipeOperatorValue {
  decorator?: SqlQueryDecorator;
  queries: SeparatedArray<SqlQueryBase>;
}

/**
 * The \`|> UNION ALL (...), (...)\` pipe operator, which appends the rows of the queries in
 * parentheses to the input. Without the `ALL` (plain `UNION` or `UNION DISTINCT`) duplicate rows
 * are removed.
 */
export class SqlUnionPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'unionPipeOperator';

  static DEFAULT_UNION_KEYWORD = 'UNION';

  static create(
    queries: SeparatedArray<SqlQueryBase> | SqlQueryBase[],
    decorator: SqlQueryDecorator | undefined = 'ALL',
  ): SqlUnionPipeOperator {
    return new SqlUnionPipeOperator({
      decorator,
      queries: SeparatedArray.fromArray(queries).map(query => query.ensureParens()),
    });
  }

  public readonly decorator?: SqlQueryDecorator;
  public readonly queries: SeparatedArray<SqlQueryBase>;

  constructor(options: SqlUnionPipeOperatorValue) {
    super(options, SqlUnionPipeOperator.type);
    this.decorator = options.decorator;
    this.queries = options.queries;
  }

  public valueOf(): SqlUnionPipeOperatorValue {
    const value = super.valueOf() as SqlUnionPipeOperatorValue;
    value.decorator = this.decorator;
    value.queries = this.queries;
    return value;
  }

  protected _toRawOperatorString(): string {
    const { decorator } = this;
    const rawParts: string[] = [
      this.getKeyword('union', SqlUnionPipeOperator.DEFAULT_UNION_KEYWORD),
      this.getSpace('postUnion'),
    ];

    if (decorator) {
      rawParts.push(this.getKeyword('decorator', decorator), this.getSpace('postDecorator'));
    }

    rawParts.push(this.queries.toString());
    return rawParts.join('');
  }

  /**
   * Is this a `UNION ALL`, which keeps duplicate rows.
   */
  public isAll(): boolean {
    return this.decorator === 'ALL';
  }

  public changeDecorator(decorator: SqlQueryDecorator | undefined): this {
    if (this.decorator === decorator) return this;
    const value = this.valueOf();
    if (decorator) {
      value.decorator = decorator;
    } else {
      delete value.decorator;
      value.spacing = this.getSpacingWithout('postDecorator');
    }
    value.keywords = this.getKeywordsWithout('decorator');
    return SqlBase.fromValue(value);
  }

  public changeQueries(queries: SeparatedArray<SqlQueryBase> | SqlQueryBase[]): this {
    const value = this.valueOf();
    value.queries = SeparatedArray.fromArray(queries).map(query => query.ensureParens());
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const queries = SqlBase.walkSeparatedArray(this.queries, nextStack, fn, postorder);
    if (!queries) return;
    if (queries !== this.queries) {
      if (queries.values.some(query => !QUERY_TYPE_DESIGNATORS.includes(query.type))) {
        throw new Error('must return a sql query');
      }
      ret = ret.changeQueries(queries);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.queries = this.queries.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlUnionPipeOperator);
