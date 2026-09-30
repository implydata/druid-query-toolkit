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

import { SqlQuery } from '../sql';

import { Column } from './column';
import { QueryResult } from './query-result';

describe('QueryResult', () => {
  const testQueryResult = new QueryResult({
    header: Column.fromColumnNames(['A', 'B', 'C']),
    rows: [
      ['A', '2016-06-27T00:00:00.000Z', 876],
      ['J', '2016-06-27T01:00:00.000Z', 870],
      ['K', '2016-06-27T02:00:00.000Z', 960],
    ],
  });

  describe('.shouldIncludeTimestamp', () => {
    it('includes the timestamp for a non all granularity', () => {
      expect(
        QueryResult.shouldIncludeTimestamp({ queryType: 'timeseries', granularity: 'hour' }),
      ).toEqual(true);
      expect(
        QueryResult.shouldIncludeTimestamp({
          queryType: 'timeseries',
          granularity: { type: 'period', period: 'P1D' },
        }),
      ).toEqual(true);
    });

    it('does not include the timestamp for all granularity', () => {
      expect(
        QueryResult.shouldIncludeTimestamp({ queryType: 'timeseries', granularity: 'ALL' }),
      ).toEqual(false);
      expect(
        QueryResult.shouldIncludeTimestamp({
          queryType: 'timeseries',
          granularity: { type: 'all' },
        }),
      ).toEqual(false);
    });

    it('treats an unrecognized granularity as not all', () => {
      expect(
        QueryResult.shouldIncludeTimestamp({ queryType: 'timeseries', granularity: 5 }),
      ).toEqual(true);
      expect(
        QueryResult.shouldIncludeTimestamp({ queryType: 'timeseries', granularity: {} }),
      ).toEqual(true);
    });

    it('does not include the timestamp when there is no granularity', () => {
      expect(QueryResult.shouldIncludeTimestamp({ queryType: 'scan' })).toEqual(false);
      expect(QueryResult.shouldIncludeTimestamp({ query: 'SELECT 1' })).toEqual(false);
    });
  });

  describe('.hasHeader', () => {
    it('is true for a SQL query with header: true', () => {
      expect(QueryResult.hasHeader({ query: 'SELECT 1', header: true })).toEqual(true);
    });

    it('is false otherwise', () => {
      expect(QueryResult.hasHeader({ query: 'SELECT 1' })).toEqual(false);
      expect(QueryResult.hasHeader({ queryType: 'scan', header: true })).toEqual(false);
    });
  });

  describe('.hasTypeHeader', () => {
    const included = { 'x-druid-sql-header-included': 'yes' };

    it('needs the header, typesHeader and the response header', () => {
      expect(
        QueryResult.hasTypeHeader({ query: 'SELECT 1', header: true, typesHeader: true }, included),
      ).toEqual(true);
      expect(
        QueryResult.hasTypeHeader({ query: 'SELECT 1', header: true, typesHeader: true }, {}),
      ).toEqual(false);
      expect(QueryResult.hasTypeHeader({ query: 'SELECT 1', header: true }, included)).toEqual(
        false,
      );
      expect(QueryResult.hasTypeHeader({ query: 'SELECT 1', typesHeader: true }, included)).toEqual(
        false,
      );
    });
  });

  describe('.hasSqlTypeHeader', () => {
    const included = { 'x-druid-sql-header-included': 'yes' };

    it('needs the header, sqlTypesHeader and the response header', () => {
      expect(
        QueryResult.hasSqlTypeHeader(
          { query: 'SELECT 1', header: true, sqlTypesHeader: true },
          included,
        ),
      ).toEqual(true);
      expect(
        QueryResult.hasSqlTypeHeader({ query: 'SELECT 1', header: true, sqlTypesHeader: true }, {}),
      ).toEqual(false);
      expect(QueryResult.hasSqlTypeHeader({ query: 'SELECT 1', header: true }, included)).toEqual(
        false,
      );
    });
  });

  describe('.fromQueryAndRawResult', () => {
    it('decodes the headers requested by a SQL query', () => {
      const result = QueryResult.fromQueryAndRawResult(
        { query: 'SELECT 1', header: true, typesHeader: true, sqlTypesHeader: true },
        [
          ['__time', 'n'],
          ['LONG', 'LONG'],
          ['TIMESTAMP', 'BIGINT'],
          ['2020-01-01T00:00:00.000Z', 1],
        ],
        { 'x-druid-sql-header-included': 'yes' },
      );
      expect(result.header).toEqual([
        new Column({ name: '__time', nativeType: 'LONG', sqlType: 'TIMESTAMP' }),
        new Column({ name: 'n', nativeType: 'LONG', sqlType: 'BIGINT' }),
      ]);
      expect(result.rows).toEqual([['2020-01-01T00:00:00.000Z', 1]]);
    });

    it('ignores the type rows when the response header is missing', () => {
      const result = QueryResult.fromQueryAndRawResult(
        { query: 'SELECT 1', header: true, typesHeader: true, sqlTypesHeader: true },
        [['n'], [1]],
      );
      expect(result.header).toEqual([new Column({ name: 'n' })]);
      expect(result.rows).toEqual([[1]]);
    });

    it('includes the timestamp for a native query with a granularity', () => {
      const result = QueryResult.fromQueryAndRawResult(
        { queryType: 'timeseries', granularity: 'hour' },
        [{ timestamp: '2019-08-04T15:00:00.000Z', result: { count: 5 } }],
      );
      expect(result.getHeaderNames()).toEqual(['timestamp', 'count']);
      expect(result.rows).toEqual([['2019-08-04T15:00:00.000Z', 5]]);
    });
  });

  describe('.fromRawResult', () => {
    it('works for timeseries (no timestamp)', () => {
      const result = [
        { timestamp: '2019-08-04T15:00:00.000Z', result: { count: 514, added: 1232 } },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              514,
              1232,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for timeseries (with timestamp)', () => {
      const result = [
        { timestamp: '2019-08-04T15:00:00.000Z', result: { count: 514, added: 196263 } },
        { timestamp: '2019-08-04T16:00:00.000Z', result: { count: 15600, added: 6123934 } },
      ];

      expect(QueryResult.fromRawResult(result, true)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2019-08-04T15:00:00.000Z",
              514,
              196263,
            ],
            Array [
              "2019-08-04T16:00:00.000Z",
              15600,
              6123934,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for groupBy', () => {
      const result = [
        {
          version: 'v1',
          timestamp: '2019-08-04T16:05:29.000Z',
          event: { added: 2976786, channel: '#en.wikipedia', count: 13524 },
        },
        {
          version: 'v1',
          timestamp: '2019-08-04T16:05:29.000Z',
          event: { added: 304920, channel: '#ar.wikipedia', count: 2329 },
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              2976786,
              "#en.wikipedia",
              13524,
            ],
            Array [
              304920,
              "#ar.wikipedia",
              2329,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);

      expect(QueryResult.fromRawResult(result, true)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2019-08-04T16:05:29.000Z",
              2976786,
              "#en.wikipedia",
              13524,
            ],
            Array [
              "2019-08-04T16:05:29.000Z",
              304920,
              "#ar.wikipedia",
              2329,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for groupBy bySegment', () => {
      const result = [
        {
          timestamp: '2016-06-27T00:00:00.000Z',
          result: {
            results: [
              {
                version: 'v1',
                timestamp: '-146136543-09-08T08:23:32.096Z',
                event: { d0: '#ar.wikipedia', a0: 335 },
              },
              {
                version: 'v1',
                timestamp: '-146136543-09-08T08:23:32.096Z',
                event: { d0: '#be.wikipedia', a0: 15 },
              },
            ],
            segment:
              'wikipedia-demo2_2016-06-27T00:00:00.000Z_2016-06-28T00:00:00.000Z_2019-05-31T22:42:18.707Z',
            interval: '2016-06-27T00:00:00.000Z/2016-06-28T00:00:00.000Z',
          },
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "d0",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "a0",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "#ar.wikipedia",
              335,
            ],
            Array [
              "#be.wikipedia",
              15,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works with topN', () => {
      const result = [
        {
          timestamp: '2019-08-04T18:00:00.000Z',
          result: [
            { channel: '#en.wikipedia', count: 3041 },
            { channel: '#ar.wikipedia', count: 1115 },
          ],
        },
        {
          timestamp: '2019-08-04T19:00:00.000Z',
          result: [
            { channel: '#en.wikipedia', count: 6066 },
            { channel: '#de.wikipedia', count: 1304 },
          ],
        },
        {
          timestamp: '2019-08-04T20:00:00.000Z',
          result: [
            { channel: '#en.wikipedia', count: 2995 },
            { channel: '#ar.wikipedia', count: 782 },
          ],
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "#en.wikipedia",
              3041,
            ],
            Array [
              "#ar.wikipedia",
              1115,
            ],
            Array [
              "#en.wikipedia",
              6066,
            ],
            Array [
              "#de.wikipedia",
              1304,
            ],
            Array [
              "#en.wikipedia",
              2995,
            ],
            Array [
              "#ar.wikipedia",
              782,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);

      expect(QueryResult.fromRawResult(result, true)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2019-08-04T18:00:00.000Z",
              "#en.wikipedia",
              3041,
            ],
            Array [
              "2019-08-04T18:00:00.000Z",
              "#ar.wikipedia",
              1115,
            ],
            Array [
              "2019-08-04T19:00:00.000Z",
              "#en.wikipedia",
              6066,
            ],
            Array [
              "2019-08-04T19:00:00.000Z",
              "#de.wikipedia",
              1304,
            ],
            Array [
              "2019-08-04T20:00:00.000Z",
              "#en.wikipedia",
              2995,
            ],
            Array [
              "2019-08-04T20:00:00.000Z",
              "#ar.wikipedia",
              782,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works with topN (bySegment)', () => {
      const result = [
        {
          timestamp: '2019-08-22T02:00:00.000Z',
          result: {
            results: [{ timestamp: '2019-08-22T02:59:20.000Z', result: [] }],
            segment:
              'wikiticker_2019-08-22T02:00:00.000Z_2019-08-22T03:00:00.000Z_2019-08-22T02:00:00.391Z',
            interval: '2019-08-22T02:59:20.000Z/2019-08-22T03:00:00.000Z',
          },
        },
        {
          timestamp: '2019-08-22T02:00:00.000Z',
          result: {
            results: [
              {
                timestamp: '2019-08-22T02:59:20.000Z',
                result: [
                  { d0: '#en.wikipedia', a0: 42 },
                  { d0: '#es.wikipedia', a0: 7 },
                ],
              },
            ],
            segment:
              'wikiticker_2019-08-22T02:00:00.000Z_2019-08-22T03:00:00.000Z_2019-08-22T02:00:00.391Z_1',
            interval: '2019-08-22T02:59:20.000Z/2019-08-22T03:00:00.000Z',
          },
        },
        {
          timestamp: '2019-08-23T02:00:00.000Z',
          result: {
            results: [
              {
                timestamp: '2019-08-23T02:00:00.464Z',
                result: [{ d0: '#en.wikipedia', a0: 2736 }],
              },
            ],
            segment:
              'wikiticker_2019-08-23T02:00:00.000Z_2019-08-23T03:00:00.000Z_2019-08-23T02:00:00.473Z',
            interval: '2019-08-23T02:00:00.000Z/2019-08-23T03:00:00.000Z',
          },
        },
      ];

      expect(QueryResult.fromRawResult(result, true)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "d0",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "a0",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2019-08-22T02:59:20.000Z",
              "#en.wikipedia",
              42,
            ],
            Array [
              "2019-08-22T02:59:20.000Z",
              "#es.wikipedia",
              7,
            ],
            Array [
              "2019-08-23T02:00:00.464Z",
              "#en.wikipedia",
              2736,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for scan(list)', () => {
      const result = [
        {
          segmentId:
            'wikiticker_2019-08-04T03:00:00.000Z_2019-08-04T04:00:00.000Z_2019-08-04T03:00:00.391Z',
          columns: ['__time', 'added', 'channel'],
          events: [
            { __time: 1564887701848, added: 471, channel: '#en.wikipedia' },
            { __time: 1564887701883, added: 44, channel: '#en.wikipedia' },
            { __time: 1564887703049, added: 4996, channel: '#vi.wikipedia' },
          ],
        },
        {
          segmentId:
            'wikiticker_2019-08-04T03:00:00.000Z_2019-08-04T04:00:00.000Z_2019-08-04T03:00:00.399Z',
          columns: ['__time', 'd1', 'd2'],
          events: [
            { __time: 1564887701848, d1: 'va1', d2: 'vb1' },
            { __time: 1564887701883, d1: 'va2', d2: 'vb2' },
          ],
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "__time",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "d1",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "d2",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              1564887701848,
              471,
              "#en.wikipedia",
              undefined,
              undefined,
            ],
            Array [
              1564887701883,
              44,
              "#en.wikipedia",
              undefined,
              undefined,
            ],
            Array [
              1564887703049,
              4996,
              "#vi.wikipedia",
              undefined,
              undefined,
            ],
            Array [
              1564887701848,
              undefined,
              undefined,
              "va1",
              "vb1",
            ],
            Array [
              1564887701883,
              undefined,
              undefined,
              "va2",
              "vb2",
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for scan(compactedList)', () => {
      const result = [
        {
          segmentId:
            'wikiticker_2019-08-04T03:00:00.000Z_2019-08-04T04:00:00.000Z_2019-08-04T03:00:00.391Z',
          columns: ['__time', 'added', 'added', 'channel'],
          events: [
            [1564887701848, 471, 471, '#en.wikipedia'],
            [1564887701883, 44, 44, '#en.wikipedia'],
          ],
        },
        {
          segmentId:
            'wikiticker_2019-08-04T03:00:00.000Z_2019-08-04T04:00:00.000Z_2019-08-04T03:00:00.392Z',
          columns: ['__time', 'added', 'added', 'channel'],
          events: [[1564887703049, 4996, 4996, '#vi.wikipedia']],
        },
        {
          segmentId:
            'wikiticker_2019-08-04T03:00:00.000Z_2019-08-04T04:00:00.000Z_2019-08-04T03:00:00.399Z',
          columns: ['__time', 'd1', 'd2'],
          events: [
            [1564887701848, 'va1', 'vb1'],
            [1564887701883, 'va2', 'vb2'],
          ],
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "__time",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "d1",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "d2",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              1564887701848,
              471,
              471,
              "#en.wikipedia",
            ],
            Array [
              1564887701883,
              44,
              44,
              "#en.wikipedia",
            ],
            Array [
              1564887703049,
              4996,
              4996,
              "#vi.wikipedia",
            ],
            Array [
              1564887701848,
              null,
              null,
              null,
              "va1",
              "vb1",
            ],
            Array [
              1564887701883,
              null,
              null,
              null,
              "va2",
              "vb2",
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for select', () => {
      const result = [
        {
          timestamp: '2019-01-01T00:00:00.321Z',
          result: {
            pagingIdentifiers: {
              'wikiticker_2019-01-01T00:00:00.000Z_2019-01-01T01:00:00.000Z_2019-01-01T00:00:00.378Z': 2,
            },
            dimensions: ['channel'],
            metrics: ['added'],
            events: [
              {
                segmentId:
                  'wikiticker_2019-01-01T00:00:00.000Z_2019-01-01T01:00:00.000Z_2019-01-01T00:00:00.378Z',
                offset: 0,
                event: {
                  timestamp: '2019-01-01T00:00:00.321Z',
                  channel: '#en.wikipedia',
                  added: 45,
                },
              },
              {
                segmentId:
                  'wikiticker_2019-01-01T00:00:00.000Z_2019-01-01T01:00:00.000Z_2019-01-01T00:00:00.378Z',
                offset: 1,
                event: {
                  timestamp: '2019-01-01T00:00:00.381Z',
                  channel: '#en.wikipedia',
                  added: 0,
                },
              },
              {
                segmentId:
                  'wikiticker_2019-01-01T00:00:00.000Z_2019-01-01T01:00:00.000Z_2019-01-01T00:00:00.378Z',
                offset: 2,
                event: {
                  timestamp: '2019-01-01T00:00:00.575Z',
                  channel: '#en.wikipedia',
                  added: 30,
                },
              },
            ],
          },
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2019-01-01T00:00:00.321Z",
              "#en.wikipedia",
              45,
            ],
            Array [
              "2019-01-01T00:00:00.381Z",
              "#en.wikipedia",
              0,
            ],
            Array [
              "2019-01-01T00:00:00.575Z",
              "#en.wikipedia",
              30,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for search', () => {
      const result = [
        {
          timestamp: '2012-01-01T00:00:00.000Z',
          result: [
            {
              dimension: 'dim1',
              value: 'Ke$ha',
              count: 3,
            },
            {
              dimension: 'dim2',
              value: 'Ke$haForPresident',
              count: 1,
            },
          ],
        },
        {
          timestamp: '2012-01-02T00:00:00.000Z',
          result: [
            {
              dimension: 'dim1',
              value: 'SomethingThatContainsKe',
              count: 1,
            },
          ],
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "dimension",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "value",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "dim1",
              "Ke$ha",
              3,
            ],
            Array [
              "dim2",
              "Ke$haForPresident",
              1,
            ],
            Array [
              "dim1",
              "SomethingThatContainsKe",
              1,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for timeBoundary', () => {
      const result = [
        {
          timestamp: '2013-05-09T18:24:00.000Z',
          result: {
            minTime: '2013-05-09T18:24:00.000Z',
            maxTime: '2013-05-09T18:37:00.000Z',
          },
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "minTime",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "maxTime",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2013-05-09T18:24:00.000Z",
              "2013-05-09T18:37:00.000Z",
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for dataSourceMetadata', () => {
      const result = [
        {
          timestamp: '2013-05-09T18:24:00.000Z',
          result: {
            maxIngestedEventTime: '2013-05-09T18:24:09.007Z',
          },
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "maxIngestedEventTime",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2013-05-09T18:24:09.007Z",
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for segmentMetadata', () => {
      const result = [
        {
          id: 'some_id',
          intervals: ['2013-05-13T00:00:00.000Z/2013-05-14T00:00:00.000Z'],
          columns: {
            __time: {
              type: 'LONG',
              hasMultipleValues: false,
              size: 407240380,
              cardinality: null,
              errorMessage: null,
            },
            dim1: {
              type: 'STRING',
              hasMultipleValues: false,
              size: 100000,
              cardinality: 1944,
              errorMessage: null,
            },
            metric1: {
              type: 'FLOAT',
              hasMultipleValues: false,
              size: 100000,
              cardinality: null,
              errorMessage: null,
            },
          },
          aggregators: {
            metric1: { type: 'longSum', name: 'metric1', fieldName: 'metric1' },
          },
          queryGranularity: {
            type: 'none',
          },
          size: 300000,
          numRows: 5000000,
        },
      ];

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "column",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "type",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "hasMultipleValues",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "size",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "cardinality",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "errorMessage",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "aggregator",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "__time",
              "LONG",
              false,
              407240380,
              null,
              null,
              null,
            ],
            Array [
              "dim1",
              "STRING",
              false,
              100000,
              1944,
              null,
              null,
            ],
            Array [
              "metric1",
              "FLOAT",
              false,
              100000,
              null,
              null,
              Object {
                "fieldName": "metric1",
                "name": "metric1",
                "type": "longSum",
              },
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for sql (resultFormat: array)', () => {
      const result = [
        ['Time', 'Count'],
        ['2019-08-04T15:00:00.000Z', 910],
        ['2019-08-04T16:00:00.000Z', 15600],
      ];

      expect(QueryResult.fromRawResult(result, false, true)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "Time",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "Count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "2019-08-04T15:00:00.000Z",
              910,
            ],
            Array [
              "2019-08-04T16:00:00.000Z",
              15600,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works for sql (resultFormat: arrayWithTrailer)', () => {
      const result = {
        results: [
          ['Time', 'Count'],
          ['2019-08-04T15:00:00.000Z', 910],
          ['2019-08-04T16:00:00.000Z', 15600],
        ],
        context: {
          metrics: {},
        },
      };

      expect(QueryResult.fromRawResult(result, false, true)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "Time",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "Count",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": Object {
            "metrics": Object {},
          },
          "rows": Array [
            Array [
              "2019-08-04T15:00:00.000Z",
              910,
            ],
            Array [
              "2019-08-04T16:00:00.000Z",
              15600,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works with a newline only string result', () => {
      const result = '\n\n\n';

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works with non-empty string result', () => {
      const result = `{"channel":"#sv.wikipedia","added":31}
{"channel":"#ja.wikipedia","added":125}
{"channel":"#en.wikipedia","added":2}

`;

      expect(QueryResult.fromRawResult(result)).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "channel",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "added",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "#sv.wikipedia",
              31,
            ],
            Array [
              "#ja.wikipedia",
              125,
            ],
            Array [
              "#en.wikipedia",
              2,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('throws on an empty string result', () => {
      expect(() => QueryResult.fromRawResult('')).toThrow(
        `Query results were empty. This may indicate a timeout caused by an intermediate network device (such as a load balancer). Try re-running your query, using a lower limit.`,
      );
    });

    it('works with truncated string result', () => {
      const result = `{"channel":"#sv.wikipedia","added":31}
{"channel":"#ja.wikipedia","added":125}
{"channel":"#en.wikipedia",`;

      expect(() => QueryResult.fromRawResult(result)).toThrow(
        `Query results were truncated midstream. This may indicate a server-side error or a client-side issue. Try re-running your query using a lower limit.`,
      );
    });

    it('works with invalid string result', () => {
      const result = `{"channel":"#sv.wikipedia","added":31}
{"channel":"#ja.wikipedia","added":125}
{"channel":"#en.wikipedia",

`;

      expect(() => QueryResult.fromRawResult(result)).toThrow(
        `Unparsable row on line 3 in query result: '{"channel":"#en.wikipedia",'.`,
      );
    });

    it('names the columns by index when there is no header', () => {
      const result = QueryResult.fromRawResult([
        ['a', 1],
        ['b', 2],
      ]);
      expect(result.getHeaderNames()).toEqual(['0', '1']);
      expect(result.rows).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });

    it('unwraps results with a context', () => {
      const result = QueryResult.fromRawResult(
        { results: [['x'], [1]], context: { foo: 'bar' } },
        false,
        true,
      );
      expect(result.getHeaderNames()).toEqual(['x']);
      expect(result.rows).toEqual([[1]]);
      expect(result.resultContext).toEqual({ foo: 'bar' });
    });

    it('unwraps results without a context', () => {
      const result = QueryResult.fromRawResult({ results: [['x'], [1]] }, false, true);
      expect(result.rows).toEqual([[1]]);
      expect(result.resultContext).toBeUndefined();
    });

    it('returns a blank result with the context for empty results', () => {
      const result = QueryResult.fromRawResult({ results: [], context: { foo: 'bar' } });
      expect(result.header).toEqual([]);
      expect(result.rows).toEqual([]);
      expect(result.resultContext).toEqual({ foo: 'bar' });
    });

    it('returns a blank result for topN with no sub rows', () => {
      expect(
        QueryResult.fromRawResult([{ timestamp: '2019-08-04T15:00:00.000Z', result: [] }]),
      ).toBe(QueryResult.BLANK);
    });

    it('returns a header only result for a scan with no events', () => {
      const result = QueryResult.fromRawResult([
        { segmentId: 's', columns: ['a', 'b'], events: [] },
      ]);
      expect(result.getHeaderNames()).toEqual(['a', 'b']);
      expect(result.rows).toEqual([]);
    });

    it('throws on scan events that are not arrays or objects', () => {
      expect(() =>
        QueryResult.fromRawResult([{ segmentId: 's', columns: ['a'], events: ['x'] }]),
      ).toThrow('Unexpected scan like results.');
    });

    it('throws on an array of non objects', () => {
      expect(() => QueryResult.fromRawResult([1, 2])).toThrow(
        'Unexpected query result, array of non objects or arrays.',
      );
    });

    it('throws on a non array result', () => {
      expect(() => QueryResult.fromRawResult({ hello: 'world' })).toThrow(
        'Unrecognizable query return shape, not an array.',
      );
      expect(() => QueryResult.fromRawResult(5)).toThrow(
        'Unrecognizable query return shape, not an array.',
      );
    });
  });

  describe('.fromObjectArray', () => {
    it('uses the keys of the first object as the header', () => {
      const result = QueryResult.fromObjectArray([
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
      ]);
      expect(result.header).toEqual([new Column({ name: 'a' }), new Column({ name: 'b' })]);
      expect(result.rows).toEqual([
        [1, 'x'],
        [2, 'y'],
      ]);
    });

    it('skips the header row', () => {
      const result = QueryResult.fromObjectArray(
        [
          { a: 'a', b: 'b' },
          { a: 1, b: 'x' },
        ],
        true,
      );
      expect(result.header).toEqual([new Column({ name: 'a' }), new Column({ name: 'b' })]);
      expect(result.rows).toEqual([[1, 'x']]);
    });

    it('reads the types from the header row', () => {
      const result = QueryResult.fromObjectArray(
        [
          { a: { type: 'LONG', sqlType: 'BIGINT' }, b: { type: 'STRING', sqlType: 'VARCHAR' } },
          { a: 1, b: 'x' },
        ],
        true,
        true,
      );
      expect(result.header).toEqual([
        new Column({ name: 'a', nativeType: 'LONG', sqlType: 'BIGINT' }),
        new Column({ name: 'b', nativeType: 'STRING', sqlType: 'VARCHAR' }),
      ]);
      expect(result.rows).toEqual([[1, 'x']]);
    });

    it('returns a blank result for an empty array', () => {
      expect(QueryResult.fromObjectArray([])).toBe(QueryResult.BLANK);
    });
  });

  describe('#valueOf', () => {
    it('returns all the fields', () => {
      const result = testQueryResult
        .attachQuery({ query: 'SELECT 1' })
        .attachQueryId('q', 'sq')
        .changeQueryDuration(12)
        .changeResultContext({ foo: 1 });
      expect(result.valueOf()).toEqual({
        header: testQueryResult.header,
        rows: testQueryResult.rows,
        query: { query: 'SELECT 1' },
        sqlQuery: undefined,
        queryId: 'q',
        sqlQueryId: 'sq',
        resultContext: { foo: 1 },
        queryDuration: 12,
      });
    });
  });

  describe('#changeQueryDuration', () => {
    it('sets the duration on a new result', () => {
      const result = testQueryResult.changeQueryDuration(42);
      expect(result.queryDuration).toEqual(42);
      expect(result).not.toBe(testQueryResult);
      expect(testQueryResult.queryDuration).toBeUndefined();
    });
  });

  describe('#attachQuery', () => {
    it('attaches the payload and the parsed query', () => {
      const sqlQuery = SqlQuery.parse('SELECT * FROM tbl');
      const result = testQueryResult.attachQuery({ query: 'SELECT * FROM tbl' }, sqlQuery);
      expect(result.query).toEqual({ query: 'SELECT * FROM tbl' });
      expect(result.sqlQuery).toBe(sqlQuery);
      expect(result.rows).toBe(testQueryResult.rows);
    });
  });

  describe('#attachQueryId', () => {
    it('attaches the query ids', () => {
      const result = testQueryResult.attachQueryId('q1', 'sq1');
      expect(result.queryId).toEqual('q1');
      expect(result.sqlQueryId).toEqual('sq1');
    });

    it('works with only a native query id', () => {
      const result = testQueryResult.attachQueryId('q1');
      expect(result.queryId).toEqual('q1');
      expect(result.sqlQueryId).toBeUndefined();
    });
  });

  describe('#changeResultContext', () => {
    it('sets the result context', () => {
      const context = { foo: 'bar' };
      const result = testQueryResult.changeResultContext(context);
      expect(result.resultContext).toBe(context);
      expect(result).not.toBe(testQueryResult);
    });

    it('returns the same instance when the context is unchanged', () => {
      expect(testQueryResult.changeResultContext(undefined)).toBe(testQueryResult);
      const withContext = testQueryResult.changeResultContext({ a: 1 });
      expect(withContext.changeResultContext(withContext.resultContext)).toBe(withContext);
    });
  });

  describe('#getHeaderNames', () => {
    it('returns the column names', () => {
      expect(testQueryResult.getHeaderNames()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('#isEmpty', () => {
    it('tells if there are no rows', () => {
      expect(testQueryResult.isEmpty()).toEqual(false);
      expect(QueryResult.BLANK.isEmpty()).toEqual(true);
    });
  });

  describe('#getNumResults', () => {
    it('counts the rows', () => {
      expect(testQueryResult.getNumResults()).toEqual(3);
      expect(QueryResult.BLANK.getNumResults()).toEqual(0);
    });
  });

  describe('#toObjectArray', () => {
    it('works', () => {
      expect(testQueryResult.toObjectArray()).toEqual([
        {
          A: 'A',
          B: '2016-06-27T00:00:00.000Z',
          C: 876,
        },
        {
          A: 'J',
          B: '2016-06-27T01:00:00.000Z',
          C: 870,
        },
        {
          A: 'K',
          B: '2016-06-27T02:00:00.000Z',
          C: 960,
        },
      ]);
    });
  });

  describe('#getColumnByIndex', () => {
    it('works for invalid index', () => {
      expect(testQueryResult.getColumnByIndex(3)).toBeUndefined();
    });

    it('works for valid index', () => {
      expect(testQueryResult.getColumnByIndex(2)).toEqual([876, 870, 960]);
    });
  });

  describe('#getColumnByName', () => {
    it('works for invalid name', () => {
      expect(testQueryResult.getColumnByName('foo')).toBeUndefined();
    });

    it('works for valid name', () => {
      expect(testQueryResult.getColumnByName('C')).toEqual([876, 870, 960]);
    });
  });

  describe('#getSqlOuterLimit', () => {
    it('reads sqlOuterLimit from the query context', () => {
      expect(
        testQueryResult
          .attachQuery({ query: 'SELECT 1', context: { sqlOuterLimit: 100 } })
          .getSqlOuterLimit(),
      ).toEqual(100);
    });

    it('returns undefined when there is no query or context', () => {
      expect(testQueryResult.getSqlOuterLimit()).toBeUndefined();
      expect(testQueryResult.attachQuery({ query: 'SELECT 1' }).getSqlOuterLimit()).toBeUndefined();
      expect(
        testQueryResult.attachQuery({ query: 'SELECT 1', context: {} }).getSqlOuterLimit(),
      ).toBeUndefined();
    });
  });

  describe('#inflateDatesByGuessing', () => {
    it('does not inflate nulls', () => {
      expect(
        new QueryResult({
          header: Column.fromColumnNames(['A', 'B', 'C']),
          rows: [
            ['A', '2016-06-27T00:00:00.000Z', 876],
            ['J', null, 870],
            ['K', '2016-06-27T02:00:00.000Z', 960],
          ],
        }).inflateDatesByGuessing(),
      ).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "A",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "B",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "C",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "A",
              2016-06-27T00:00:00.000Z,
              876,
            ],
            Array [
              "J",
              null,
              870,
            ],
            Array [
              "K",
              2016-06-27T02:00:00.000Z,
              960,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('works', () => {
      expect(testQueryResult.inflateDatesByGuessing()).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "A",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "B",
              "nativeType": undefined,
              "sqlType": undefined,
            },
            Column {
              "name": "C",
              "nativeType": undefined,
              "sqlType": undefined,
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "A",
              2016-06-27T00:00:00.000Z,
              876,
            ],
            Array [
              "J",
              2016-06-27T01:00:00.000Z,
              870,
            ],
            Array [
              "K",
              2016-06-27T02:00:00.000Z,
              960,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });
  });

  describe('#inflateDatesFromSqlTypes', () => {
    it('inflates columns with TIMESTAMP sqlType', () => {
      expect(
        new QueryResult({
          header: Column.fromColumnNamesAndTypeArrays(
            ['name', 'timestamp', 'count'],
            [],
            ['VARCHAR', 'TIMESTAMP', 'BIGINT'],
          ),
          rows: [
            ['Alice', '2016-06-27T00:00:00.000Z', 876],
            ['Bob', '2016-06-27T01:00:00.000Z', 870],
            ['Charlie', '2016-06-27T02:00:00.000Z', 960],
          ],
        }).inflateDatesFromSqlTypes(),
      ).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "name",
              "nativeType": undefined,
              "sqlType": "VARCHAR",
            },
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": "TIMESTAMP",
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": "BIGINT",
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "Alice",
              2016-06-27T00:00:00.000Z,
              876,
            ],
            Array [
              "Bob",
              2016-06-27T01:00:00.000Z,
              870,
            ],
            Array [
              "Charlie",
              2016-06-27T02:00:00.000Z,
              960,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('does not inflate nulls in TIMESTAMP columns', () => {
      expect(
        new QueryResult({
          header: Column.fromColumnNamesAndTypeArrays(
            ['name', 'timestamp', 'count'],
            [],
            ['VARCHAR', 'TIMESTAMP', 'BIGINT'],
          ),
          rows: [
            ['Alice', '2016-06-27T00:00:00.000Z', 876],
            ['Bob', null, 870],
            ['Charlie', '2016-06-27T02:00:00.000Z', 960],
          ],
        }).inflateDatesFromSqlTypes(),
      ).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "name",
              "nativeType": undefined,
              "sqlType": "VARCHAR",
            },
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": "TIMESTAMP",
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": "BIGINT",
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "Alice",
              2016-06-27T00:00:00.000Z,
              876,
            ],
            Array [
              "Bob",
              null,
              870,
            ],
            Array [
              "Charlie",
              2016-06-27T02:00:00.000Z,
              960,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('handles multiple TIMESTAMP columns', () => {
      expect(
        new QueryResult({
          header: Column.fromColumnNamesAndTypeArrays(
            ['created', 'name', 'updated'],
            [],
            ['TIMESTAMP', 'VARCHAR', 'TIMESTAMP'],
          ),
          rows: [
            ['2016-06-27T00:00:00.000Z', 'Alice', '2016-06-28T00:00:00.000Z'],
            ['2016-06-27T01:00:00.000Z', 'Bob', '2016-06-28T01:00:00.000Z'],
          ],
        }).inflateDatesFromSqlTypes(),
      ).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "created",
              "nativeType": undefined,
              "sqlType": "TIMESTAMP",
            },
            Column {
              "name": "name",
              "nativeType": undefined,
              "sqlType": "VARCHAR",
            },
            Column {
              "name": "updated",
              "nativeType": undefined,
              "sqlType": "TIMESTAMP",
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              2016-06-27T00:00:00.000Z,
              "Alice",
              2016-06-28T00:00:00.000Z,
            ],
            Array [
              2016-06-27T01:00:00.000Z,
              "Bob",
              2016-06-28T01:00:00.000Z,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('does not inflate columns without TIMESTAMP sqlType', () => {
      expect(
        new QueryResult({
          header: Column.fromColumnNamesAndTypeArrays(
            ['name', 'date_string', 'count'],
            [],
            ['VARCHAR', 'VARCHAR', 'BIGINT'],
          ),
          rows: [
            ['Alice', '2016-06-27T00:00:00.000Z', 876],
            ['Bob', '2016-06-27T01:00:00.000Z', 870],
          ],
        }).inflateDatesFromSqlTypes(),
      ).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "name",
              "nativeType": undefined,
              "sqlType": "VARCHAR",
            },
            Column {
              "name": "date_string",
              "nativeType": undefined,
              "sqlType": "VARCHAR",
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": "BIGINT",
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              "Alice",
              "2016-06-27T00:00:00.000Z",
              876,
            ],
            Array [
              "Bob",
              "2016-06-27T01:00:00.000Z",
              870,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('returns same instance when no TIMESTAMP columns present', () => {
      const result = new QueryResult({
        header: Column.fromColumnNamesAndTypeArrays(['name', 'count'], [], ['VARCHAR', 'BIGINT']),
        rows: [
          ['Alice', 876],
          ['Bob', 870],
        ],
      });

      const inflated = result.inflateDatesFromSqlTypes();
      expect(inflated).toBe(result);
    });

    it('inflates TIMESTAMP columns with millisecond numbers', () => {
      expect(
        new QueryResult({
          header: Column.fromColumnNamesAndTypeArrays(
            ['__time', 'name', 'count'],
            [],
            ['TIMESTAMP', 'VARCHAR', 'BIGINT'],
          ),
          rows: [
            [1467072000000, 'Alice', 876],
            [1467075600000, 'Bob', 870],
            [1467079200000n, 'Charlie', 960], // test with bigint literal
          ],
        }).inflateDatesFromSqlTypes(),
      ).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "__time",
              "nativeType": undefined,
              "sqlType": "TIMESTAMP",
            },
            Column {
              "name": "name",
              "nativeType": undefined,
              "sqlType": "VARCHAR",
            },
            Column {
              "name": "count",
              "nativeType": undefined,
              "sqlType": "BIGINT",
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              2016-06-28T00:00:00.000Z,
              "Alice",
              876,
            ],
            Array [
              2016-06-28T01:00:00.000Z,
              "Bob",
              870,
            ],
            Array [
              2016-06-28T02:00:00.000Z,
              "Charlie",
              960,
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });

    it('handles mixed string and millisecond TIMESTAMP values', () => {
      expect(
        new QueryResult({
          header: Column.fromColumnNamesAndTypeArrays(
            ['timestamp', 'name'],
            [],
            ['TIMESTAMP', 'VARCHAR'],
          ),
          rows: [
            ['2016-06-27T00:00:00.000Z', 'Alice'],
            [1467075600000, 'Bob'],
            ['2016-06-27T02:00:00.000Z', 'Charlie'],
          ],
        }).inflateDatesFromSqlTypes(),
      ).toMatchInlineSnapshot(`
        QueryResult {
          "header": Array [
            Column {
              "name": "timestamp",
              "nativeType": undefined,
              "sqlType": "TIMESTAMP",
            },
            Column {
              "name": "name",
              "nativeType": undefined,
              "sqlType": "VARCHAR",
            },
          ],
          "query": undefined,
          "queryDuration": undefined,
          "queryId": undefined,
          "resultContext": undefined,
          "rows": Array [
            Array [
              2016-06-27T00:00:00.000Z,
              "Alice",
            ],
            Array [
              2016-06-28T01:00:00.000Z,
              "Bob",
            ],
            Array [
              2016-06-27T02:00:00.000Z,
              "Charlie",
            ],
          ],
          "sqlQuery": undefined,
          "sqlQueryId": undefined,
        }
      `);
    });
  });
});
