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

// import { sqlParserFactory } from './parser/druidsql';

// const parser = sqlParserFactory();

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

/*

describe('Ast action for segments test', () => {
  it('renders remove Column', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`)
      .excludeColumn('start')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      LIMIT 25"
    `);
  });

  it('renders orderBy', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`)
      .orderBy('datasource', 'DESC')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      ORDER BY \\"datasource\\" DESC
      LIMIT 25"
    `);
  });

  it('renders exclude row', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`)
      .filterRow('datasource', 'github', '!=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      WHERE \\"datasource\\" != 'github'
      ORDER BY \\"start\\" DESC
      LIMIT 25"
    `);
  });

  it('renders getSorted', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getSorted();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": true,
          "id": "start",
        },
      ]
    `);
  });

  it('renders getSchema', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getSchema();
    expect(modifiedQuery).toMatchInlineSnapshot(`"sys"`);
  });

  it('renders getTableName', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getTableName();
    expect(modifiedQuery).toMatchInlineSnapshot(`"segments"`);
  });

  it('renders getAggregateColumns', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getAggregateColumns();
    expect(modifiedQuery).toMatchInlineSnapshot(`undefined`);
  });

  it('renders getColumnsArray', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).getColumnsArray();
    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`).toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      ORDER BY \\"start\\" DESC
      LIMIT 25"
    `);
  });
});

describe('Ast for full query action tests', () => {
  it('renders remove Column', () => {
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`"sys"`);
  });

  it('renders getTableName', () => {
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`"segments"`);
  });

  it('renders getAggregateColumns', () => {
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "num_available_segments",
        "size",
        "num_rows",
        "rank",
      ]
    `);
  });

  it('renders getColumnsArray', () => {
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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

describe('Ast for full query including whereClause action tests', () => {
  it('renders remove Column', () => {
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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

  it('renders remove Column', () => {
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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

  it('renders orderBy', () => {
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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

  it('ensures commas are prevalent to separate arguments in a function', () => {
    const modifiedQuery = parser(`select TIME_EXTRACT(__time,'HOUR') AS _hour_of_day, COUNT(1) AS _count
FROM wikipedia 
GROUP BY 1`)
      .orderBy('_hour_of_day', 'DESC')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT TIME_EXTRACT(__time,'HOUR') AS _hour_of_day, COUNT(1) AS _count
      FROM wikipedia 
      GROUP BY 1
      ORDER BY \\"_hour_of_day\\" DESC"
    `);
  });

  it('renders exclude row', () => {
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`"sys"`);
  });

  it('renders getTableName', () => {
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`"segments"`);
  });

  it('renders getAggregateColumns', () => {
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "num_available_segments",
        "size",
        "num_rows",
        "rank",
      ]
    `);
  });

  it('renders getColumnsArray', () => {
    const modifiedQuery = parser(`SELECT
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
    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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

describe('Test how remove effect groupBy', () => {
  it('renders remove first of 2 columns', () => {
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = basicIdentifierEscape('header');

    expect(modifiedQuery).toMatchInlineSnapshot(`"\\"header\\""`);
  });

  it('test basicLiteralEscape with string', () => {
    const modifiedQuery = basicLiteralEscape('row');

    expect(modifiedQuery).toMatchInlineSnapshot(`"'row'"`);
  });

  it('test basicLiteralEscape with number', () => {
    const modifiedQuery = basicLiteralEscape(1);

    expect(modifiedQuery).toMatchInlineSnapshot(`"1"`);
  });

  it('renders filter row with number', () => {
    const modifiedQuery = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`)
      .filterRow('datasource', 1, '!=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      WHERE \\"datasource\\" != 1
      ORDER BY \\"start\\" DESC
      LIMIT 25"
    `);
  });

  it('renders filter row with number', () => {
    const modifiedQuery = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .excludeColumn('Count')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"cityName\\",
        SUM(added) AS \\"Added\\"
      FROM \\"wikiticker\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
      GROUP BY 1"
    `);
  });

  it('renders filter aggregate row', () => {
    const modifiedQuery = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow('Count', 'value', '!=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"cityName\\",
        COUNT(*) AS \\"Count\\",
        SUM(added) AS \\"Added\\"
      FROM \\"wikiticker\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
      GROUP BY 1
      HAVING \\"Count\\" != 'value'
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('renders filter aggregate row', () => {
    const modifiedQuery = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow('Count', 'value', '!=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"cityName\\",
        COUNT(*) AS \\"Count\\",
        SUM(added) AS \\"Added\\"
      FROM \\"wikiticker\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
      GROUP BY 1
      HAVING \\"Count\\" != 'value'
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('renders  add to group by ', () => {
    const modifiedQuery = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .addToGroupBy('testValue')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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

  it('renders add to group by for a column already inside group by clause', () => {
    const modifiedQuery = parser(`SELECT
  "user", "count", COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,2
ORDER BY "Count" DESC`)
      .addToGroupBy('user')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"user\\", \\"user\\", \\"count\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2,3
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('renders  add to group by out of order', () => {
    const modifiedQuery = parser(`SELECT
  COUNT(*) AS "Count",
    "cityName",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 2
ORDER BY "Count" DESC`)
      .addToGroupBy('testValue')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
  COUNT(*) AS "Count",
    "cityName",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
ORDER BY "Count" DESC`)
      .addToGroupBy('testValue')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        COUNT(*) AS \\"Count\\",
          \\"cityName\\",
        SUM(added) AS \\"Added\\"
      FROM \\"wikiticker\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('get current group by columns', () => {
    const groupByColumns = parser(`SELECT
  "countryIsoCode", COUNT(*) AS "Count", "cityName", SUM(sum_added) AS "Added"
FROM "wikipedia"
GROUP BY 1,"cityName"
ORDER BY "Count" DESC`).getGroupByColumns();

    expect(groupByColumns).toMatchInlineSnapshot(`
      Array [
        "countryIsoCode",
        "cityName",
      ]
    `);
  });

  it('remove first column in group by', () => {
    const modifiedQuery = parser(`SELECT
  "page", "count", "user",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,2,3
ORDER BY "Count" DESC`)
      .removeGroupBy('page')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"count\\", \\"user\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove second column in group by', () => {
    const modifiedQuery = parser(`SELECT
  "page", "count", "user",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,2,3
ORDER BY "Count" DESC`)
      .removeGroupBy('count')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"page\\", \\"user\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove third column in group by', () => {
    const modifiedQuery = parser(`SELECT
  "page", "count", "user",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,2,3
ORDER BY "Count" DESC`)
      .removeGroupBy('user')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"page\\", \\"count\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove string column in group by mixed with names and indexes', () => {
    const modifiedQuery = parser(`SELECT
  "page", "count", "user",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,count,3
ORDER BY "Count" DESC`)
      .removeGroupBy('count')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"page\\", \\"user\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove index column in group by mixed with names and indexes', () => {
    const modifiedQuery = parser(`SELECT
  "page", "count", "user",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,count,3
ORDER BY "Count" DESC`)
      .removeGroupBy('user')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"page\\", \\"count\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,count
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove only column in group by', () => {
    const modifiedQuery = parser(`SELECT
  "page",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1
ORDER BY "Count" DESC`)
      .removeGroupBy('page')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove most recent column in group by when it occurs multiple times', () => {
    const modifiedQuery = parser(`SELECT
  "user", "countryIsoCode", "user", COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,2,3
ORDER BY "Count" DESC`)
      .removeGroupBy('user')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"user\\", \\"countryIsoCode\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove most recent column in group by when it occurs multiple times and it is grouped by name', () => {
    const modifiedQuery = parser(`SELECT
  "user", "countryIsoCode", "user", COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,2,user
ORDER BY "Count" DESC`)
      .removeGroupBy('user')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"user\\", \\"countryIsoCode\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove most recent column in group by when it occurs multiple times and it is an index', () => {
    const modifiedQuery = parser(`SELECT
  "user", "countryIsoCode", "user", COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY user,2,3
ORDER BY "Count" DESC`)
      .removeGroupBy('user')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        \\"user\\", \\"countryIsoCode\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY user,2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('remove column in group by mixed with non group by columns', () => {
    const modifiedQuery = parser(`SELECT
  "countryIsoCode", COUNT(*) AS "Count", "cityName", SUM(sum_added) AS "Added"
FROM "wikipedia"
GROUP BY 1,3
ORDER BY "Count" DESC`)
      .removeGroupBy('countryIsoCode')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        COUNT(*) AS \\"Count\\", \\"cityName\\", SUM(sum_added) AS \\"Added\\"
      FROM \\"wikipedia\\"
      GROUP BY 2
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('renders  add aggregate column', () => {
    const modifiedQuery = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .addAggregateColumn('testValue', 'SUM')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Count" DESC`)
      .addFunctionToGroupBy('TRUNCATE', [' ', ' '], ['added', 1])
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
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

    const modifiedQuery = parser(`SELECT
  "cityName",
  COUNT(*) AS "Count",
  SUM(added) AS "Added"
FROM "wikiticker"
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow(additiveExpression, 'columnName', '>=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
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
    const modifiedQuery = parser(`SELECT
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

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
          \\"cityName\\",
          COUNT(*) AS \\"Count\\",
          SUM(added) AS \\"Added\\", COUNT(\\"*\\") FILTER (WHERE \\"test\\" = 'xxx')
        FROM \\"wikiticker\\"
        GROUP BY 1
        ORDER BY \\"Count\\" DESC"
    `);
  });

  it('renders filter by additive ex', () => {
    const modifiedQuery = parser(`SELECT
    "cityName",
    COUNT(*) AS "Count",
    SUM(added) AS "Added"
FROM "wikiticker"
WHERE "CURRENT_TIMESTAMP - INTERVAL '1' HOUR" >= 'columnName'
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow(timestampFactory('2018-08-8'), 'name', '>=')
      .filterRow('name', timestampFactory('2018-08-8'), '>=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
          \\"cityName\\",
          COUNT(*) AS \\"Count\\",
          SUM(added) AS \\"Added\\"
      FROM \\"wikiticker\\"
      WHERE \\"CURRENT_TIMESTAMP - INTERVAL '1' HOUR\\" >= 'columnName' AND TIMESTAMP '2018-08-8' >= 'name' AND \\"name\\" >= TIMESTAMP '2018-08-8'
      GROUP BY 1
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('test applying actions to inner query', () => {
    const modifiedQuery = parser(`
    SELECT * FROM (
    SELECT
    "cityName",
    COUNT(*) AS "Count",
    SUM(added) AS "Added"
FROM "wikiticker"
WHERE "CURRENT_TIMESTAMP - INTERVAL '1' HOUR" >= 'columnName'
GROUP BY 1
ORDER BY "Count" DESC;)`)
      .filterRow(timestampFactory('2018-08-8'), 'name', '>=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "
          SELECT * FROM (
          SELECT
          \\"cityName\\",
          COUNT(*) AS \\"Count\\",
          SUM(added) AS \\"Added\\"
      FROM \\"wikiticker\\"
      WHERE \\"CURRENT_TIMESTAMP - INTERVAL '1' HOUR\\" >= 'columnName' AND TIMESTAMP '2018-08-8' >= 'name'
      GROUP BY 1
      ORDER BY \\"Count\\" DESC;)"
    `);
  });

  it('renders filter by additive ex', () => {
    const modifiedQuery = parser(`SELECT
    "cityName",
    COUNT(*) AS "Count",
    SUM(added) AS "Added"
FROM "wikiticker"
GROUP BY 1
ORDER BY "Count" DESC`)
      .filterRow(timestampFactory('2018-08-8'), 'name', '>=')
      .filterRow('name', timestampFactory('2018-08-8'), '>=')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
          \\"cityName\\",
          COUNT(*) AS \\"Count\\",
          SUM(added) AS \\"Added\\"
      FROM \\"wikiticker\\"
      WHERE TIMESTAMP '2018-08-8' >= 'name' AND \\"name\\" >= TIMESTAMP '2018-08-8'
      GROUP BY 1
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('renders filter by additive ex', () => {
    const modifiedQuery = parser(`SELECT
  SUBSTRING("org", 1, 2), TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "github"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1,2
ORDER BY "Time" ASC`).toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        SUBSTRING(\\"org\\", 1, 2), TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"github\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
      GROUP BY 1,2
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('renders filter by additive ex', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Time" ASC`)
      .addFunctionToGroupBy(
        'SUBSTRING',
        [' ', ' '],
        [stringFactory('test', `"`), 0, 2],
        aliasFactory(`__test-substring`),
      )
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        SUBSTRING(\\"test\\", 0, 2) AS \\"__test-substring\\", TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
      GROUP BY 1,2
      ORDER BY \\"Time\\" ASC"
    `);
  });
});

describe('Test getting current filters and removing specific filters', () => {
  it('get simple current filter', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= 'value'
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
      ]
    `);
  });

  it('get simple current filter with expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
      ]
    `);
  });

  it('get simple current filter with backwards expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE CURRENT_TIMESTAMP - INTERVAL '1' DAY >= "__time" 
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
      ]
    `);
  });

  it('get current filter with multiple simple expressions', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= 'value' AND "__time2" >= 'value2' AND "__time3" >= 'value3' 
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
        "__time2",
        "__time3",
      ]
    `);
  });

  it('get current filter with multiple expressions', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND CURRENT_TIMESTAMP - INTERVAL '1' DAY >= "__time" AND "__time3" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY 
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
        "__time",
        "__time3",
      ]
    `);
  });

  it('remove current filter with single simple expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= 'value' 
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\" 
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove current filter with backwards simple expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "value" >= '__time' 
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\" 
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove current filter with no matching expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "value" >= 'value' 
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      WHERE \\"value\\" >= 'value' 
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove current filter with multiple simple & backwards expressions', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= 'value' AND "__time2" >= 'value2' AND "__time3" >= 'value3' 
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('value2')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      WHERE \\"__time\\" >= 'value' AND \\"__time3\\" >= 'value3' 
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove one of two filters', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= 'value' AND "__time2" >= 'value2'
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('value2')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      WHERE \\"__time\\" >= 'value'
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove time stamp', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE TIMESTAMP '2019-7-1 13:00:00' <= "__time"
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"flow0\\"
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove time stamp', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE "dstaddr_long" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= "__time" AND "__time" < TIMESTAMP '2019-7-1 14:00:00'
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"flow0\\"
      WHERE \\"dstaddr_long\\" > 100
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove whereClause', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE TIMESTAMP '2019-7-1 14:00:00' <= __time AND "__time" < TIMESTAMP '2019-7-1 15:00:00' 
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"flow0\\" 
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('get simple current filter', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE __time >= 'value'
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
      ]
    `);
  });

  it('get simple current filter with expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
      ]
    `);
  });

  it('get simple current filter with backwards expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE CURRENT_TIMESTAMP - INTERVAL '1' DAY >= __time 
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
      ]
    `);
  });

  it('get current filter with multiple simple expressions', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= 'value' AND "__time2" >= 'value2' AND __timeThree >= 'value3' 
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
        "__time2",
        "__timeThree",
      ]
    `);
  });

  it('get current filter with multiple expressions', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND CURRENT_TIMESTAMP - INTERVAL '1' DAY >= __time AND __timeThree >= CURRENT_TIMESTAMP - INTERVAL '1' DAY 
GROUP BY 1
ORDER BY "Time" ASC`).getCurrentFilters();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      Array [
        "__time",
        "__time",
        "__timeThree",
      ]
    `);
  });

  it('remove current filter with single simple expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE __time >= 'value' 
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\" 
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove current filter with backwards simple expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "value" >= __time
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove current filter with no matching expression', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "value" >= 'value'
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();

    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      WHERE \\"value\\" >= 'value'
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove current filter with multiple simple & backwards expressions', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE "__time" >= 'value' AND "__time2" >= 'valueTwo' AND "__time3" >= 'value3'
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('valueTwo')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      WHERE \\"__time\\" >= 'value' AND \\"__time3\\" >= 'value3'
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove one of two filters', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "lineitem"
WHERE __time >= 'value' AND "__time2" >= 'value2'
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('value2')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"lineitem\\"
      WHERE __time >= 'value'
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove time stamp', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE TIMESTAMP '2019-7-1 13:00:00' <= __time
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"flow0\\"
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('remove time stamp', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE "dstaddr_long" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= __time AND __time < TIMESTAMP '2019-7-1 14:00:00'
GROUP BY 1
ORDER BY "Time" ASC`)
      .removeFilter('__time')
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"flow0\\"
      WHERE \\"dstaddr_long\\" > 100
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });
});
describe('Replace from', () => {
  it('replace with no namespace', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE "dstaddr_long" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= __time AND __time < TIMESTAMP '2019-7-1 14:00:00'
GROUP BY 1
ORDER BY "Time" ASC`)
      .replaceFrom(refExpressionFactory('test'))
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM test
      WHERE \\"dstaddr_long\\" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= __time AND __time < TIMESTAMP '2019-7-1 14:00:00'
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('replace with namespace', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE "dstaddr_long" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= __time AND __time < TIMESTAMP '2019-7-1 14:00:00'
GROUP BY 1
ORDER BY "Time" ASC`)
      .replaceFrom(refExpressionFactory('test', 'test'))
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM test.test
      WHERE \\"dstaddr_long\\" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= __time AND __time < TIMESTAMP '2019-7-1 14:00:00'
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('replace with quotes', () => {
    const modifiedQuery = parser(`SELECT
  TIME_FLOOR("__time", 'PT1H') AS "Time",
  COUNT(*) AS "Count"
FROM "flow0"
WHERE "dstaddr_long" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= __time AND __time < TIMESTAMP '2019-7-1 14:00:00'
GROUP BY 1
ORDER BY "Time" ASC`)
      .replaceFrom(refExpressionFactory(stringFactory('test', '"')))
      .toString();
    expect(modifiedQuery).toMatchInlineSnapshot(`
      "SELECT
        TIME_FLOOR(\\"__time\\", 'PT1H') AS \\"Time\\",
        COUNT(*) AS \\"Count\\"
      FROM \\"test\\"
      WHERE \\"dstaddr_long\\" > 100 AND TIMESTAMP '2019-7-1 13:00:00' <= __time AND __time < TIMESTAMP '2019-7-1 14:00:00'
      GROUP BY 1
      ORDER BY \\"Time\\" ASC"
    `);
  });
});

describe('Remove from Having', () => {
  it('Remove column in HAVING', () => {
    expect(
      parser(`SELECT
  "language",
  TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
FROM "github"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
GROUP BY 1
HAVING "Count" != 37392
ORDER BY "Count" DESC`)
        .excludeColumn('Count')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"language\\",
        COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
      FROM \\"github\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"language\\" != 'TypeScript'
      GROUP BY 1"
    `);
  });

  it('Remove column in HAVING, multiple having filters', () => {
    expect(
      parser(`SELECT
  "language",
  TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
FROM "github"
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
GROUP BY 1
HAVING "Count" != 37392 AND "dist_language" != 37392
ORDER BY "Count" DESC`)
        .excludeColumn('Count')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"language\\",
        COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
      FROM \\"github\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"language\\" != 'TypeScript'
      GROUP BY 1
      HAVING \\"dist_language\\" != 37392"
    `);
  });

  it('Remove column in HAVING, OR expression', () => {
    expect(
      parser(`SELECT
  "language",
  TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
FROM "github"
WHERE "Count" != 37392 OR "dist_language" != 37392
GROUP BY 1
HAVING "Count" != 37392 OR "dist_language" != 37392 AND "Count" != 37392 
ORDER BY "Count" DESC`)
        .excludeColumn('Count')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"language\\",
        COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
      FROM \\"github\\"
      WHERE \\"Count\\" != 37392 OR \\"dist_language\\" != 37392
      GROUP BY 1
      HAVING \\"dist_language\\" != 37392"
    `);
  });

  it('Remove column in HAVING, OR expression', () => {
    expect(
      parser(`SELECT
  "language",
  TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
FROM "github"
WHERE "Count" != 37392 OR "dist_language" != 37392
GROUP BY 1
HAVING "github" != 37392 OR "dist_language" != 37392 AND "Count" != 37392 
ORDER BY "Count" DESC`)
        .excludeColumn('Count')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"language\\",
        COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
      FROM \\"github\\"
      WHERE \\"Count\\" != 37392 OR \\"dist_language\\" != 37392
      GROUP BY 1
      HAVING \\"github\\" != 37392 OR \\"dist_language\\" != 37392"
    `);
  });

  it('Remove column in WHERE, OR expression', () => {
    expect(
      parser(`SELECT
  "language",
  TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
FROM "github"
WHERE "Count" != 37392 OR "dist_language" != 37392
GROUP BY 1
HAVING "github" != 37392 OR "dist_language" != 37392 AND "Count" != 37392 
ORDER BY "Count" DESC`)
        .removeFilter('Count')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"language\\",
        TRIM(TRAILING 'A' FROM \\"language\\") AS \\"Count\\", COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
      FROM \\"github\\"
      WHERE \\"dist_language\\" != 37392
      GROUP BY 1
      HAVING \\"github\\" != 37392 OR \\"dist_language\\" != 37392 AND \\"Count\\" != 37392 
      ORDER BY \\"Count\\" DESC"
    `);
  });

  it('Remove column in WHERE, OR expression', () => {
    expect(
      parser(`SELECT
  "language",
  TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
FROM "github"
WHERE "Count" != 37392 OR "dist_language" != 37392 AND "Count" != 37392 
GROUP BY 1
HAVING "github" != 37392 OR "dist_language" != 37392 AND "Count" != 37392 
ORDER BY "Count" DESC`)
        .removeFilter('dist_language')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"language\\",
        TRIM(TRAILING 'A' FROM \\"language\\") AS \\"Count\\", COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
      FROM \\"github\\"
      WHERE \\"Count\\" != 37392 OR \\"Count\\" != 37392 
      GROUP BY 1
      HAVING \\"github\\" != 37392 OR \\"dist_language\\" != 37392 AND \\"Count\\" != 37392 
      ORDER BY \\"Count\\" DESC"
    `);
  });
});
*/
