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
import { SqlQuery, SqlRef } from '../sql';

export class Introspect {
  static getTableListQuery(): string {
    return `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'druid' AND TABLE_TYPE = 'TABLE'`;
  }

  static getTableColumnListQuery(thing: SqlRef | string): string {
    let tableName: string;
    if (thing instanceof SqlRef) {
      if (thing.column || !thing.table) {
        throw new Error(`can not introspect columns on column ref`);
      }
      tableName = thing.table;
    } else {
      tableName = thing;
    }
    return `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'druid' AND TABLE_NAME = ${SqlRef.columnWithQuotes(
      tableName,
    )}`;
  }

  static getQueryColumnListQuery(query: SqlQuery | string): string {
    return `EXPLAIN PLAN FOR (${query}\n)`;
  }

  static decodeTableListResult(_queryResult: QueryResult): string[] {
    throw new Error('ToDo');
  }
}
