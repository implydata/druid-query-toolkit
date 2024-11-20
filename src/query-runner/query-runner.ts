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

import type { QueryParameter, QueryPayload } from '../query-payload/query-payload';
import { QueryResult } from '../query-result';
import { SqlQuery } from '../sql';

import type { CancelToken } from './cancel-token';

export interface DataAndHeaders {
  data: unknown;
  headers: Record<string, string>;
}

export type QueryExecutor = (
  payload: QueryPayload,
  isSql: boolean,
  cancelToken?: CancelToken,
) => Promise<DataAndHeaders>;

export interface RunQueryOptions {
  query: string | SqlQuery | QueryPayload;
  defaultQueryContext?: Record<string, any>;
  extraQueryContext?: Record<string, any>;
  queryParameters?: QueryParameter[];
  resultFormat?: string;
  header?: boolean;
  typesHeader?: boolean;
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
      defaultQueryContext,
      extraQueryContext,
      queryParameters,
      resultFormat,
      header,
      typesHeader,
      sqlTypesHeader,
      cancelToken,
    } = options;

    let isSql: boolean;
    let queryPayload: QueryPayload;
    let parsedQuery: SqlQuery | undefined;
    if (typeof query === 'string') {
      isSql = true;
      queryPayload = {
        query,
        resultFormat: resultFormat ?? 'array',
        header: header ?? true,
        typesHeader: (header && typesHeader) ?? true,
        sqlTypesHeader: (header && sqlTypesHeader) ?? true,
      };
      try {
        parsedQuery = SqlQuery.parse(query);
      } catch {}
    } else if (query instanceof SqlQuery) {
      isSql = true;
      parsedQuery = query;
      queryPayload = {
        query: String(query),
        resultFormat: resultFormat ?? 'array',
        header: header ?? true,
        typesHeader: (header && typesHeader) ?? true,
        sqlTypesHeader: (header && sqlTypesHeader) ?? true,
      };
    } else {
      queryPayload = query;
      isSql = !('queryType' in queryPayload) && typeof queryPayload.query === 'string';
      if (isSql) {
        try {
          parsedQuery = SqlQuery.parse(queryPayload.query);
        } catch {}
      }
    }

    if (
      !QueryRunner.isEmptyContext(defaultQueryContext) ||
      !QueryRunner.isEmptyContext(extraQueryContext)
    ) {
      queryPayload = {
        ...queryPayload,
        context: {
          ...defaultQueryContext,
          ...(queryPayload.context || {}),
          ...extraQueryContext,
        },
      };
    }

    if (
      typeof queryPayload.query === 'string' &&
      Array.isArray(queryParameters) &&
      queryParameters.length
    ) {
      queryPayload = { ...queryPayload, parameters: queryParameters };
    }

    const startTime = QueryRunner.now();
    const dataAndHeaders = await this.getExecutor()(queryPayload, isSql, cancelToken);
    const endTime = QueryRunner.now();

    if (cancelToken) cancelToken.throwIfRequested();

    const result = QueryResult.fromQueryAndRawResult(
      queryPayload,
      dataAndHeaders.data,
      dataAndHeaders.headers,
    )
      .attachQuery(queryPayload, parsedQuery)
      .attachQueryId(
        dataAndHeaders.headers['x-druid-query-id'],
        dataAndHeaders.headers['x-druid-sql-query-id'],
      )
      .changeQueryDuration(endTime - startTime);

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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
