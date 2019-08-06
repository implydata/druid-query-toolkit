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
import { sqlParserFactory } from './parser/druidsql';
import { FUNCTIONS } from './test-utils';

const parser = sqlParserFactory(FUNCTIONS);

// describe('Expression Tests', () => {
//   it('parsers a basic math expression', () => {
//     expect(parser(`1 + 1`)).toMatchSnapshot();
//   });
//
//   it('parsers an expression with all operators', () => {
//     expect(parser(`1 + 1 / 1 * 1 - 1`)).toMatchSnapshot();
//   });
//
//   it('parsers an expression with brackets', () => {
//     expect(
//       parser(`
//     2 * (3 + 4)
//     `),
//     ).toMatchSnapshot();
//   });
//
//   it('parsers an expression with string values', () => {
//     expect(parser('\'column\' = "value"')).toMatchSnapshot();
//   });
// });

describe('ast action for segments test', () => {
  it('renders remove Column', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).excludeColumn('start');

    expect(tree).toMatchInlineSnapshot(`
            SqlQuery {
              "columns": Columns {
                "columns": Array [
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "segment_id",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "datasource",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "end",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "size",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "version",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "partition_num",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "num_replicas",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "num_rows",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "is_published",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "is_available",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "is_realtime",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "is_overshadowed",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                  Column {
                    "alias": null,
                    "ex": RefExpression {
                      "name": StringType {
                        "chars": "payload",
                        "quote": "\\"",
                        "spacing": Array [
                          null,
                          null,
                        ],
                      },
                      "namespace": null,
                      "quote": undefined,
                      "quoteSpacing": undefined,
                    },
                    "parens": Array [],
                    "spacing": null,
                  },
                ],
                "parens": Array [],
                "spacing": Array [
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  " ",
                  undefined,
                ],
              },
              "distinct": null,
              "fromClause": FromClause {
                "alias": null,
                "fc": RefExpression {
                  "name": "segments",
                  "namespace": "sys",
                  "quote": undefined,
                  "quoteSpacing": undefined,
                },
                "keyword": "FROM",
                "parens": undefined,
                "spacing": Array [
                  " ",
                  null,
                ],
              },
              "groupByClause": undefined,
              "havingClause": null,
              "limitClause": LimitClause {
                "keyword": "LIMIT",
                "spacing": Array [
                  " ",
                ],
                "value": Array [
                  Integer {
                    "value": "25",
                  },
                ],
              },
              "orderByClause": undefined,
              "spacing": Array [
                null,
                " ",
                "
            ",
                null,
                null,
                null,
                "
            ",
                "
            ",
                "",
              ],
              "type": "query",
              "verb": "SELECT",
              "whereClause": null,
            }
        `);
  });

  it('renders orderBy', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`)
      .orderBy('datasource', 'DESC')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
                                    FROM sys.segments
                                    ORDER BY \\"datasource\\" DESC
                                    LIMIT 25"
                        `);
  });

  it('renders exclude row', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).filterRow('datasource', 'github', '!=');

    expect(tree).toMatchInlineSnapshot(`
      SqlQuery {
        "columns": Columns {
          "columns": Array [
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "segment_id",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "datasource",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "start",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "end",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "size",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "version",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "partition_num",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "num_replicas",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "num_rows",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "is_published",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "is_available",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "is_realtime",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "is_overshadowed",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
            Column {
              "alias": null,
              "ex": RefExpression {
                "name": StringType {
                  "chars": "payload",
                  "quote": "\\"",
                  "spacing": Array [
                    null,
                    null,
                  ],
                },
                "namespace": null,
                "quote": undefined,
                "quoteSpacing": undefined,
              },
              "parens": Array [],
              "spacing": null,
            },
          ],
          "parens": Array [],
          "spacing": Array [
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
          ],
        },
        "distinct": null,
        "fromClause": FromClause {
          "alias": null,
          "fc": RefExpression {
            "name": "segments",
            "namespace": "sys",
            "quote": undefined,
            "quoteSpacing": undefined,
          },
          "keyword": "FROM",
          "parens": undefined,
          "spacing": Array [
            " ",
            null,
          ],
        },
        "groupByClause": null,
        "havingClause": null,
        "limitClause": LimitClause {
          "keyword": "LIMIT",
          "spacing": Array [
            " ",
          ],
          "value": Array [
            Integer {
              "value": "25",
            },
          ],
        },
        "orderByClause": OrderByClause {
          "byKeyword": "BY",
          "orderBy": Array [
            OrderByPart {
              "direction": "DESC",
              "orderBy": StringType {
                "chars": "start",
                "quote": "\\"",
                "spacing": Array [
                  null,
                  null,
                ],
              },
              "spacing": Array [
                " ",
              ],
            },
          ],
          "orderKeyword": "ORDER",
          "spacing": Array [
            " ",
            " ",
          ],
        },
        "spacing": Array [
          null,
          " ",
          "
      ",
          "
      ",
          null,
          null,
          "
      ",
          "
      ",
          "",
        ],
        "type": "query",
        "verb": "SELECT",
        "whereClause": WhereClause {
          "filter": ComparisonExpression {
            "ex": StringType {
              "chars": "datasource",
              "quote": "\\"",
              "spacing": Array [
                "",
                "",
              ],
            },
            "parens": Array [],
            "rhs": ComparisonExpressionRhs {
              "is": null,
              "not": null,
              "op": "!=",
              "parens": Array [],
              "rhs": StringType {
                "chars": "github",
                "quote": "'",
                "spacing": Array [
                  "",
                  "",
                ],
              },
              "spacing": Array [
                "",
              ],
            },
            "spacing": Array [
              "",
            ],
          },
          "keyword": "WHERE",
          "spacing": Array [
            " ",
          ],
        },
      }
    `);
  });

  it('renders getSorted', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getSorted();

    expect(tree).toMatchInlineSnapshot(`
                                                                        Array [
                                                                          Object {
                                                                            "desc": true,
                                                                            "id": "start",
                                                                          },
                                                                        ]
                                                `);
  });

  it('renders getSchema', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getSchema();
    expect(tree).toMatchInlineSnapshot(`"sys"`);
  });

  it('renders getTableName', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getTableName();
    expect(tree).toMatchInlineSnapshot(`"segments"`);
  });

  it('renders getAggregateColumns', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getAggregateColumns();
    expect(tree).toMatchInlineSnapshot(`undefined`);
  });

  it('renders getColumnsArray', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getColumnsArray();
    expect(tree).toMatchInlineSnapshot(`
                                                            Array [
                                                              "segment_id",
                                                              "datasource",
                                                              "start",
                                                              "end",
                                                              "size",
                                                              "version",
                                                              "partition_num",
                                                              "num_replicas",
                                                              "num_rows",
                                                              "is_published",
                                                              "is_available",
                                                              "is_realtime",
                                                              "is_overshadowed",
                                                              "payload",
                                                            ]
                                        `);
  });

  it('renders toString', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).toString();

    expect(tree).toMatchInlineSnapshot(`
                                                      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
                                                      FROM sys.segments
                                                      ORDER BY \\"start\\" DESC
                                                      LIMIT 25"
                                    `);
  });
});

