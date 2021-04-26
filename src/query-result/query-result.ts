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

import { SqlQuery } from '../sql/sql-query';

function isObject(obj: unknown): boolean {
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

export interface Column {
  name: string;
}

function makeColumn(name: any): Column {
  return {
    name: String(name),
  };
}

function makeColumns(names: any[]): Column[] {
  return names.map(makeColumn);
}

export interface QueryResultValue {
  header: readonly Column[];
  rows: readonly any[][];
  query?: Record<string, unknown>;
  sqlQuery?: SqlQuery;
  queryId?: string;
  sqlQueryId?: string;
  queryDuration?: number;
}

export class QueryResult {
  static BLANK: QueryResult;

  static shouldIncludeTimestamp(queryPayload: Record<string, unknown>): boolean {
    return Boolean(queryPayload.granularity && !isAllGranularity(queryPayload.granularity));
  }

  static isFirstRowHeader(queryPayload: Record<string, unknown>): boolean {
    return typeof queryPayload.query === 'string' && queryPayload.header === true;
  }

  static fromQueryAndRawResult(queryPayload: Record<string, unknown>, data: unknown): QueryResult {
    return QueryResult.fromRawResult(
      data,
      QueryResult.shouldIncludeTimestamp(queryPayload),
      QueryResult.isFirstRowHeader(queryPayload),
    ).inflateDates();
  }

  static fromRawResult(
    data: unknown,
    includeTimestampIfExists?: boolean,
    firstRowHeader?: boolean,
  ): QueryResult {
    if (typeof data === 'string') {
      try {
        data = data
          .trim()
          .split('\n')
          .map(line => JSON.parse(line));
      } catch {
        throw new Error(`unparsable row in string return`);
      }
    }

    if (Array.isArray(data)) {
      const firstRow = data[0];
      if (!firstRow) return QueryResult.BLANK;

      if (Array.isArray(firstRow)) {
        if (firstRowHeader) {
          return new QueryResult({
            header: makeColumns(firstRow),
            rows: data.slice(1),
          });
        } else {
          return new QueryResult({
            header: makeColumns(firstRow.map((_d, i) => i)),
            rows: data,
          });
        }
      }

      if (!isObject(firstRow)) {
        throw new Error(`unexpected query result, array of non objects or arrays`);
      }

      if (typeof firstRow.timestamp === 'string' && firstRow.result) {
        const firstRowResult = firstRow.result;

        if (isObject(firstRowResult)) {
          // bySegment like
          if (Array.isArray(firstRowResult.results)) {
            return QueryResult.fromRawResult(
              data.flatMap(d => d.result.results),
              includeTimestampIfExists,
              firstRowHeader,
            );
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
              header: makeColumns(selectHeader),
              rows: data.flatMap(r =>
                r.result.events.map((r: { event: Record<string, any> }) =>
                  selectHeader.map(h => r.event[h]),
                ),
              ),
            });
          }

          // timeseries like
          const header = Object.keys(firstRowResult);
          return new QueryResult({
            header: makeColumns(includeTimestampIfExists ? ['timestamp'].concat(header) : header),
            rows: data.map((r: Record<string, any>) => {
              const { timestamp, result } = r;
              const rest = header.map(h => result[h]);
              return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
            }),
          });
        }

        // topN like
        if (Array.isArray(firstRowResult)) {
          const firstSubRow = data.find(r => r.result[0]);
          if (!firstSubRow) return QueryResult.BLANK;
          const header = Object.keys(firstSubRow.result[0]);
          return new QueryResult({
            header: makeColumns(includeTimestampIfExists ? ['timestamp'].concat(header) : header),
            rows: data.flatMap((r: Record<string, any>) => {
              const { timestamp, result } = r;
              return result.map((subResult: Record<string, any>) => {
                const rest = header.map(h => subResult[h]);
                return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
              });
            }),
          });
        }
      }

      // groupBy like
      if (typeof firstRow.timestamp === 'string' && isObject(firstRow.event)) {
        const header = Object.keys(firstRow.event);
        return new QueryResult({
          header: makeColumns(includeTimestampIfExists ? ['timestamp'].concat(header) : header),
          rows: data.map((r: Record<string, any>) => {
            const { timestamp, event } = r;
            const rest = header.map(h => event[h]);
            return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
          }),
        });
      }

      // scan like
      if (Array.isArray(firstRow.columns) && Array.isArray(firstRow.events)) {
        const headerNames: string[] = firstRow.columns;
        const header: Column[] = makeColumns(headerNames);
        const firstSubRow = data.find(r => r.events[0]);
        if (!firstSubRow) return new QueryResult({ header, rows: [] });
        const firstSubRowEvents = firstSubRow.events[0];

        // scan compactedList like
        if (Array.isArray(firstSubRowEvents)) {
          return new QueryResult({
            header,
            rows: data.flatMap(({ events }) => events),
          });
        }

        // scan list like
        if (isObject(firstSubRowEvents)) {
          return new QueryResult({
            header,
            rows: data.flatMap(({ events }) =>
              events.map((event: any) => headerNames.map(h => event[h])),
            ),
          });
        }

        throw new Error(`unexpected scan like results`);
      }

      // segmentMetadata like
      if (typeof firstRow.id === 'string' && isObject(firstRow.columns)) {
        const flatArray = data.flatMap(({ columns }) =>
          Object.keys(columns).map(k => ({ column: k, ...columns[k] })),
        );
        return QueryResult.fromObjectArray(flatArray);
      }

      // sql object mode like
      return QueryResult.fromObjectArray(data, firstRowHeader);
    }

    throw new Error('unrecognizable query return shape, not an array');
  }

  static fromObjectArray(array: Record<string, any>[], ignoreFirstEvent?: boolean): QueryResult {
    const firstRow = array[0];
    if (!firstRow) return QueryResult.BLANK;
    const header = Object.keys(firstRow);
    return new QueryResult({
      header: makeColumns(header),
      rows: (ignoreFirstEvent ? array.slice(1) : array).map(r => header.map(h => r[h])),
    });
  }

  public readonly header: readonly Column[];
  public readonly rows: readonly any[][];

  public readonly query?: Record<string, unknown>;
  public readonly sqlQuery?: SqlQuery;

  public readonly queryId?: string;
  public readonly sqlQueryId?: string;
  public readonly queryDuration?: number;

  constructor(value: QueryResultValue) {
    this.header = value.header;
    this.rows = value.rows;
    this.query = value.query;
    this.sqlQuery = value.sqlQuery;
    this.queryId = value.queryId;
    this.sqlQueryId = value.sqlQueryId;
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
      queryDuration: this.queryDuration,
    };
  }

  public changeQueryDuration(queryDuration: number): QueryResult {
    const value = this.valueOf();
    value.queryDuration = queryDuration;
    return new QueryResult(value);
  }

  public attachQuery(query: Record<string, unknown>, sqlQuery?: SqlQuery): QueryResult {
    const value = this.valueOf();
    value.query = query;
    value.sqlQuery = sqlQuery;
    return new QueryResult(value);
  }

  public attachQueryId(queryId: string | undefined, sqlQueryId?: string): QueryResult {
    const value = this.valueOf();
    value.queryId = queryId;
    value.sqlQueryId = sqlQueryId;
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

  public getSqlOuterLimit(): number | undefined {
    const { query } = this;
    if (!query) return;
    const { context } = query;
    if (typeof context !== 'object') return;
    return (context as any).sqlOuterLimit;
  }

  public detectDateColumnIndexes(): number[] {
    const { header, rows } = this;
    if (!rows.length) return [];
    const indexes = header.map((_x, i) => i);
    for (const row of rows) {
      let i = 0;
      while (i < indexes.length) {
        const index = indexes[i];
        if (isIsoDate(row[index])) {
          i++;
        } else {
          indexes.splice(i, 1);
        }
      }
      if (!indexes.length) break; // Don't bother scanning the rest
    }
    return indexes;
  }

  public inflateDates(): QueryResult {
    const indexes = this.detectDateColumnIndexes();
    if (!indexes.length) return this;

    const value = this.valueOf();
    value.rows = this.rows.map(row => {
      row = row.slice();
      for (const index of indexes) {
        row[index] = new Date(row[index]);
      }
      return row;
    });
    return new QueryResult(value);
  }
}

QueryResult.BLANK = new QueryResult({ header: [], rows: [] });
