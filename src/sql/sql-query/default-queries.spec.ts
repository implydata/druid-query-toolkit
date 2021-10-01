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

import { backAndForth, sane } from '../../test-utils';

describe('Druid Query Tests', () => {
  it('parses the default data sources query', () => {
    const sql = sane`
      SELECT
        datasource,
        COUNT(*) AS num_segments,
        SUM(is_available) AS num_available_segments,
        SUM("size") AS size,
        SUM("num_rows") AS num_rows
      FROM sys.segments
      GROUP BY 1
    `;

    backAndForth(sql);
  });

  it('parses segments query', () => {
    const sql = sane`
      SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed"
      FROM sys.segments
      ORDER BY "start" DESC
      LIMIT 50
    `;

    backAndForth(sql);
  });

  it('parses task query', () => {
    const sql = sane`
      SELECT
        "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",
        CASE WHEN "status" = 'RUNNING' THEN "runner_status" ELSE "status" END AS "status",
        (
          CASE WHEN "status" = 'RUNNING' THEN
           (CASE "runner_status" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)
          ELSE 1
          END
        ) AS "rank"
      FROM sys.tasks
      ORDER BY "rank" DESC, "created_time" DESC
    `;

    backAndForth(sql);
  });

  it('parses servers query', () => {
    const sql = sane`
      SELECT
        "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",
        (
          CASE "server_type"
          WHEN 'coordinator' THEN 7
          WHEN 'overlord' THEN 6
          WHEN 'router' THEN 5
          WHEN 'broker' THEN 4
          WHEN 'historical' THEN 3
          WHEN 'middle_manager' THEN 2
          WHEN 'peon' THEN 1
          ELSE 0
          END
        ) AS "rank"
      FROM sys.servers
      ORDER BY "rank" DESC, "server" DESC
    `;

    backAndForth(sql);
  });

  it('parses the default data sources query to string', () => {
    const sql = sane`
      SELECT
        datasource,
        COUNT(*) FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_segments,
        COUNT(*) FILTER (WHERE is_available = 1 AND ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_available_segments,
        COUNT(*) FILTER (WHERE is_published = 1 AND is_overshadowed = 0 AND is_available = 0) AS num_segments_to_load,
        COUNT(*) FILTER (WHERE is_available = 1 AND NOT ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_segments_to_drop,
        SUM("size") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS size,
        SUM("size" * "num_replicas") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS replicated_size,
        SUM("num_rows") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_rows
      FROM sys.segments
      GROUP BY 1
    `;

    backAndForth(sql);
  });

  it('parses segments query', () => {
    const sql = sane`
      SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed"
      FROM sys.segments
      ORDER BY "start" DESC
      LIMIT 50
    `;

    backAndForth(sql);
  });

  it('parses task query to string', () => {
    const sql = sane`
      SELECT
        "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",
        CASE WHEN "status" = 'RUNNING' THEN "runner_status" ELSE "status" END AS "status",
        (
          CASE WHEN "status" = 'RUNNING' THEN
           (CASE "runner_status" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)
          ELSE 1
          END
        ) AS "rank"
      FROM sys.tasks
      ORDER BY "rank" DESC, "created_time" DESC
    `;

    backAndForth(sql);
  });

  it('parses servers query to string', () => {
    const sql = sane`
      SELECT
        "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",
        (
          CASE "server_type"
          WHEN 'coordinator' THEN 7
          WHEN 'overlord' THEN 6
          WHEN 'router' THEN 5
          WHEN 'broker' THEN 4
          WHEN 'historical' THEN 3
          WHEN 'middle_manager' THEN 2
          WHEN 'peon' THEN 1
          ELSE 0
          END
        ) AS "rank"
      FROM sys.servers
      ORDER BY "rank" DESC, "server" DESC
    `;

    backAndForth(sql);
  });

  it('parses servers query with columns in brackets to string', () => {
    const sql = sane`
      SELECT
        ("server"), "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",
        (
          CASE "server_type"
          WHEN 'coordinator' THEN 7
          WHEN 'overlord' THEN 6
          WHEN 'router' THEN 5
          WHEN 'broker' THEN 4
          WHEN 'historical' THEN 3
          WHEN 'middle_manager' THEN 2
          WHEN 'peon' THEN 1
          ELSE 0
          END
        ) AS "rank"
      FROM sys.servers
      ORDER BY "rank" DESC, "server" DESC
    `;

    backAndForth(sql);
  });

  it('parses segments query with concat', () => {
    const sql = sane`
      SELECT
        ("start" || '/' || "end") AS "interval",
        "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed"
      FROM sys.segments
      WHERE
       ("start" || '/' || "end") IN (SELECT "start" || '/' || "end" FROM sys.segments GROUP BY 1 LIMIT 25)
      ORDER BY "start" DESC
      LIMIT 25000
    `;

    backAndForth(sql);
  });

  it('parses segments query with concat', () => {
    const sql = sane`
      SELECT "start" || ' / ' || "end" FROM sys.segments GROUP BY 1,2
    `;

    backAndForth(sql);
  });

  it('parses the default data sources query to string with spaces', () => {
    const sql = sane`
      SELECT
        datasource,
        COUNT(*) FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_segments,
        COUNT(*) FILTER (WHERE is_available = 1 AND ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_available_segments,
        COUNT(*) FILTER (WHERE is_published = 1 AND is_overshadowed = 0 AND is_available = 0) AS num_segments_to_load,
        COUNT(*) FILTER (WHERE is_available = 1 AND NOT ((is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1)) AS num_segments_to_drop,
        SUM("size") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS size,
        SUM("size" * "num_replicas") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS replicated_size,
        SUM("num_rows") FILTER (WHERE (is_published = 1 AND is_overshadowed = 0) OR is_realtime = 1) AS num_rows
      FROM sys.segments
      GROUP BY 1
    `;

    backAndForth(sql);
  });

  it('parses the default data sources query to string with spaces', () => {
    const sql = sane`
      SELECT  "comments",
        COUNT(*) AS "Count", SUM("comments") AS "sum_comments"
      FROM "github"
      WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "commits" > 100
      GROUP BY 1, 2
      ORDER BY "Time" ASC
    `;

    backAndForth(sql);
  });

  it('test WITH clause 1', () => {
    const sql = sane`
      WITH temporaryTable (averageValue) as
      (SELECT avg(Attr1)
      FROM Tbl)
      SELECT Attr1
      FROM Tbl
      WHERE Tbl.Attr1 > temporaryTable.averageValue
    `;

    backAndForth(sql);
  });

  it('test WITH clause 2', () => {
    const sql = sane`
      WITH totalSalary(Airline, total) as
      (SELECT Airline, sum(Salary)
      FROM Pilot
      GROUP BY Airline),
      airlineAverage(avgSalary) as
      (SELECT avg(total)
      FROM totalSalary )
      SELECT Airline
      FROM totalSalary
      WHERE totalSalary.total > airlineAverage.avgSalary
    `;

    backAndForth(sql);
  });

  it('test WITH clause 3', () => {
    const sql = sane`
      WITH totalSalary(Airline, total) as
      (SELECT Airline, sum(Salary)
      FROM Pilot
      GROUP BY Airline),
      airlineAverage(avgSalary) as
      (SELECT avg(total)
      FROM totalSalary )
      SELECT Airline
      FROM totalSalary
      WHERE totalSalary.total > airlineAverage.avgSalary
    `;

    backAndForth(sql);
  });

  it('Test TRIM with BOTH', () => {
    const sql = sane`
      SELECT
        "language",
        TRIM(BOTH 'A' FROM "language") AS "Count"
      FROM "github"
      WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
      GROUP BY 1
      HAVING "Count" != 37392
      ORDER BY "Count" DESC
    `;

    backAndForth(sql);
  });

  it('Test TRIM with LEADING', () => {
    const sql = sane`
      SELECT
        "language",
        TRIM(LEADING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
      FROM "github"
      WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
      GROUP BY 1
      HAVING "Count" != 37392
      ORDER BY "Count" DESC
    `;

    backAndForth(sql);
  });

  it('Test TRIM with TRAILING', () => {
    const sql = sane`
      SELECT
        "language",
        TRIM(TRAILING 'A' FROM "language") AS "Count", COUNT(DISTINCT "language") AS "dist_language", COUNT(*) FILTER (WHERE "language"= 'xxx') AS "language_filtered_count"
      FROM "github"
      WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "language" != 'TypeScript'
      GROUP BY 1
      HAVING "Count" != 37392
      ORDER BY "Count" DESC
    `;

    backAndForth(sql);
  });

  it('IS NOT NULL Where Clause', () => {
    const sql = sane`
      SELECT
        SUM("count") AS "TotalEdits",
        SUM("added") AS "TotalAdded"
      FROM "wikipedia"
      WHERE REGEXP_EXTRACT("cityName", 'San') IS NOT NULL AND REGEXP_EXTRACT("cityName", 'San') <> ''
      GROUP BY ''
    `;

    backAndForth(sql);
  });
});
