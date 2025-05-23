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

import type { QueryPayload } from '../query-payload/query-payload';
import type { SqlQuery } from '../sql';
import { filterMap } from '../utils';

import { Column } from './column';

function isObject(obj: unknown): obj is Record<string, unknown> {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

//              Matches: "2016-06-27T00:00:00.000Z"
const FULL_ISO_REGEXP = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/;

function isIsoDate(thing: unknown): boolean {
  return (
    typeof thing === 'string' && FULL_ISO_REGEXP.test(thing) && !isNaN(new Date(thing).valueOf())
  );
}

function isAllGranularity(granularity: unknown): boolean {
  if (typeof granularity === 'string') {
    return granularity.toLowerCase() === 'all';
  }
  if (isObject(granularity) && typeof (granularity as any).type === 'string') {
    return (granularity as any).type.toLowerCase() === 'all';
  }
  return false;
}

export interface QueryResultValue {
  header: readonly Column[];
  rows: readonly any[][];
  query?: QueryPayload;
  sqlQuery?: SqlQuery;
  queryId?: string;
  sqlQueryId?: string;
  resultContext?: Record<string, any>;
  queryDuration?: number;
}

export class QueryResult {
  static BLANK: QueryResult;
  static jsonParse: (str: string) => any = JSON.parse;

  static shouldIncludeTimestamp(queryPayload: QueryPayload): boolean {
    return Boolean('granularity' in queryPayload && !isAllGranularity(queryPayload.granularity));
  }

  static hasHeader(queryPayload: QueryPayload): boolean {
    return typeof queryPayload.query === 'string' && queryPayload.header === true;
  }

  static hasTypeHeader(queryPayload: QueryPayload, header: Record<string, string>): boolean {
    return (
      QueryResult.hasHeader(queryPayload) &&
      queryPayload.typesHeader === true &&
      header['x-druid-sql-header-included'] === 'yes'
    );
  }

  static hasSqlTypeHeader(queryPayload: QueryPayload, header: Record<string, string>): boolean {
    return (
      QueryResult.hasHeader(queryPayload) &&
      queryPayload.sqlTypesHeader === true &&
      header['x-druid-sql-header-included'] === 'yes'
    );
  }

  static fromQueryAndRawResult(
    queryPayload: QueryPayload,
    data: unknown,
    header: Record<string, string> = {},
  ): QueryResult {
    return QueryResult.fromRawResult(
      data,
      QueryResult.shouldIncludeTimestamp(queryPayload),
      QueryResult.hasHeader(queryPayload),
      QueryResult.hasTypeHeader(queryPayload, header),
      QueryResult.hasSqlTypeHeader(queryPayload, header),
    );
  }

  static fromRawResult(
    data: unknown,
    includeTimestampIfExists?: boolean,
    hasHeader?: boolean,
    hasTypeHeader?: boolean,
    hasSqlTypeHeader?: boolean,
  ): QueryResult {
    if (typeof data === 'string') {
      if (data === '') {
        throw new Error(
          `Query results were empty. This may indicate a timeout caused by an intermediate network device (such as a load balancer). Try re-running your query, using a lower limit.`,
        );
      } else if (!data.endsWith('\n')) {
        // For more context read the section on result truncation in the Druid docs:
        // https://druid.apache.org/docs/latest/api-reference/sql-api#client-side-error-handling-and-truncated-responses
        throw new Error(
          `Query results were truncated midstream. This may indicate a server-side error or a client-side issue. Try re-running your query using a lower limit.`,
        );
      }

      const trimmedDataString = data.trimEnd();
      if (trimmedDataString === '') {
        data = [];
      } else {
        data = trimmedDataString.split('\n').map((line, i) => {
          try {
            return QueryResult.jsonParse(line);
          } catch {
            throw new Error(`Unparsable row on line ${i + 1} in query result: '${line}'.`);
          }
        });
      }
    }

    // Possibly unwrap the result context
    let resultContext: Record<string, any> | undefined;
    if (isObject(data) && data.results) {
      if (isObject(data.context)) {
        resultContext = data.context;
      }
      data = data.results;
    }

    if (Array.isArray(data)) {
      const firstRow = data[0];
      if (!firstRow) return QueryResult.BLANK.changeResultContext(resultContext);

      if (Array.isArray(firstRow)) {
        let rowsToSkip = 0;
        let header: Column[];
        if (hasHeader) {
          rowsToSkip++;

          let types: string[] | undefined;
          if (hasTypeHeader) {
            types = data[rowsToSkip];
            rowsToSkip++;
          }

          let sqlTypes: string[] | undefined;
          if (hasSqlTypeHeader) {
            sqlTypes = data[rowsToSkip];
            rowsToSkip++;
          }

          header = Column.fromColumnNamesAndTypeArrays(firstRow, types, sqlTypes);
        } else {
          header = Column.fromColumnNames(firstRow.map((_d, i) => i));
        }

        return new QueryResult({
          header,
          rows: rowsToSkip ? data.slice(rowsToSkip) : data,
          resultContext,
        });
      }

      if (!isObject(firstRow)) {
        throw new Error(`Unexpected query result, array of non objects or arrays.`);
      }

      if (typeof firstRow.timestamp === 'string' && firstRow.result) {
        const firstRowResult = firstRow.result;

        if (isObject(firstRowResult)) {
          // bySegment like
          if (Array.isArray(firstRowResult.results)) {
            return QueryResult.fromRawResult(
              data.flatMap(d => d.result.results),
              includeTimestampIfExists,
              hasHeader,
            ).changeResultContext(resultContext);
          }

          // select like
          if (
            isObject(firstRowResult.pagingIdentifiers) &&
            Array.isArray(firstRowResult.dimensions) &&
            Array.isArray(firstRowResult.metrics) &&
            Array.isArray(firstRowResult.events)
          ) {
            const selectHeader = ['timestamp'].concat(
              firstRowResult.dimensions,
              firstRowResult.metrics,
            );
            return new QueryResult({
              header: Column.fromColumnNames(selectHeader),
              rows: data.flatMap(r =>
                r.result.events.map((r: { event: Record<string, any> }) =>
                  selectHeader.map(h => r.event[h]),
                ),
              ),
              resultContext,
            });
          }

          // timeseries like
          const header = Object.keys(firstRowResult);
          return new QueryResult({
            header: Column.fromColumnNames(
              includeTimestampIfExists ? ['timestamp'].concat(header) : header,
            ),
            rows: data.map((r: Record<string, any>) => {
              const { timestamp, result } = r;
              const rest = header.map(h => result[h]);
              return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
            }),
            resultContext,
          });
        }

        // topN like
        if (Array.isArray(firstRowResult)) {
          const firstSubRow = data.find(r => r.result[0]);
          if (!firstSubRow) return QueryResult.BLANK;
          const header = Object.keys(firstSubRow.result[0]);
          return new QueryResult({
            header: Column.fromColumnNames(
              includeTimestampIfExists ? ['timestamp'].concat(header) : header,
            ),
            rows: data.flatMap((r: Record<string, any>) => {
              const { timestamp, result } = r;
              return result.map((subResult: Record<string, any>) => {
                const rest = header.map(h => subResult[h]);
                return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
              });
            }),
            resultContext,
          });
        }
      }

      // groupBy like
      if (typeof firstRow.timestamp === 'string' && isObject(firstRow.event)) {
        const header = Object.keys(firstRow.event);
        return new QueryResult({
          header: Column.fromColumnNames(
            includeTimestampIfExists ? ['timestamp'].concat(header) : header,
          ),
          rows: data.map((r: Record<string, any>) => {
            const { timestamp, event } = r;
            const rest = header.map(h => event[h]);
            return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
          }),
          resultContext,
        });
      }

      // scan like
      if (Array.isArray(firstRow.columns) && Array.isArray(firstRow.events)) {
        const firstRowColumnsKey = firstRow.columns.join('#');
        const headerNames: string[] = firstRow.columns;

        // It is possible that in a scan query we will have a different header structure for different segments
        // This code is meant to unify the columns across the different headers
        const headerNameToIndex = new Map<string, number>();
        for (let i = 0; i < headerNames.length; i++) {
          headerNameToIndex.set(headerNames[i]!, i);
        }
        const headerRemaps: (Map<string, number> | undefined)[] = data.map(({ columns }, i) => {
          if (i === 0 || columns.join('#') === firstRowColumnsKey) return;
          const remap = new Map<string, number>();
          for (let j = 0; j < columns.length; j++) {
            const column = columns[j];
            if (!headerNameToIndex.has(column)) {
              headerNameToIndex.set(column, headerNames.length);
              headerNames.push(column);
            }
            remap.set(column, j);
          }
          return remap;
        });

        const header: Column[] = Column.fromColumnNames(headerNames);
        const firstSubRow = data.find(r => r.events[0]);
        if (!firstSubRow) return new QueryResult({ header, rows: [] });
        const firstSubRowEvents = firstSubRow.events[0];

        // scan compactedList like
        if (Array.isArray(firstSubRowEvents)) {
          return new QueryResult({
            header,
            rows: data.flatMap(({ events }, i) => {
              const headerRemap = headerRemaps[i];

              // If there is no remap then we can use the event as-is
              if (!headerRemap) return events;

              // Apply the remap if it exists
              return events.map((event: any[]) => {
                return headerNames.map(column => {
                  if (!headerRemap.has(column)) return null;
                  return event[headerRemap.get(column)!];
                });
              });
            }),
            resultContext,
          });
        }

        // scan list like
        if (isObject(firstSubRowEvents)) {
          return new QueryResult({
            header,
            rows: data.flatMap(({ events }) =>
              events.map((event: any) => headerNames.map(h => event[h])),
            ),
            resultContext,
          });
        }

        throw new Error(`Unexpected scan like results.`);
      }

      // segmentMetadata like
      if (typeof firstRow.id === 'string' && isObject(firstRow.columns)) {
        const flatArray = data.flatMap(({ columns, aggregators }) =>
          Object.entries(columns).map(([k, v]) => ({
            column: k,
            ...(v as any),
            aggregator: aggregators?.[k] || null,
          })),
        );
        return QueryResult.fromObjectArray(flatArray).changeResultContext(resultContext);
      }

      // sql object mode like
      return QueryResult.fromObjectArray(
        data,
        hasHeader,
        hasTypeHeader || hasSqlTypeHeader,
      ).changeResultContext(resultContext);
    }

    throw new Error('Unrecognizable query return shape, not an array.');
  }

  static fromObjectArray(
    array: Record<string, any>[],
    hasHeader?: boolean,
    hasTypes?: boolean,
  ): QueryResult {
    const firstRow = array[0];
    if (!firstRow) return QueryResult.BLANK;
    const header = Object.keys(firstRow);
    return new QueryResult({
      header: Column.fromColumnNamesAndTypeArray(
        header,
        hasHeader && hasTypes ? header.map(h => firstRow[h]) : undefined,
      ),
      rows: (hasHeader ? array.slice(1) : array).map(r => header.map(h => r[h])),
    });
  }

  public readonly header: readonly Column[];
  public readonly rows: readonly any[][];

  public readonly query?: QueryPayload;
  public readonly sqlQuery?: SqlQuery;

  public readonly queryId?: string;
  public readonly sqlQueryId?: string;
  public readonly resultContext?: Record<string, any>;
  public readonly queryDuration?: number;

  constructor(value: QueryResultValue) {
    this.header = value.header;
    this.rows = value.rows;
    this.query = value.query;
    this.sqlQuery = value.sqlQuery;
    this.queryId = value.queryId;
    this.sqlQueryId = value.sqlQueryId;
    this.resultContext = value.resultContext;
    this.queryDuration = value.queryDuration;
  }

  public valueOf(): QueryResultValue {
    return {
      header: this.header,
      rows: this.rows,
      query: this.query,
      sqlQuery: this.sqlQuery,
      queryId: this.queryId,
      sqlQueryId: this.sqlQueryId,
      resultContext: this.resultContext,
      queryDuration: this.queryDuration,
    };
  }

  public changeQueryDuration(queryDuration: number): QueryResult {
    const value = this.valueOf();
    value.queryDuration = queryDuration;
    return new QueryResult(value);
  }

  public attachQuery(queryPayload: QueryPayload, sqlQuery?: SqlQuery): QueryResult {
    const value = this.valueOf();
    value.query = queryPayload;
    value.sqlQuery = sqlQuery;

    return new QueryResult(value);
  }

  public attachQueryId(queryId: string | undefined, sqlQueryId?: string): QueryResult {
    const value = this.valueOf();
    value.queryId = queryId;
    value.sqlQueryId = sqlQueryId;
    return new QueryResult(value);
  }

  public changeResultContext(resultContext: Record<string, any> | undefined): QueryResult {
    if (this.resultContext === resultContext) return this;
    const value = this.valueOf();
    value.resultContext = resultContext;
    return new QueryResult(value);
  }

  public getHeaderNames(): string[] {
    return this.header.map(h => h.name);
  }

  public isEmpty(): boolean {
    return !this.rows.length;
  }

  public getNumResults(): number {
    return this.rows.length;
  }

  public toObjectArray(): Record<string, any>[] {
    const headerNames = this.getHeaderNames();
    const n = headerNames.length;
    return this.rows.map(row => {
      const obj: Record<string, any> = {};
      for (let i = 0; i < n; i++) {
        obj[headerNames[i]!] = row[i];
      }
      return obj;
    });
  }

  public getColumnByIndex(columnIndex: number): any[] | undefined {
    if (!this.header[columnIndex]) return;
    return this.rows.map(row => row[columnIndex]);
  }

  public getColumnByName(columnName: string): any[] | undefined {
    const columnIndex = this.header.findIndex(h => h.name === columnName);
    if (columnIndex < 0) return;
    return this.getColumnByIndex(columnIndex);
  }

  public getSqlOuterLimit(): number | undefined {
    const { query } = this;
    if (!query) return;
    const { context } = query;
    if (typeof context !== 'object') return;
    return (context as any).sqlOuterLimit;
  }

  private guessDateColumnIndexes(): number[] {
    const { header, rows } = this;
    if (!rows.length) return [];
    const indexes = header.map((_x, i) => i);
    for (const row of rows) {
      let i = 0;
      while (i < indexes.length) {
        const index = indexes[i]!;
        if (row[index] == null || isIsoDate(row[index])) {
          i++;
        } else {
          indexes.splice(i, 1);
        }
      }
      if (!indexes.length) break; // Don't bother scanning the rest
    }
    return indexes;
  }

  private inflateDatesForIndexes(indexes: number[]): QueryResult {
    if (!indexes.length) return this;

    const value = this.valueOf();
    value.rows = this.rows.map(row => {
      row = row.slice();
      for (const index of indexes) {
        if (row[index] == null) continue;
        row[index] = new Date(row[index]);
      }
      return row;
    });
    return new QueryResult(value);
  }

  public inflateDatesByGuessing(): QueryResult {
    return this.inflateDatesForIndexes(this.guessDateColumnIndexes());
  }

  public inflateDatesFromSqlTypes(): QueryResult {
    return this.inflateDatesForIndexes(
      filterMap(this.header, (c, i) => (c.sqlType === 'TIMESTAMP' ? i : undefined)),
    );
  }
}

QueryResult.BLANK = new QueryResult({ header: [], rows: [] });
