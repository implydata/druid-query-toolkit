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

import { Column, QueryResult } from '../query-result';
import { SqlQuery, SqlTable } from '../sql';
import { dedupe } from '../utils';

export interface TableInfo {
  name: string;
}

interface QueryColumnIntrospectionQuery {
  query: string;
  header: true;
  typesHeader: true;
  sqlTypesHeader: true;
}

export class Introspect {
  static getTableIntrospectionQuery(): string {
    return `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'druid' AND TABLE_TYPE = 'TABLE'`;
  }

  static decodeTableIntrospectionResult(queryResult: QueryResult): TableInfo[] {
    if (queryResult.isEmpty()) return [];
    return queryResult.rows.map(r => ({ name: r[0] }));
  }

  static getQueryColumnIntrospectionQuery(query: SqlQuery | SqlTable): SqlQuery {
    if (query instanceof SqlTable) {
      return SqlQuery.create(query).changeLimitValue(0);
    } else {
      return query.changeLimitValue(0);
    }
  }

  static getQueryColumnIntrospectionPayload(
    query: SqlQuery | SqlTable,
  ): QueryColumnIntrospectionQuery {
    return {
      query: Introspect.getQueryColumnIntrospectionQuery(query).toString(),
      header: true,
      typesHeader: true,
      sqlTypesHeader: true,
    };
  }

  static decodeQueryColumnIntrospectionResult(headerOnlyResult: QueryResult): Column[] {
    // Remove any column that does not have a "real" name as it can not be referenced
    // Deduplicate columns, taking only the first one if there are several functions with the same name
    return dedupe(
      headerOnlyResult.header.filter(column => !SqlQuery.isPhonyOutputName(column.name)),
      column => column.name,
    );
  }
}
