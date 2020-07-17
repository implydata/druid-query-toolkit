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

import { QueryResult, SqlQuery } from '..';

export interface DataAndHeaders {
  data: unknown;
  headers: Record<string, string>;
}

export type QueryExecutor = (payload: any, isSql: boolean) => Promise<DataAndHeaders>;

export class QueryRunner {
  static now(): number {
    return Date.now();
  }

  static isEmptyContext(context: Record<string, any> | undefined): boolean {
    return !context || Object.keys(context).length === 0;
  }

  public queryExecutor: QueryExecutor;

  constructor(queryExecutor: QueryExecutor) {
    this.queryExecutor = queryExecutor;
  }

  public async runQuery(
    query: string | SqlQuery | Record<string, any>,
    extraContext?: Record<string, any>,
  ): Promise<QueryResult> {
    let isSql: boolean;
    let jsonQuery: Record<string, any>;
    let parsedQuery: SqlQuery | undefined;
    if (typeof query === 'string') {
      isSql = true;
      jsonQuery = {
        query,
        resultFormat: 'array',
        header: true,
      };
      try {
        parsedQuery = SqlQuery.parse(query);
      } catch {}
    } else if (query instanceof SqlQuery) {
      isSql = true;
      parsedQuery = query;
      jsonQuery = {
        query: String(query),
        resultFormat: 'array',
        header: true,
      };
    } else {
      jsonQuery = query;
      isSql = !jsonQuery.queryType && typeof jsonQuery.query === 'string';
      if (isSql) {
        try {
          parsedQuery = SqlQuery.parse(jsonQuery.query);
        } catch {}
      }
    }

    if (!QueryRunner.isEmptyContext(extraContext)) {
      jsonQuery = Object.assign({}, jsonQuery, {
        context: Object.assign({}, jsonQuery.context || {}, extraContext),
      });
    }

    const startTime = QueryRunner.now();
    const dataAndHeaders = await this.queryExecutor(jsonQuery, isSql);
    const endTime = QueryRunner.now();

    return QueryResult.fromQueryAndRawResult(jsonQuery, dataAndHeaders.data)
      .attachQuery(jsonQuery, parsedQuery)
      .attachQueryId(
        dataAndHeaders.headers['x-druid-query-id'],
        dataAndHeaders.headers['x-druid-sql-query-id'],
      )
      .changeQueryDuration(endTime - startTime);
  }
}
