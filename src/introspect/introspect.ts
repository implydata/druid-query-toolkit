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

import { QueryResult } from '../query-result/query-result';
import { SqlLiteral, SqlQuery, SqlRef } from '../sql';

export interface TableInfo {
  name: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
}

export class Introspect {
  static getTableIntrospectionQuery(): string {
    return `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'druid' AND TABLE_TYPE = 'TABLE'`;
  }

  static decodeTableIntrospectionResult(queryResult: QueryResult): TableInfo[] {
    return queryResult.rows.map(r => ({ name: r[0] }));
  }

  static getTableColumnIntrospectionQuery(thing: SqlRef | string): SqlQuery {
    let tableName: string;
    if (thing instanceof SqlRef) {
      if (thing.column || !thing.table) {
        throw new Error(`can not introspect columns on column ref`);
      }
      tableName = thing.table;
    } else {
      tableName = thing;
    }
    return SqlQuery.parse(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'druid' AND TABLE_NAME = ${SqlLiteral.create(
        tableName,
      )}`,
    );
  }

  static decodeTableColumnIntrospectionResult(queryResult: QueryResult): ColumnInfo[] {
    if (queryResult.getHeaderNames().join(',') !== 'COLUMN_NAME,DATA_TYPE') {
      throw new Error('invalid result shape, bad header');
    }
    return queryResult.rows.map(r => ({ name: r[0], type: r[1] }));
  }

  static getQueryColumnIntrospectionQuery(query: SqlQuery): SqlQuery {
    return query.makeExplain();
  }

  static decodeQueryColumnIntrospectionResult(queryResult: QueryResult): ColumnInfo[] {
    const { rows, sqlQuery } = queryResult;
    if (!sqlQuery) throw new Error('must have a sqlQuery');
    if (queryResult.getHeaderNames().join(',') !== 'PLAN') {
      throw new Error('invalid result shape, bad header');
    }
    if (rows.length !== 1) throw new Error('invalid result shape, bad number of results');

    const plan = rows[0][0];
    const m = plan.match(/ signature=\[\{(.*)}]/m);
    if (!m) throw new Error('could not find signature');

    const types = m[1].split(/,\s/g).map((t: string) => t.split(':')[1]);
    const outputColumns = sqlQuery.getOutputColumns();
    if (outputColumns.length !== types.length) throw new Error('invalid number of types');
    return outputColumns.map((name, i) => ({ name, type: types[i] }));
  }

  static decodeColumnIntrospectionResult(queryResult: QueryResult): ColumnInfo[] {
    const headerShape = queryResult.getHeaderNames().join(',');
    switch (headerShape) {
      case 'COLUMN_NAME,DATA_TYPE':
        return Introspect.decodeTableColumnIntrospectionResult(queryResult);

      case 'PLAN':
        return Introspect.decodeQueryColumnIntrospectionResult(queryResult);

      default:
        throw new Error('unknown header shape');
    }
  }
}
