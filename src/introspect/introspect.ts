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
import { SqlLiteral, SqlQuery, SqlTableRef } from '../sql';
import { filterMap } from '../utils';

export interface TableInfo {
  name: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
}

function guessTypeFromValue(v: any): string | undefined {
  if (v instanceof Date) return 'TIMESTAMP';
  if (v === true || v === false) return 'BOOLEAN';
  return;
}

export class Introspect {
  static getTableIntrospectionQuery(): string {
    return `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'druid' AND TABLE_TYPE = 'TABLE'`;
  }

  static decodeTableIntrospectionResult(queryResult: QueryResult): TableInfo[] {
    if (queryResult.isEmpty()) return [];
    return queryResult.rows.map(r => ({ name: r[0] }));
  }

  static getTableColumnIntrospectionQuery(thing: SqlTableRef | string): SqlQuery {
    let tableName: string;
    if (thing instanceof SqlTableRef) {
      tableName = thing.getTable();
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
    if (queryResult.isEmpty()) return [];
    if (queryResult.getHeaderNames().join(',') !== 'COLUMN_NAME,DATA_TYPE') {
      throw new Error('invalid result shape, bad header');
    }
    return queryResult.rows.map(r => ({ name: r[0], type: r[1] }));
  }

  static getQueryColumnIntrospectionQuery(query: SqlQuery): SqlQuery {
    return query.makeExplain();
  }

  static getQueryColumnSampleQuery(query: SqlQuery): SqlQuery {
    return query.changeLimitValue(1);
  }

  static decodeColumnTypesFromPlan(queryPlanResult: QueryResult): string[] {
    if (queryPlanResult.isEmpty()) return [];
    const { rows } = queryPlanResult;
    if (queryPlanResult.getHeaderNames()[0] !== 'PLAN') {
      throw new Error('invalid result shape, bad header');
    }
    if (rows.length !== 1) throw new Error('invalid result shape, bad number of results');

    const plan = rows[0][0];
    const m = plan.match(/ signature=\[\{([^}]*)}]/m);
    if (!m) throw new Error('could not find signature');

    return m[1].split(/(?<=:[A-Z]+), /).map((t: string) => {
      const parts = t.split(':');
      return parts[parts.length - 1];
    });
  }

  static decodeQueryColumnIntrospectionResult(
    queryPlanResult: QueryResult,
    sampleRowResult?: QueryResult,
  ): ColumnInfo[] {
    const { sqlQuery } = queryPlanResult;
    if (queryPlanResult.isEmpty()) return [];
    if (!sqlQuery) throw new Error('must have a sqlQuery');
    const types = Introspect.decodeColumnTypesFromPlan(queryPlanResult);

    if (sampleRowResult) {
      if (sampleRowResult.header.length !== types.length) {
        throw new Error('number of columns in the sample row does not match the number of types');
      }

      const sampleRow = sampleRowResult.rows[0];
      return filterMap(sampleRowResult.header, (column, i) => {
        const columnName = column.name;
        if (SqlQuery.isPhonyOutputName(columnName)) return;

        let type = sampleRow ? guessTypeFromValue(sampleRow[i]) : undefined;
        if (!type) {
          type = types[i];
          if (columnName === '__time' && type === 'LONG') {
            type = 'TIMESTAMP';
          }
        }

        return { name: columnName, type };
      });
    } else {
      if (sqlQuery.hasStarInSelect()) {
        throw new Error('a query with a star must have sampleRowResult set');
      }

      const outputColumns = sqlQuery.getOutputColumns();
      if (outputColumns.length !== types.length) {
        throw new Error('number of output columns does not match the number of types');
      }

      return filterMap(outputColumns, (name, i) => {
        if (!sqlQuery.isRealOutputColumnAtSelectIndex(i)) return;
        let type = types[i];
        if (name === '__time' && type === 'LONG') {
          type = 'TIMESTAMP';
        }
        return { name: String(name), type };
      });
    }
  }

  static decodeColumnIntrospectionResult(
    queryResult: QueryResult,
    sampleRowResult?: QueryResult,
  ): ColumnInfo[] {
    const headerNames = queryResult.getHeaderNames();
    if (headerNames[0] === 'COLUMN_NAME' && headerNames[1] === 'DATA_TYPE') {
      return Introspect.decodeTableColumnIntrospectionResult(queryResult);
    } else if (headerNames[0] === 'PLAN') {
      return Introspect.decodeQueryColumnIntrospectionResult(queryResult, sampleRowResult);
    } else {
      throw new Error(`unknown header shape: '${headerNames.join("', '")}'`);
    }
  }
}
