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

import { normalizeQueryResult } from './query-result-decoder';

describe('normalizeQueryResult', () => {
  it('works for timeseries (no timestamp)', () => {
    const result = [{ timestamp: '2019-08-04T15:00:00.000Z', result: { count: 514, added: 1232 } }];

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "count",
          "added",
        ],
        "rows": Array [
          Array [
            514,
            1232,
          ],
        ],
      }
    `);
  });

  it('works for timeseries (with timestamp)', () => {
    const result = [
      { timestamp: '2019-08-04T15:00:00.000Z', result: { count: 514, added: 196263 } },
      { timestamp: '2019-08-04T16:00:00.000Z', result: { count: 15600, added: 6123934 } },
    ];

    expect(normalizeQueryResult(result, true)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "timestamp",
          "count",
          "added",
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "added",
          "channel",
          "count",
        ],
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
      }
    `);

    expect(normalizeQueryResult(result, true)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "timestamp",
          "added",
          "channel",
          "count",
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "d0",
          "a0",
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "channel",
          "count",
        ],
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
      }
    `);

    expect(normalizeQueryResult(result, true)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "timestamp",
          "channel",
          "count",
        ],
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
              result: [{ d0: '#en.wikipedia', a0: 42 }, { d0: '#es.wikipedia', a0: 7 }],
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

    expect(normalizeQueryResult(result, true)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "timestamp",
          "d0",
          "a0",
        ],
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
    ];

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "__time",
          "added",
          "channel",
        ],
        "rows": Array [
          Array [
            1564887701848,
            471,
            "#en.wikipedia",
          ],
          Array [
            1564887701883,
            44,
            "#en.wikipedia",
          ],
          Array [
            1564887703049,
            4996,
            "#vi.wikipedia",
          ],
        ],
      }
    `);
  });

  it('works for scan(compactedList)', () => {
    const result = [
      {
        segmentId:
          'wikiticker_2019-08-04T03:00:00.000Z_2019-08-04T04:00:00.000Z_2019-08-04T03:00:00.391Z',
        columns: ['__time', 'added', 'channel'],
        events: [
          [1564887701848, 471, '#en.wikipedia'],
          [1564887701883, 44, '#en.wikipedia'],
          [1564887703049, 4996, '#vi.wikipedia'],
        ],
      },
    ];

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "__time",
          "added",
          "channel",
        ],
        "rows": Array [
          Array [
            1564887701848,
            471,
            "#en.wikipedia",
          ],
          Array [
            1564887701883,
            44,
            "#en.wikipedia",
          ],
          Array [
            1564887703049,
            4996,
            "#vi.wikipedia",
          ],
        ],
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
              event: { timestamp: '2019-01-01T00:00:00.321Z', channel: '#en.wikipedia', added: 45 },
            },
            {
              segmentId:
                'wikiticker_2019-01-01T00:00:00.000Z_2019-01-01T01:00:00.000Z_2019-01-01T00:00:00.378Z',
              offset: 1,
              event: { timestamp: '2019-01-01T00:00:00.381Z', channel: '#en.wikipedia', added: 0 },
            },
            {
              segmentId:
                'wikiticker_2019-01-01T00:00:00.000Z_2019-01-01T01:00:00.000Z_2019-01-01T00:00:00.378Z',
              offset: 2,
              event: { timestamp: '2019-01-01T00:00:00.575Z', channel: '#en.wikipedia', added: 30 },
            },
          ],
        },
      },
    ];

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "timestamp",
          "channel",
          "added",
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "dimension",
          "value",
          "count",
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "dimension",
          "value",
          "count",
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "minTime",
          "maxTime",
        ],
        "rows": Array [
          Array [
            "2013-05-09T18:24:00.000Z",
            "2013-05-09T18:37:00.000Z",
          ],
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "maxIngestedEventTime",
        ],
        "rows": Array [
          Array [
            "2013-05-09T18:24:09.007Z",
          ],
        ],
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

    expect(normalizeQueryResult(result)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "column",
          "type",
          "hasMultipleValues",
          "size",
          "cardinality",
          "errorMessage",
        ],
        "rows": Array [
          Array [
            "__time",
            "LONG",
            false,
            407240380,
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
          ],
          Array [
            "metric1",
            "FLOAT",
            false,
            100000,
            null,
            null,
          ],
        ],
      }
    `);
  });

  it('works for sql', () => {
    const result = [
      ['Time', 'Count'],
      ['2019-08-04T15:00:00.000Z', 910],
      ['2019-08-04T16:00:00.000Z', 15600],
    ];

    expect(normalizeQueryResult(result, false, true)).toMatchInlineSnapshot(`
      Object {
        "header": Array [
          "Time",
          "Count",
        ],
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
      }
    `);
  });
});
