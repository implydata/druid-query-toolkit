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

function isObject(obj: unknown): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

export interface HeaderRows {
  header: string[];
  rows: any[][];
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

export function shouldIncludeTimestamp(queryPayload: Record<string, unknown>): boolean {
  return Boolean(queryPayload.granularity && !isAllGranularity(queryPayload.granularity));
}

export function isFirstRowHeader(queryPayload: Record<string, unknown>): boolean {
  return typeof queryPayload.query === 'string' && queryPayload.header === true;
}

function fromObjectArray(array: Record<string, any>[], ignoreFirstEvent?: boolean): HeaderRows {
  const firstRow = array[0];
  if (!firstRow) return { header: [], rows: [] };
  const header = Object.keys(firstRow);
  return {
    header,
    rows: (ignoreFirstEvent ? array.slice(1) : array).map(r => header.map(h => r[h])),
  };
}

export function normalizeQueryResult(
  data: unknown,
  includeTimestampIfExists?: boolean,
  firstRowHeader?: boolean,
): HeaderRows {
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
    if (!firstRow) return { header: [], rows: [] };

    if (Array.isArray(firstRow)) {
      if (firstRowHeader) {
        return {
          header: firstRow,
          rows: data.slice(1),
        };
      } else {
        return {
          header: firstRow.map((_d, i) => String(i)),
          rows: data,
        };
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
          return normalizeQueryResult(
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
          return {
            header: selectHeader,
            rows: data.flatMap(r =>
              r.result.events.map((r: { event: Record<string, any> }) =>
                selectHeader.map(h => r.event[h]),
              ),
            ),
          };
        }

        // timeseries like
        const header = Object.keys(firstRowResult);
        return {
          header: includeTimestampIfExists ? ['timestamp'].concat(header) : header,
          rows: data.map((r: Record<string, any>) => {
            const { timestamp, result } = r;
            const rest = header.map(h => result[h]);
            return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
          }),
        };
      }

      // topN like
      if (Array.isArray(firstRowResult)) {
        const firstSubRow = data.find(r => r.result[0]);
        if (!firstSubRow) return { header: [], rows: [] };
        const header = Object.keys(firstSubRow.result[0]);
        return {
          header: includeTimestampIfExists ? ['timestamp'].concat(header) : header,
          rows: data.flatMap((r: Record<string, any>) => {
            const { timestamp, result } = r;
            return result.map((subResult: Record<string, any>) => {
              const rest = header.map(h => subResult[h]);
              return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
            });
          }),
        };
      }
    }

    // groupBy like
    if (typeof firstRow.timestamp === 'string' && isObject(firstRow.event)) {
      const header = Object.keys(firstRow.event);
      return {
        header: includeTimestampIfExists ? ['timestamp'].concat(header) : header,
        rows: data.map((r: Record<string, any>) => {
          const { timestamp, event } = r;
          const rest = header.map(h => event[h]);
          return includeTimestampIfExists ? [timestamp].concat(rest) : rest;
        }),
      };
    }

    // scan like
    if (Array.isArray(firstRow.columns) && Array.isArray(firstRow.events)) {
      const header: string[] = firstRow.columns;
      const firstSubRow = data.find(r => r.events[0]);
      if (!firstSubRow) return { header, rows: [] };
      const firstSubRowEvents = firstSubRow.events[0];

      // scan compactedList like
      if (Array.isArray(firstSubRowEvents)) {
        return {
          header,
          rows: data.flatMap(({ events }) => events),
        };
      }

      // scan list like
      if (isObject(firstSubRowEvents)) {
        return {
          header,
          rows: data.flatMap(({ events }) => events.map((event: any) => header.map(h => event[h]))),
        };
      }

      throw new Error(`unexpected scan like results`);
    }

    // segmentMetadata like
    if (typeof firstRow.id === 'string' && isObject(firstRow.columns)) {
      const flatArray = data.flatMap(({ columns }) =>
        Object.keys(columns).map(k => Object.assign({ column: k }, columns[k])),
      );
      return fromObjectArray(flatArray);
    }

    // sql object mode like
    return fromObjectArray(data, firstRowHeader);
  }

  throw new Error('unrecognizable query return shape, not an array');
}
