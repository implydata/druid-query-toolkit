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
import { SqlQuery } from '../sql';

import { CancelToken } from './cancel-token';

export interface QueryParameter {
  type: string;
  value: string | number;
}

export interface DataAndHeaders {
  data: unknown;
  headers: Record<string, string>;
}

export type QueryExecutor = (
  payload: any,
  isSql: boolean,
  cancelToken?: CancelToken,
) => Promise<DataAndHeaders>;

export interface RunQueryOptions {
  query: string | SqlQuery | Record<string, any>;
  extraQueryContext?: Record<string, any>;
  queryParameters?: QueryParameter[];
  resultFormat?: string;
  header?: boolean;
  sqlTypesHeader?: boolean;
  cancelToken?: CancelToken;
}

export type InflateDateStrategy = 'fromSqlTypes' | 'guess' | 'none';

export interface QueryRunnerOptions {
  executor?: QueryExecutor;
  inflateDateStrategy?: InflateDateStrategy;
}

export class QueryRunner {
  static defaultQueryExecutor?: QueryExecutor;

  static now(): number {
    return Date.now();
  }

  static isEmptyContext(context: Record<string, any> | undefined): boolean {
    return !context || Object.keys(context).length === 0;
  }

  public readonly executor?: QueryExecutor;
  public readonly inflateDateStrategy: InflateDateStrategy;

  constructor(options: QueryRunnerOptions = {}) {
    this.executor = options.executor;
    this.inflateDateStrategy = options.inflateDateStrategy || 'fromSqlTypes';
  }

  private getExecutor(): QueryExecutor {
    const executor = this.executor || QueryRunner.defaultQueryExecutor;
    if (!executor) {
      throw new Error(`Query executor must be provided or a default must be defined`);
    }
    return executor;
  }

  public async runQuery(options: RunQueryOptions): Promise<QueryResult> {
    const {
      query,
      extraQueryContext,
      queryParameters,
      resultFormat,
      header,
      sqlTypesHeader,
      cancelToken,
    } = options;

    let isSql: boolean;
    let jsonQuery: Record<string, any>;
    let parsedQuery: SqlQuery | undefined;
    if (typeof query === 'string') {
      isSql = true;
      jsonQuery = {
        query,
        resultFormat: resultFormat ?? 'array',
        header: header ?? true,
        sqlTypesHeader: (header && sqlTypesHeader) ?? true,
      };
      try {
        parsedQuery = SqlQuery.parse(query);
      } catch {}
    } else if (query instanceof SqlQuery) {
      isSql = true;
      parsedQuery = query;
      jsonQuery = {
        query: String(query),
        resultFormat: resultFormat ?? 'array',
        header: header ?? true,
        sqlTypesHeader: (header && sqlTypesHeader) ?? true,
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

    if (!QueryRunner.isEmptyContext(extraQueryContext)) {
      jsonQuery = { ...jsonQuery, context: { ...(jsonQuery.context || {}), ...extraQueryContext } };
    }

    if (
      typeof jsonQuery.query === 'string' &&
      Array.isArray(queryParameters) &&
      queryParameters.length
    ) {
      jsonQuery = { ...jsonQuery, parameters: queryParameters };
    }

    const startTime = QueryRunner.now();
    const dataAndHeaders = await this.getExecutor()(jsonQuery, isSql, cancelToken);
    const endTime = QueryRunner.now();

    if (cancelToken) cancelToken.throwIfRequested();

    const result = QueryResult.fromQueryAndRawResult(jsonQuery, dataAndHeaders.data)
      .attachQuery(jsonQuery, parsedQuery)
      .attachQueryId(
        dataAndHeaders.headers['x-druid-query-id'],
        dataAndHeaders.headers['x-druid-sql-query-id'],
      )
      .changeQueryDuration(endTime - startTime);

    switch (this.inflateDateStrategy) {
      case 'fromSqlTypes':
        return result.inflateDatesFromSqlTypes();

      case 'guess':
        return result.inflateDatesByGuessing();

      default:
        return result;
    }
  }
}
