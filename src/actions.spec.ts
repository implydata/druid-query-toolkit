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
import {
  AdditiveExpression,
  Alias,
  ComparisonExpression,
  ComparisonExpressionRhs,
  FilterClause,
  Interval,
  RefExpression,
  StringType,
  WhereClause,
} from './ast';
import { basicIdentifierEscape, basicLiteralEscape, stringFactory } from './ast/sql-query/helpers';
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
LIMIT 25`)
      .excludeColumn('start')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
            "SELECT \\"segment_id\\", \\"datasource\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
            FROM sys.segments
            LIMIT 25"
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
LIMIT 25`)
      .filterRow('datasource', 'github', '!=')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      WHERE \\"datasource\\" != 'github'
      ORDER BY \\"start\\" DESC
      LIMIT 25"
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
      WHERE \\"datasource\\" != 'rowvalue'
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
      WHERE \\"size\\" = '12' AND \\"datasource\\" != 'rowvalue'
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

  it('test basicIdentifierEscape', () => {
    const tree = basicIdentifierEscape('header');

    expect(tree).toMatchInlineSnapshot(`"\\"header\\""`);
  });

  it('test basicLiteralEscape with string', () => {
    const tree = basicLiteralEscape('row');

    expect(tree).toMatchInlineSnapshot(`"'row'"`);
  });

  it('test basicLiteralEscape with number', () => {
    const tree = basicLiteralEscape(1);

    expect(tree).toMatchInlineSnapshot(`"1"`);
  });

  it('renders filter row with number', () => {
    const tree = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`)
      .filterRow('datasource', 1, '!=')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      WHERE \\"datasource\\" != 1
      ORDER BY \\"start\\" DESC
      LIMIT 25"
    `);
  });

  it('renders filter row with number', () => {
    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .excludeColumn('Count')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
            "SELECT
              \\"cityName\\",
              SUM(added) AS \\"Added\\"
            FROM \\"wikiticker\\"
            WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
            GROUP BY 1"
        `);
  });

  it('renders filter aggregate row', () => {
    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow('Count', 'value', '!=')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
            "SELECT
              \\"cityName\\",
              COUNT(*) AS \\"Count\\",
              SUM(added) AS \\"Added\\"
            FROM \\"wikiticker\\"
            WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
            GROUP BY 1
            HAVING \\"Count\\"!='value'
            ORDER BY \\"Count\\" DESC"
        `);
  });

  it('renders filter aggregate row', () => {
    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow('Count', 'value', '!=')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                                                                                                                        "SELECT
                                                                                                                                                                          \\"cityName\\",
                                                                                                                                                                          COUNT(*) AS \\"Count\\",
                                                                                                                                                                          SUM(added) AS \\"Added\\"
                                                                                                                                                                        FROM \\"wikiticker\\"
                                                                                                                                                                        WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
                                                                                                                                                                        GROUP BY 1
                                                                                                                                                                        HAVING \\"Count\\"!='value'
                                                                                                                                                                        ORDER BY \\"Count\\" DESC"
                                                                                                                `);
  });

  it('renders  add to group by ', () => {
    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .addToGroupBy('testValue')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                                                                        "SELECT
                                                                                                                          \\"testValue\\", \\"cityName\\",
                                                                                                                          COUNT(*) AS \\"Count\\",
                                                                                                                          SUM(added) AS \\"Added\\"
                                                                                                                        FROM \\"wikiticker\\"
                                                                                                                        WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
                                                                                                                        GROUP BY 1,2
                                                                                                                        ORDER BY \\"Count\\" DESC"
                                                                                `);
  });

  it('renders add to group by for a second time ', () => {
    const tree = parser(`SELECT
    "somevalue",
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1,2
ORDER BY "Count" DESC`)
      .addToGroupBy('testValue')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                                                                  "SELECT
                                                                                                                      \\"testValue\\", \\"somevalue\\",
                                                                                                                    \\"cityName\\",
                                                                                                                    COUNT(*) AS \\"Count\\",
                                                                                                                    SUM(added) AS \\"Added\\"
                                                                                                                  FROM \\"wikiticker\\"
                                                                                                                  WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
                                                                                                                  GROUP BY 1,2,3
                                                                                                                  ORDER BY \\"Count\\" DESC"
                                                                            `);
  });

  it('renders  add to group by out of order', () => {
    const tree = parser(`SELECT
  COUNT(*) AS "Count",
    "cityName",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 2
ORDER BY "Count" DESC`)
      .addToGroupBy('testValue')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                                                                        "SELECT
                                                                                                                          \\"testValue\\", COUNT(*) AS \\"Count\\",
                                                                                                                            \\"cityName\\",
                                                                                                                          SUM(added) AS \\"Added\\"
                                                                                                                        FROM \\"wikiticker\\"
                                                                                                                        WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
                                                                                                                        GROUP BY 1,3
                                                                                                                        ORDER BY \\"Count\\" DESC"
                                                                                `);
  });

  it('renders  add to group by out of no groupby, Should not change', () => {
    const tree = parser(`SELECT
  COUNT(*) AS "Count",
    "cityName",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
ORDER BY "Count" DESC`)
      .addToGroupBy('testValue')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                                                                                    "SELECT
                                                                                                                                      COUNT(*) AS \\"Count\\",
                                                                                                                                        \\"cityName\\",
                                                                                                                                      SUM(added) AS \\"Added\\"
                                                                                                                                    FROM \\"wikiticker\\"
                                                                                                                                    WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
                                                                                                                                    ORDER BY \\"Count\\" DESC"
                                                                                        `);
  });

  it('renders  add aggregate column', () => {
    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .addAggregateColumn('testValue', 'SUM')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                                                            "SELECT
                                                                                                              \\"cityName\\",
                                                                                                              COUNT(*) AS \\"Count\\",
                                                                                                              SUM(added) AS \\"Added\\", SUM(\\"testValue\\")
                                                                                                            FROM \\"wikiticker\\"
                                                                                                            WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
                                                                                                            GROUP BY 1
                                                                                                            ORDER BY \\"Count\\" DESC"
                                                                        `);
  });

  it('renders  add function to Groupby', () => {
    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .addFunctionToGroupBy('TRUNCATE', ['', '', ' '], ['added', 1])
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                                          "SELECT
                                                                                            TRUNCATE(added, 1), \\"cityName\\",
                                                                                            COUNT(*) AS \\"Count\\",
                                                                                            SUM(added) AS \\"Added\\"
                                                                                          FROM \\"wikiticker\\"
                                                                                          WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
                                                                                          GROUP BY 1,2
                                                                                          ORDER BY \\"Count\\" DESC"
                                                            `);
  });

  it('renders filter by additive ex', () => {
    const interval = new Interval({
      intervalKeyword: 'INTERVAL',
      unitKeyword: 'HOUR',
      spacing: [' ', ' '],
      ex: new StringType({
        spacing: [],
        chars: '1',
        quote: `'`,
      }),
    });
    const refEx = new RefExpression({
      quoteSpacing: [],
      quote: '',
      namespace: '',
      name: 'CURRENT_TIMESTAMP',
    });
    const additiveExpression = new AdditiveExpression({
      parens: [],
      op: ['-'],
      ex: [refEx, interval],
      spacing: [' ', ' '],
    });

    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow(additiveExpression, 'columnName', '>=')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
            "SELECT
              \\"cityName\\",
              COUNT(*) AS \\"Count\\",
              SUM(added) AS \\"Added\\"
            FROM \\"wikiticker\\"
            WHERE \\"CURRENT_TIMESTAMP - INTERVAL '1' HOUR\\" >= 'columnName'
            GROUP BY 1
            ORDER BY \\"Count\\" DESC"
        `);
  });
  it('renders filter by additive ex', () => {
    const tree = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
GROUP BY 1
ORDER BY "Count" DESC`)
      .addAggregateColumn(
        'columnName',
        'MIN',
        new Alias({
          keyword: 'AS',
          spacing: [' '],
          value: new StringType({
            spacing: [],
            chars: 'min___time',
            quote: `"`,
          }),
        }),
      )
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                                  "SELECT
                                                                    \\"cityName\\",
                                                                    COUNT(*) AS \\"Count\\",
                                                                    SUM(added) AS \\"Added\\", MIN(\\"columnName\\") AS \\"min___time\\"
                                                                  FROM \\"wikiticker\\"
                                                                  GROUP BY 1
                                                                  ORDER BY \\"Count\\" DESC"
                                            `);
  });
  it('renders filter by additive ex', () => {
    const tree = parser(`SELECT
    "cityName",
    COUNT(*) AS "Count",
    SUM(added) AS "Added"
  FROM "wikiticker"
  GROUP BY 1
  ORDER BY "Count" DESC`)
      .addAggregateColumn(
        'columnName',
        'MIN',
        new Alias({
          keyword: 'AS',
          spacing: [' '],
          value: new StringType({
            spacing: [],
            chars: 'min___time',
            quote: `"`,
          }),
        }),
        true,
      )
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                                                "SELECT
                                                    \\"cityName\\",
                                                    COUNT(*) AS \\"Count\\",
                                                    SUM(added) AS \\"Added\\", MIN(DISTINCT \\"columnName\\") AS \\"min___time\\"
                                                  FROM \\"wikiticker\\"
                                                  GROUP BY 1
                                                  ORDER BY \\"Count\\" DESC"
                                `);
  });
  it('renders filter by additive ex', () => {
    const tree = parser(`SELECT
    "cityName",
    COUNT(*) AS "Count",
    SUM(added) AS "Added"
  FROM "wikiticker"
  GROUP BY 1
  ORDER BY "Count" DESC`)
      .addAggregateColumn(
        '*',
        'COUNT',
        false,
        undefined,
        new FilterClause({
          keyword: 'FILTER',
          spacing: [' '],
          ex: new WhereClause({
            keyword: 'WHERE',
            spacing: [' '],
            filter: new ComparisonExpression({
              parens: [],
              spacing: [' '],
              ex: stringFactory('test', '"'),
              rhs: new ComparisonExpressionRhs({
                parens: [],
                op: '=',
                rhs: stringFactory('xxx', `'`),
                spacing: [' '],
              }),
            }),
          }),
        }),
      )
      .toString();

    expect(tree).toMatchInlineSnapshot(`
                  "SELECT
                      \\"cityName\\",
                      COUNT(*) AS \\"Count\\",
                      SUM(added) AS \\"Added\\", COUNT(\\"*\\") FILTER (WHERE \\"test\\" = 'xxx')
                    FROM \\"wikiticker\\"
                    GROUP BY 1
                    ORDER BY \\"Count\\" DESC"
            `);
  });
});