describe('ast for full query action Tests', () => {
  it('renders remove Column', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('datasource')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT
                                      COUNT(*) AS num_segments,
                                      SUM(is_available) AS num_available_segments,
                                      SUM(\\"size\\") AS size,
                                      SUM(\\"num_rows\\") AS num_rows,
                                      CASE WHEN \\"status\\" = 'RUNNING' THEN
                                      (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                      ELSE 1 END AS \\"rank\\"
                                    FROM sys.segments
                                    GROUP BY 1
                                    ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                        `);
  });

  it('renders orderBy', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .orderBy('datasource', 'DESC')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT
                                      datasource,
                                      COUNT(*) AS num_segments,
                                      SUM(is_available) AS num_available_segments,
                                      SUM(\\"size\\") AS size,
                                      SUM(\\"num_rows\\") AS num_rows,
                                      CASE WHEN \\"status\\" = 'RUNNING' THEN
                                      (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                      ELSE 1 END AS \\"rank\\"
                                    FROM sys.segments
                                    GROUP BY 1,2
                                    ORDER BY \\"datasource\\" DESC"
                        `);
  });

  it('renders exclude row', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .filterRow('datasource', 'rowvalue', '!=')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT
                                      datasource,
                                      COUNT(*) AS num_segments,
                                      SUM(is_available) AS num_available_segments,
                                      SUM(\\"size\\") AS size,
                                      SUM(\\"num_rows\\") AS num_rows,
                                      CASE WHEN \\"status\\" = 'RUNNING' THEN
                                      (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                      ELSE 1 END AS \\"rank\\"
                                    FROM sys.segments
                                    WHERE \\"datasource\\"!='rowvalue'
                                    GROUP BY 1,2
                                    ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                        `);
  });

  it('renders getSorted', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getSorted();
    expect(tree).toMatchInlineSnapshot(`
                                                Array [
                                                  Object {
                                                    "desc": true,
                                                    "id": "rank",
                                                  },
                                                  Object {
                                                    "desc": true,
                                                    "id": "created_time",
                                                  },
                                                ]
                                `);
  });

  it('renders getSchema', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getSchema();
    expect(tree).toMatchInlineSnapshot(`"sys"`);
  });

  it('renders getTableName', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getTableName();
    expect(tree).toMatchInlineSnapshot(`"segments"`);
  });

  it('renders getAggregateColumns', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getAggregateColumns();
    expect(tree).toMatchInlineSnapshot(`
                                                Array [
                                                  "num_available_segments",
                                                  "size",
                                                  "num_rows",
                                                  "rank",
                                                ]
                                `);
  });

  it('renders getColumnsArray', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getColumnsArray();
    expect(tree).toMatchInlineSnapshot(`
                                                Array [
                                                  "datasource",
                                                  "num_segments",
                                                  "num_available_segments",
                                                  "size",
                                                  "num_rows",
                                                  "rank",
                                                ]
                                `);
  });

  it('renders toString', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).toString();

    expect(tree).toMatchInlineSnapshot(`
                                                "SELECT
                                                  datasource,
                                                  COUNT(*) AS num_segments,
                                                  SUM(is_available) AS num_available_segments,
                                                  SUM(\\"size\\") AS size,
                                                  SUM(\\"num_rows\\") AS num_rows,
                                                  CASE WHEN \\"status\\" = 'RUNNING' THEN
                                                  (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                                  ELSE 1 END AS \\"rank\\"
                                                FROM sys.segments
                                                GROUP BY 1,2
                                                ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                                `);
  });
});

describe('ast for full query including whereClause action Tests', () => {
  it('renders remove Column', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('datasource')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT
                                      COUNT(*) AS num_segments,
                                      SUM(is_available) AS num_available_segments,
                                      SUM(\\"size\\") AS size,
                                      SUM(\\"num_rows\\") AS num_rows,
                                      CASE WHEN \\"status\\" = 'RUNNING' THEN
                                      (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                      ELSE 1 END AS \\"rank\\"
                                    FROM sys.segments
                                    WHERE \\"size\\" = '12'
                                    GROUP BY 1
                                    ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                        `);
  });

  it('renders orderBy', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .orderBy('datasource', 'DESC')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT
                                      datasource,
                                      COUNT(*) AS num_segments,
                                      SUM(is_available) AS num_available_segments,
                                      SUM(\\"size\\") AS size,
                                      SUM(\\"num_rows\\") AS num_rows,
                                      CASE WHEN \\"status\\" = 'RUNNING' THEN
                                      (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                      ELSE 1 END AS \\"rank\\"
                                    FROM sys.segments
                                    WHERE \\"size\\" = '12'
                                    GROUP BY 1,2
                                    ORDER BY \\"datasource\\" DESC"
                        `);
  });

  it('renders exclude row', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .filterRow('datasource', 'rowvalue', '!=')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT
                                      datasource,
                                      COUNT(*) AS num_segments,
                                      SUM(is_available) AS num_available_segments,
                                      SUM(\\"size\\") AS size,
                                      SUM(\\"num_rows\\") AS num_rows,
                                      CASE WHEN \\"status\\" = 'RUNNING' THEN
                                      (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                      ELSE 1 END AS \\"rank\\"
                                    FROM sys.segments
                                    WHERE \\"size\\" = '12' AND \\"datasource\\"!='rowvalue'
                                    GROUP BY 1,2
                                    ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                        `);
  });

  it('renders getSorted', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getSorted();
    expect(tree).toMatchInlineSnapshot(`
                                                Array [
                                                  Object {
                                                    "desc": true,
                                                    "id": "rank",
                                                  },
                                                  Object {
                                                    "desc": true,
                                                    "id": "created_time",
                                                  },
                                                ]
                                `);
  });

  it('renders getSchema', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getSchema();
    expect(tree).toMatchInlineSnapshot(`"sys"`);
  });

  it('renders getTableName', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getTableName();
    expect(tree).toMatchInlineSnapshot(`"segments"`);
  });

  it('renders getAggregateColumns', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getAggregateColumns();
    expect(tree).toMatchInlineSnapshot(`
                                                Array [
                                                  "num_available_segments",
                                                  "size",
                                                  "num_rows",
                                                  "rank",
                                                ]
                                `);
  });

  it('renders getColumnsArray', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).getColumnsArray();
    expect(tree).toMatchInlineSnapshot(`
                                                Array [
                                                  "datasource",
                                                  "num_segments",
                                                  "num_available_segments",
                                                  "size",
                                                  "num_rows",
                                                  "rank",
                                                ]
                                `);
  });

  it('renders toString', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`).toString();

    expect(tree).toMatchInlineSnapshot(`
                                          "SELECT
                                            datasource,
                                            COUNT(*) AS num_segments,
                                            SUM(is_available) AS num_available_segments,
                                            SUM(\\"size\\") AS size,
                                            SUM(\\"num_rows\\") AS num_rows,
                                            CASE WHEN \\"status\\" = 'RUNNING' THEN
                                            (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                            ELSE 1 END AS \\"rank\\"
                                          FROM sys.segments
                                          WHERE \\"size\\" = '12'
                                          GROUP BY 1,2
                                          ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                            `);
  });
});

describe('test how remove effect groupby', () => {
  it('renders remove first of 2 columns', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('datasource')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                    "SELECT
                                      COUNT(*) AS num_segments,
                                      SUM(is_available) AS num_available_segments,
                                      SUM(\\"size\\") AS size,
                                      SUM(\\"num_rows\\") AS num_rows,
                                      CASE WHEN \\"status\\" = 'RUNNING' THEN
                                      (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                      ELSE 1 END AS \\"rank\\"
                                    FROM sys.segments
                                    WHERE \\"size\\" = '12'
                                    GROUP BY 1
                                    ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                        `);
  });

  it('renders remove second of 2 columns', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1,2
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('num_segments')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                              "SELECT
                                datasource,
                                SUM(is_available) AS num_available_segments,
                                SUM(\\"size\\") AS size,
                                SUM(\\"num_rows\\") AS num_rows,
                                CASE WHEN \\"status\\" = 'RUNNING' THEN
                                (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                                ELSE 1 END AS \\"rank\\"
                              FROM sys.segments
                              WHERE \\"size\\" = '12'
                              GROUP BY 1
                              ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                    `);
  });

  it('renders remove first of 2 named columns', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY datasource,num_segments
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('datasource')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                        "SELECT
                          COUNT(*) AS num_segments,
                          SUM(is_available) AS num_available_segments,
                          SUM(\\"size\\") AS size,
                          SUM(\\"num_rows\\") AS num_rows,
                          CASE WHEN \\"status\\" = 'RUNNING' THEN
                          (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                          ELSE 1 END AS \\"rank\\"
                        FROM sys.segments
                        WHERE \\"size\\" = '12'
                        GROUP BY num_segments
                        ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                `);
  });

  it('renders remove second of 2 named columns', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY datasource,num_segments
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('num_segments')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                        "SELECT
                          datasource,
                          SUM(is_available) AS num_available_segments,
                          SUM(\\"size\\") AS size,
                          SUM(\\"num_rows\\") AS num_rows,
                          CASE WHEN \\"status\\" = 'RUNNING' THEN
                          (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                          ELSE 1 END AS \\"rank\\"
                        FROM sys.segments
                        WHERE \\"size\\" = '12'
                        GROUP BY datasource
                        ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
                `);
  });

  it('renders remove second of 1 of 1 columns', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY datasource
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('datasource')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                  "SELECT
                    COUNT(*) AS num_segments,
                    SUM(is_available) AS num_available_segments,
                    SUM(\\"size\\") AS size,
                    SUM(\\"num_rows\\") AS num_rows,
                    CASE WHEN \\"status\\" = 'RUNNING' THEN
                    (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                    ELSE 1 END AS \\"rank\\"
                  FROM sys.segments
                  WHERE \\"size\\" = '12'
                  ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
            `);
  });

  it('renders remove second of 1 of 1 columns by index', () => {
    const tree = parser(`SELECT
  datasource,
  COUNT(*) AS num_segments,
  SUM(is_available) AS num_available_segments,
  SUM("size") AS size,
  SUM("num_rows") AS num_rows,
  CASE WHEN "status" = 'RUNNING' THEN
  (CASE WHEN "runner_status" = 'RUNNING' THEN 4 WHEN "runner_status" = 'PENDING' THEN 3 ELSE 2 END)
  ELSE 1 END AS "rank"
FROM sys.segments
WHERE "size" = '12'
GROUP BY 1
ORDER BY "rank" DESC, "created_time" DESC`)
      .excludeColumn('datasource')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                  "SELECT
                    COUNT(*) AS num_segments,
                    SUM(is_available) AS num_available_segments,
                    SUM(\\"size\\") AS size,
                    SUM(\\"num_rows\\") AS num_rows,
                    CASE WHEN \\"status\\" = 'RUNNING' THEN
                    (CASE WHEN \\"runner_status\\" = 'RUNNING' THEN 4 WHEN \\"runner_status\\" = 'PENDING' THEN 3 ELSE 2 END)
                    ELSE 1 END AS \\"rank\\"
                  FROM sys.segments
                  WHERE \\"size\\" = '12'
                  ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
            `);
  });
});
