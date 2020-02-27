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

import { sqlParserFactory } from '../..';
import { FUNCTIONS } from '../../test-utils';

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

describe('Druid Query Tests', () => {
  it('parsers the default data sources query', () => {
    expect(
      parser(
        'SELECT\n' +
          '  datasource,\n' +
          '  COUNT(*) AS num_segments,\n' +
          '  SUM(is_available) AS num_available_segments,\n' +
          '  SUM("size") AS size,\n' +
          '  SUM("num_rows") AS num_rows\n' +
          'FROM sys.segments\n' +
          'GROUP BY 1',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        datasource,
        COUNT(*) AS num_segments,
        SUM(is_available) AS num_available_segments,
        SUM(\\"size\\") AS size,
        SUM(\\"num_rows\\") AS num_rows
      FROM sys.segments
      GROUP BY 1"
    `);
  });

  it('parsers segments query', () => {
    expect(
      parser(
        'SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
          'FROM sys.segments\n' +
          'ORDER BY "start" DESC\n' +
          'LIMIT 50',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      ORDER BY \\"start\\" DESC
      LIMIT 50"
    `);
  });

  it('parsers task query', () => {
    expect(
      parser(
        'SELECT\n' +
          '  "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",\n' +
          '  CASE WHEN "status" = \'RUNNING\' THEN "runner_status" ELSE "status" END AS "status",\n' +
          '  (\n' +
          '    CASE WHEN "status" = \'RUNNING\' THEN\n' +
          "     (CASE \"runner_status\" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)\n" +
          '    ELSE 1\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.tasks\n' +
          'ORDER BY "rank" DESC, "created_time" DESC',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"task_id\\", \\"type\\", \\"datasource\\", \\"created_time\\", \\"location\\", \\"duration\\", \\"error_msg\\",
        CASE WHEN \\"status\\" = 'RUNNING' THEN \\"runner_status\\" ELSE \\"status\\" END AS \\"status\\",
        (
          CASE WHEN \\"status\\" = 'RUNNING' THEN
           (CASE \\"runner_status\\" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)
          ELSE 1
          END
        ) AS \\"rank\\"
      FROM sys.tasks
      ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
    `);
  });

  it('parsers servers query', () => {
    expect(
      parser(
        'SELECT\n' +
          '  "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",\n' +
          '  (\n' +
          '    CASE "server_type"\n' +
          "    WHEN 'coordinator' THEN 7\n" +
          "    WHEN 'overlord' THEN 6\n" +
          "    WHEN 'router' THEN 5\n" +
          "    WHEN 'broker' THEN 4\n" +
          "    WHEN 'historical' THEN 3\n" +
          "    WHEN 'middle_manager' THEN 2\n" +
          "    WHEN 'peon' THEN 1\n" +
          '    ELSE 0\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.servers\n' +
          'ORDER BY "rank" DESC, "server" DESC',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"server\\", \\"server_type\\", \\"tier\\", \\"host\\", \\"plaintext_port\\", \\"tls_port\\", \\"curr_size\\", \\"max_size\\",
        (
          CASE \\"server_type\\"
          WHEN 'coordinator' THEN 7
          WHEN 'overlord' THEN 6
          WHEN 'router' THEN 5
          WHEN 'broker' THEN 4
          WHEN 'historical' THEN 3
          WHEN 'middle_manager' THEN 2
          WHEN 'peon' THEN 1
          ELSE 0
          END
        ) AS \\"rank\\"
      FROM sys.servers
      ORDER BY \\"rank\\" DESC, \\"server\\" DESC"
    `);
  });
});

describe('Druid Query Tests', () => {
  it('parsers the default data sources query to string', () => {
    expect(
      parser(
        'SELECT\n' +
          '  datasource,\n' +
          '  COUNT(*) FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_segments,\n' +
          '  COUNT(*) FILTER (WHERE is_available = 1 AND ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_available_segments,\n' +
          '  COUNT(*) FILTER (WHERE is_published = 1 AND is_overshadowed = 0 AND is_available = 0) AS num_segments_to_load,\n' +
          '  COUNT(*) FILTER (WHERE is_available = 1 AND NOT ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_segments_to_drop,\n' +
          '  SUM("size") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS size,\n' +
          '  SUM("size" * "num_replicas") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS replicated_size,\n' +
          '  SUM("num_rows") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_rows\n' +
          'FROM sys.segments\n' +
          'GROUP BY 1',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        datasource,
        COUNT(*) FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_segments,
        COUNT(*) FILTER (WHERE is_available = 1 AND ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_available_segments,
        COUNT(*) FILTER (WHERE is_published = 1 AND is_overshadowed = 0 AND is_available = 0) AS num_segments_to_load,
        COUNT(*) FILTER (WHERE is_available = 1 AND NOT ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_segments_to_drop,
        SUM(\\"size\\") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS size,
        SUM(\\"size\\" * \\"num_replicas\\") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS replicated_size,
        SUM(\\"num_rows\\") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_rows
      FROM sys.segments
      GROUP BY 1"
    `);
  });

  it('parsers segments query to string', () => {
    expect(
      parser(
        'SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
          'FROM sys.segments\n' +
          'ORDER BY "start" DESC\n' +
          'LIMIT 50',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT \\"segment_id\\", \\"datasource\\", \\"start\\", \\"end\\", \\"size\\", \\"version\\", \\"partition_num\\", \\"num_replicas\\", \\"num_rows\\", \\"is_published\\", \\"is_available\\", \\"is_realtime\\", \\"is_overshadowed\\", \\"payload\\"
      FROM sys.segments
      ORDER BY \\"start\\" DESC
      LIMIT 50"
    `);
  });

  it('parsers task query to string', () => {
    expect(
      parser(
        'SELECT\n' +
          '  "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",\n' +
          '  CASE WHEN "status" = \'RUNNING\' THEN "runner_status" ELSE "status" END AS "status",\n' +
          '  (\n' +
          '    CASE WHEN "status" = \'RUNNING\' THEN\n' +
          "     (CASE \"runner_status\" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)\n" +
          '    ELSE 1\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.tasks\n' +
          'ORDER BY "rank" DESC, "created_time" DESC',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"task_id\\", \\"type\\", \\"datasource\\", \\"created_time\\", \\"location\\", \\"duration\\", \\"error_msg\\",
        CASE WHEN \\"status\\" = 'RUNNING' THEN \\"runner_status\\" ELSE \\"status\\" END AS \\"status\\",
        (
          CASE WHEN \\"status\\" = 'RUNNING' THEN
           (CASE \\"runner_status\\" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)
          ELSE 1
          END
        ) AS \\"rank\\"
      FROM sys.tasks
      ORDER BY \\"rank\\" DESC, \\"created_time\\" DESC"
    `);
  });

  it('parsers servers query to string', () => {
    expect(
      parser(
        'SELECT\n' +
          '  "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",\n' +
          '  (\n' +
          '    CASE "server_type"\n' +
          "    WHEN 'coordinator' THEN 7\n" +
          "    WHEN 'overlord' THEN 6\n" +
          "    WHEN 'router' THEN 5\n" +
          "    WHEN 'broker' THEN 4\n" +
          "    WHEN 'historical' THEN 3\n" +
          "    WHEN 'middle_manager' THEN 2\n" +
          "    WHEN 'peon' THEN 1\n" +
          '    ELSE 0\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.servers\n' +
          'ORDER BY "rank" DESC, "server" DESC',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        \\"server\\", \\"server_type\\", \\"tier\\", \\"host\\", \\"plaintext_port\\", \\"tls_port\\", \\"curr_size\\", \\"max_size\\",
        (
          CASE \\"server_type\\"
          WHEN 'coordinator' THEN 7
          WHEN 'overlord' THEN 6
          WHEN 'router' THEN 5
          WHEN 'broker' THEN 4
          WHEN 'historical' THEN 3
          WHEN 'middle_manager' THEN 2
          WHEN 'peon' THEN 1
          ELSE 0
          END
        ) AS \\"rank\\"
      FROM sys.servers
      ORDER BY \\"rank\\" DESC, \\"server\\" DESC"
    `);
  });

  it('parsers servers query with columns in brackets to string', () => {
    expect(
      parser(
        'SELECT\n' +
          '  ("server"), "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",\n' +
          '  (\n' +
          '    CASE "server_type"\n' +
          "    WHEN 'coordinator' THEN 7\n" +
          "    WHEN 'overlord' THEN 6\n" +
          "    WHEN 'router' THEN 5\n" +
          "    WHEN 'broker' THEN 4\n" +
          "    WHEN 'historical' THEN 3\n" +
          "    WHEN 'middle_manager' THEN 2\n" +
          "    WHEN 'peon' THEN 1\n" +
          '    ELSE 0\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.servers\n' +
          'ORDER BY "rank" DESC, "server" DESC',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        (server), \\"server_type\\", \\"tier\\", \\"host\\", \\"plaintext_port\\", \\"tls_port\\", \\"curr_size\\", \\"max_size\\",
        (
          CASE \\"server_type\\"
          WHEN 'coordinator' THEN 7
          WHEN 'overlord' THEN 6
          WHEN 'router' THEN 5
          WHEN 'broker' THEN 4
          WHEN 'historical' THEN 3
          WHEN 'middle_manager' THEN 2
          WHEN 'peon' THEN 1
          ELSE 0
          END
        ) AS \\"rank\\"
      FROM sys.servers
      ORDER BY \\"rank\\" DESC, \\"server\\" DESC"
    `);
  });

  it('parsers segments query with concat', () => {
    expect(
      parser(
        'SELECT\n' +
          '  ("start" || \'/\' || "end") AS "interval",\n' +
          '  "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
          'FROM sys.segments\n' +
          'WHERE\n' +
          ' ("start" || \'/\' || "end") IN (SELECT "start" || \'/\' || "end" FROM sys.segments GROUP BY 1 LIMIT 25)\n' +
          'ORDER BY "start" DESC\n' +
          'LIMIT 25000',
      ).toString(),
    ).toMatchSnapshot();
  });

  it('parsers segments query with concat', () => {
    expect(
      parser(`SELECT "start" || ' / ' || "end" FROM sys.segments GROUP BY 1,2`).toString(),
    ).toMatchSnapshot();
  });

  it('parsers the default data sources query to string with spaces', () => {
    expect(
      parser(
        'SELECT\n' +
          '  datasource,\n' +
          '  COUNT(*) FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_segments,\n' +
          '  COUNT(*) FILTER (WHERE is_available = 1 AND ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_available_segments,\n' +
          '  COUNT(*) FILTER (WHERE is_published = 1 AND is_overshadowed = 0 AND is_available = 0) AS num_segments_to_load,\n' +
          '  COUNT(*) FILTER (WHERE is_available = 1 AND NOT ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_segments_to_drop,\n' +
          '  SUM("size") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS size,\n' +
          '  SUM("size" * "num_replicas") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS replicated_size,\n' +
          '  SUM("num_rows") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_rows\n' +
          'FROM sys.segments\n' +
          'GROUP BY 1',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
        datasource,
        COUNT(*) FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_segments,
        COUNT(*) FILTER (WHERE is_available = 1 AND ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_available_segments,
        COUNT(*) FILTER (WHERE is_published = 1 AND is_overshadowed = 0 AND is_available = 0) AS num_segments_to_load,
        COUNT(*) FILTER (WHERE is_available = 1 AND NOT ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_segments_to_drop,
        SUM(\\"size\\") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS size,
        SUM(\\"size\\" * \\"num_replicas\\") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS replicated_size,
        SUM(\\"num_rows\\") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_rows
      FROM sys.segments
      GROUP BY 1"
    `);
  });

  it('parsers the default data sources query to string with spaces', () => {
    expect(
      parser(
        `SELECT` +
          '  "comments",\n' +
          '  COUNT(*) AS "Count", SUM("comments") AS "sum_comments"\n' +
          'FROM "github"\n' +
          'WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL \'1\' DAY AND "commits" > 100\n' +
          'GROUP BY 1, 2\n' +
          'ORDER BY "Time" ASC',
      ).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT  \\"comments\\",
        COUNT(*) AS \\"Count\\", SUM(\\"comments\\") AS \\"sum_comments\\"
      FROM \\"github\\"
      WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"commits\\" > 100
      GROUP BY 1, 2
      ORDER BY \\"Time\\" ASC"
    `);
  });

  it('test with clause', () => {
    expect(
      parser(
        `WITH temporaryTable (averageValue) as
      (SELECT avg(Attr1)
      FROM Table)
      SELECT Attr1
      FROM Table
      WHERE Table.Attr1 > temporaryTable.averageValue`,
      ).toString(),
    ).toMatchInlineSnapshot(`
      "WITH temporaryTable (averageValue) as
            (SELECT avg(Attr1)
            FROM Table)
            SELECT Attr1
            FROM Table
            WHERE Table.Attr1 > temporaryTable.averageValue"
    `);
  });

  it('test with clause', () => {
    expect(
      parser(
        `WITH totalSalary(Airline, total) as
      (SELECT Airline, sum(Salary)
      FROM Pilot
      GROUP BY Airline),
      airlineAverage(avgSalary) as
      (SELECT avg(total)
      FROM totalSalary )
      SELECT Airline
      FROM totalSalary
      WHERE totalSalary.total > airlineAverage.avgSalary;`,
      ).toString(),
    ).toMatchInlineSnapshot(`
      "WITH totalSalary(Airline) as
            (SELECT Airline, sum(Salary)
            FROM Pilot
            GROUP BY Airline),
            airlineAverage(avgSalary) as
            (SELECT avg(total)
            FROM totalSalary )
            SELECT Airline
            FROM totalSalary
            WHERE totalSalary.total > airlineAverage.avgSalary;"
    `);
  });

  it('test with clause', () => {
    expect(
      parser(
        `WITH totalSalary(Airline, total) as
      (SELECT Airline, sum(Salary)
      FROM Pilot
      GROUP BY Airline),
      airlineAverage(avgSalary) as
      (SELECT avg(total)
      FROM totalSalary )
      SELECT Airline
      FROM totalSalary
      WHERE totalSalary.total > airlineAverage.avgSalary;`,
      ).toString(),
    ).toMatchInlineSnapshot(`
      "WITH totalSalary(Airline) as
            (SELECT Airline, sum(Salary)
            FROM Pilot
            GROUP BY Airline),
            airlineAverage(avgSalary) as
            (SELECT avg(total)
            FROM totalSalary )
            SELECT Airline
            FROM totalSalary
            WHERE totalSalary.total > airlineAverage.avgSalary;"
    `);
  });
});

describe('Special function tests', () => {
  it('Test TRIM with BOTH', () => {
    expect(
      parser(`SELECT
    "language",
    TRIM(BOTH 'A' FROM "language") AS "Count"
  FROM "github"
  WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
  GROUP BY 1
  HAVING "Count" != 37392
  ORDER BY "Count" DESC`).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
          \\"language\\",
          TRIM(BOTH 'A' FROM \\"language\\") AS \\"Count\\"
        FROM \\"github\\"
        WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"language\\" != 'TypeScript'
        GROUP BY 1
        HAVING \\"Count\\" != 37392
        ORDER BY \\"Count\\" DESC"
    `);
  });

  it('Test TRIM with LEADING', () => {
    expect(
      parser(`SELECT
    "language",
    TRIM(LEADING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
  FROM "github"
  WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
  GROUP BY 1
  HAVING "Count" != 37392
  ORDER BY "Count" DESC`).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
          \\"language\\",
          TRIM(LEADING 'A' FROM \\"language\\") AS \\"Count\\", COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
        FROM \\"github\\"
        WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"language\\" != 'TypeScript'
        GROUP BY 1
        HAVING \\"Count\\" != 37392
        ORDER BY \\"Count\\" DESC"
    `);
  });

  it('Test TRIM with TRAILING', () => {
    expect(
      parser(`SELECT
    "language",
    TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
  FROM "github"
  WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
  GROUP BY 1
  HAVING "Count" != 37392
  ORDER BY "Count" DESC`).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT
          \\"language\\",
          TRIM(TRAILING 'A' FROM \\"language\\") AS \\"Count\\", COUNT(DISTINCT \\"language\\") AS \\"dist_language\\", COUNT(*) FILTER (WHERE \\"language\\"= 'xxx') AS \\"language_filtered_count\\"
        FROM \\"github\\"
        WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"language\\" != 'TypeScript'
        GROUP BY 1
        HAVING \\"Count\\" != 37392
        ORDER BY \\"Count\\" DESC"
    `);
  });
});
