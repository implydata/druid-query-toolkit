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

describe.skip('Druid test queries', () => {
  const queries = [
    sane`
      SELECT REGEXP_EXTRACT('foo', '^(.)')
    `,
    sane`
      SELECT 1 + 1, dim1 FROM foo LIMIT 1
    `,
    sane`
      SELECT dim2, AVG(m2) FROM (SELECT * FROM foo AS t1 INNER JOIN foo AS t2 ON t1.m1 = t2.m1 LIMIT 10) AS t3 GROUP BY dim2
    `,
    sane`
      SELECT dim2, AVG(m2) FROM (SELECT * FROM foo AS t1 INNER JOIN foo AS t2 ON t1.m1 = t2.m1) AS t3 GROUP BY dim2
    `,
    sane`
      SELECT t1.dim2, AVG(t1.m2) FROM (SELECT * FROM foo LIMIT 10) AS t1 INNER JOIN foo AS t2 ON t1.m1 = t2.m1 GROUP BY t1.dim2
    `,
    sane`
      SELECT CAST(__time AS BIGINT), m1, ANY_VALUE(dim3, 100) FROM foo WHERE (TIME_FLOOR(__time, 'PT1H'), m1) IN
         (
           SELECT TIME_FLOOR(__time, 'PT1H') AS t1, MIN(m1) AS t2 FROM foo WHERE dim3 = 'b'
               AND __time BETWEEN '1994-04-29 00:00:00' AND '2020-01-11 00:00:00' GROUP BY 1
          )
      GROUP BY 1, 2

    `,
    sane`
      SELECT CAST(__time AS BIGINT), m1, ANY_VALUE(dim3, 100) FROM foo WHERE (CAST(TIME_FLOOR(__time, 'PT1H') AS BIGINT), m1) IN
         (
           SELECT CAST(TIME_FLOOR(__time, 'PT1H') AS BIGINT) + 0 AS t1, MIN(m1) AS t2 FROM foo WHERE dim3 = 'b'
               AND __time BETWEEN '1994-04-29 00:00:00' AND '2020-01-11 00:00:00' GROUP BY 1
          )
      GROUP BY 1, 2

    `,
    sane`
      SELECT exp(count(*)) + 10, sum(m2)  FROM druid.foo WHERE  dim2 = 0
    `,
    sane`
      SELECT exp(count(*)) + 10, sum(m2)  FROM druid.foo WHERE  __time >= TIMESTAMP '2999-01-01 00:00:00'
    `,
    sane`
      SELECT COUNT(*) FROM foo WHERE dim1 = 'nonexistent' GROUP BY FLOOR(__time TO DAY)
    `,
    sane`
      SELECT
      TRIM(BOTH 'x' FROM 'xfoox'),
      TRIM(TRAILING 'x' FROM 'xfoox'),
      TRIM(' ' FROM ' foo '),
      TRIM(TRAILING FROM ' foo '),
      TRIM(' foo '),
      BTRIM(' foo '),
      BTRIM('xfoox', 'x'),
      LTRIM(' foo '),
      LTRIM('xfoox', 'x'),
      RTRIM(' foo '),
      RTRIM('xfoox', 'x'),
      COUNT(*)
      FROM foo
    `,
    sane`
      SELECT
      LPAD('foo', 5, 'x'),
      LPAD('foo', 2, 'x'),
      LPAD('foo', 5),
      RPAD('foo', 5, 'x'),
      RPAD('foo', 2, 'x'),
      RPAD('foo', 5),
      COUNT(*)
      FROM foo
    `,
    sane`
      SELECT DISTINCT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA
    `,
    sane`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE IN ('SYSTEM_TABLE', 'TABLE', 'VIEW')
    `,
    sane`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE IN ('SYSTEM_TABLE', 'TABLE', 'VIEW')
    `,
    sane`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'druid' AND TABLE_NAME = 'foo'
    `,
    sane`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'druid' AND TABLE_NAME = 'forbiddenDatasource'
    `,
    sane`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'druid' AND TABLE_NAME = 'forbiddenDatasource'
    `,
    sane`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'druid' AND TABLE_NAME = 'aview'
    `,
    sane`
      SELECT
        COUNT(JDBC_TYPE),
        SUM(JDBC_TYPE),
        AVG(JDBC_TYPE),
        MIN(JDBC_TYPE),
        MAX(JDBC_TYPE)
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'druid' AND TABLE_NAME = 'foo'
    `,
    sane`
      SELECT * FROM druid.foo
    `,
    sane`
      SELECT * FROM druid.forbiddenDatasource
    `,
    sane`
      SELECT * FROM druid.forbiddenDatasource
    `,
    sane`
      SELECT COUNT(*) FROM foo
    `,
    sane`
      SELECT * FROM druid.foo LIMIT 2
    `,
    sane`
      SELECT SUBSTRING(dim2, 1, 1) FROM druid.foo LIMIT 2
    `,
    sane`
      SELECT dim1 FROM druid.foo WHERE m1 + 1 = 7
    `,
    sane`
      SELECT * FROM druid.foo ORDER BY __time DESC LIMIT 2
    `,
    sane`
      SELECT * FROM druid.foo ORDER BY __time
    `,
    sane`
      SELECT dim2 x, dim2 y FROM druid.foo LIMIT 2
    `,
    sane`
      SELECT dim1 FROM druid.foo ORDER BY __time DESC LIMIT 2
    `,
    sane`
      SELECT * FROM (SELECT dim1 FROM druid.foo ORDER BY __time DESC) LIMIT 2
    `,
    sane`
      SELECT dim1 FROM druid.foo ORDER BY __time DESC
    `,
    sane`
      SELECT "__time", "count", "dimHyperUnique", "dimMultivalEnumerated", "dimMultivalEnumerated2", "dimMultivalSequentialWithNulls", "dimSequential", "dimSequentialHalfNull", "dimUniform", "dimZipf", "metFloatNormal", "metFloatZipf", "metLongSequential" FROM druid.lotsocolumns WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '10' YEAR
    `,
    sane`
      SELECT "__time", "count", "dimHyperUnique", "dimMultivalEnumerated", "dimMultivalEnumerated2", "dimMultivalSequentialWithNulls", "dimSequential", "dimSequentialHalfNull", "dimUniform", "dimZipf", "metFloatNormal", "metFloatZipf", "metLongSequential", "metLongUniform" FROM druid.lotsocolumns WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '10' YEAR
    `,
    sane`
      SELECT dim1, COUNT(*) FROM druid.foo GROUP BY dim1 ORDER BY dim1 DESC
    `,
    sane`
      SELECT dim1, COUNT(*) FROM druid.foo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT dim1, dim2, COUNT(*) FROM druid.foo GROUP BY dim1, dim2 ORDER BY dim1 DESC
    `,
    sane`
      SELECT dim1, dim2, COUNT(*) FROM druid.foo GROUP BY 1, 2 ORDER BY 3 DESC
    `,
    sane`
      SELECT 'beep ' || dim1 FROM (SELECT dim1 FROM druid.foo ORDER BY __time DESC LIMIT 2)
    `,
    sane`
      SELECT 'beep ' || dim1 FROM (SELECT dim1 FROM druid.foo ORDER BY __time DESC)
    `,
    sane`
      SELECT 'beep ' || dim1 FROM (SELECT dim1 FROM druid.foo ORDER BY __time DESC LIMIT 4) LIMIT 2
    `,
    sane`
      SELECT dim1 FROM druid.foo GROUP BY dim1 ORDER BY dim1 DESC
    `,
    sane`
      SELECT EARLIEST(cnt), EARLIEST(m1), EARLIEST(dim1, 10), EARLIEST(cnt + 1), EARLIEST(m1 + 1), EARLIEST(dim1 || CAST(cnt AS VARCHAR), 10) FROM druid.foo
    `,
    sane`
      SELECT LATEST(cnt), LATEST(m1), LATEST(dim1, 10), LATEST(cnt + 1), LATEST(m1 + 1), LATEST(dim1 || CAST(cnt AS VARCHAR), 10) FROM druid.foo
    `,
    sane`
      SELECT ANY_VALUE(cnt), ANY_VALUE(m1), ANY_VALUE(m2), ANY_VALUE(dim1, 10), ANY_VALUE(cnt + 1), ANY_VALUE(m1 + 1), ANY_VALUE(dim1 || CAST(cnt AS VARCHAR), 10) FROM druid.foo
    `,
    sane`
      SELECT ANY_VALUE(l1), ANY_VALUE(d1), ANY_VALUE(f1) FROM druid.numfoo
    `,
    sane`
      SELECT ANY_VALUE(l1), ANY_VALUE(d1), ANY_VALUE(f1) FROM druid.numfoo GROUP BY dim2
    `,
    sane`
      SELECT SUM(val1), SUM(val2), SUM(val3) FROM (SELECT dim2, LATEST(m1) AS val1, LATEST(cnt) AS val2, LATEST(m2) AS val3 FROM foo GROUP BY dim2)
    `,
    sane`
      SELECT SUM(val1), SUM(val2), SUM(val3) FROM (SELECT dim2, EARLIEST(m1) AS val1, EARLIEST(cnt) AS val2, EARLIEST(m2) AS val3 FROM foo GROUP BY dim2)
    `,
    sane`
      SELECT SUM(val) FROM (SELECT dim2, LATEST(dim1, 10) AS val FROM foo GROUP BY dim2)
    `,
    sane`
      SELECT SUM(val) FROM (SELECT dim2, EARLIEST(dim1, 10) AS val FROM foo GROUP BY dim2)
    `,
    sane`
      SELECT SUM(val1), SUM(val2), SUM(val3) FROM (SELECT dim2, ANY_VALUE(m1) AS val1, ANY_VALUE(cnt) AS val2, ANY_VALUE(m2) AS val3 FROM foo GROUP BY dim2)
    `,
    sane`
      SELECT SUM(val) FROM (SELECT dim2, ANY_VALUE(dim1, 10) AS val FROM foo GROUP BY dim2)
    `,
    sane`
      SELECT EARLIEST(l1), EARLIEST(d1), EARLIEST(f1) FROM druid.numfoo
    `,
    sane`
      SELECT LATEST(l1), LATEST(d1), LATEST(f1) FROM druid.numfoo
    `,
    sane`
      SELECT EARLIEST(dim1, 32), LATEST(l1), LATEST(d1), LATEST(f1) FROM druid.numfoo WHERE dim1 IS NOT NULL AND l1 IS NOT NULL AND d1 IS NOT NULL AND f1 is NOT NULL
    `,
    sane`
      SELECT ANY_VALUE(dim1, 32), ANY_VALUE(l2), ANY_VALUE(d2), ANY_VALUE(f2) FROM druid.numfoo
    `,
    sane`
      SELECT ANY_VALUE(dim1, 32), ANY_VALUE(l2), ANY_VALUE(d2), ANY_VALUE(f2) FROM druid.numfoo WHERE dim1 IS NOT NULL AND l2 IS NOT NULL AND d2 IS NOT NULL AND f2 is NOT NULL
    `,
    sane`
      SELECT dim1, EARLIEST(f1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, EARLIEST(d1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, EARLIEST(l1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, LATEST(f1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, LATEST(d1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, LATEST(l1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, ANY_VALUE(f1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, ANY_VALUE(d1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT dim1, ANY_VALUE(l1) FROM druid.numfoo GROUP BY 1 ORDER BY 2 LIMIT 10
    `,
    sane`
      SELECT cnt, COUNT(*) FROM druid.foo GROUP BY cnt
    `,
    sane`
      SELECT cnt, COUNT(*) FROM druid.foo GROUP BY 1
    `,
    sane`
      SELECT cnt AS theCnt, COUNT(*) FROM druid.foo GROUP BY theCnt ORDER BY theCnt ASC
    `,
    sane`
      SELECT
      FLOOR(__time TO MONTH) AS __time,
      COUNT(*)
      FROM druid.foo
      GROUP BY FLOOR(__time TO MONTH)
    `,
    sane`
      SELECT cnt as theCnt, COUNT(*) FROM druid.foo GROUP BY 1 ORDER BY 1 ASC
    `,
    sane`
      SELECT m1, COUNT(*) FROM druid.foo GROUP BY m1
    `,
    sane`
      SELECT m2, COUNT(*) FROM druid.foo GROUP BY m2
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE m1 = 1.0
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE m2 = 1.0
    `,
    sane`
      SELECT SUM(m1) AS m1_sum FROM foo HAVING m1_sum = 21
    `,
    sane`
      SELECT dim1, SUM(m1) AS m1_sum FROM druid.foo GROUP BY dim1 HAVING SUM(m1) > 1
    `,
    sane`
      SELECT dim2, COUNT(DISTINCT m1) FROM druid.foo GROUP BY dim2 HAVING COUNT(DISTINCT m1) > 1
    `,
    sane`
      SELECT dim2, COUNT(DISTINCT m1) FROM druid.foo GROUP BY dim2 HAVING COUNT(DISTINCT m1) > 1
    `,
    sane`
      SELECT dim1, CAST(SUM(m1) AS FLOAT) AS m1_sum FROM druid.foo GROUP BY dim1 HAVING CAST(SUM(m1) AS FLOAT) > 1
    `,
    sane`
      SELECT dim1, m1, COUNT(*) FROM druid.foo WHERE m1 - 1 = dim1 GROUP BY dim1, m1
    `,
    sane`
      SELECT
        dim1,
        COUNT(*) FILTER(WHERE dim2 <> 'a')/COUNT(*) as ratio
      FROM druid.foo
      GROUP BY dim1
      HAVING COUNT(*) FILTER(WHERE dim2 <> 'a')/COUNT(*) = 1
    `,
    sane`
      SELECT
        dim1,  SUBSTRING(dim1, 2)
      FROM druid.foo
      GROUP BY dim1

    `,
    sane`
      SELECT
        dim1,  SUBSTRING(dim1, 2)
      FROM druid.foo
      GROUP BY dim1
      ORDER BY CHARACTER_LENGTH(dim1) DESC, dim1
    `,
    sane`
      SELECT
        dim1,  SUBSTRING(dim1, 2)
      FROM druid.foo
      GROUP BY dim1
      LIMIT 10
    `,
    sane`
      SELECT
        dim1,  SUBSTRING(dim1, 2)
      FROM druid.foo
      GROUP BY dim1
      ORDER BY CHARACTER_LENGTH(dim1) DESC
      LIMIT 10
    `,
    sane`
      SELECT COUNT(*) FROM foo UNION ALL SELECT SUM(cnt) FROM foo UNION ALL SELECT COUNT(*) FROM foo
    `,
    sane`
      SELECT * FROM (SELECT COUNT(*) FROM foo UNION ALL SELECT SUM(cnt) FROM foo UNION ALL SELECT COUNT(*) FROM foo) LIMIT 2
    `,
    sane`
      SELECT
        CASE 'foo'
        WHEN 'bar' THEN SUM(cnt)
        WHEN 'foo' THEN SUM(m1)
        WHEN 'baz' THEN SUM(m2)
        END
      FROM foo
    `,
    sane`
      SELECT
        CASE 'foo'
        WHEN 'bar' THEN SUM(cnt) / 10
        WHEN 'foo' THEN SUM(m1) / 10
        WHEN 'baz' THEN SUM(m2) / 10
        END
      FROM foo
    `,
    sane`
      SELECT
        CASE 'foo'
        WHEN 'bar' THEN SUM(cnt)
        WHEN 'foo' THEN SUM(m1)
        WHEN 'baz' THEN SUM(m2)
        END AS theCase
      FROM foo
      HAVING theCase = 21
    `,
    sane`
      SELECT
        CASE EXTRACT(DAY FROM __time)
          WHEN m1 THEN 'match-m1'
          WHEN cnt THEN 'match-cnt'
          WHEN 0 THEN 'zero'    END,  COUNT(*)
      FROM druid.foo
      GROUP BY  CASE EXTRACT(DAY FROM __time)
          WHEN m1 THEN 'match-m1'
          WHEN cnt THEN 'match-cnt'
          WHEN 0 THEN 'zero'    END
    `,
    sane`
      SELECT
        CASE WHEN m1 > 1 AND m1 < 5 AND cnt = 1 THEN 'x' ELSE NULL END,  COUNT(*)
      FROM druid.foo
      GROUP BY 1
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.foo
      WHERE NULLIF(dim2, 'a') IS NULL
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.numfoo
      WHERE l1 IS NULL
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.numfoo
      WHERE d1 IS NULL
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.numfoo
      WHERE f1 IS NULL
    `,
    sane`
      SELECT d1, COUNT(*) FROM druid.numfoo GROUP BY d1 ORDER BY d1 DESC LIMIT 10
    `,
    sane`
      SELECT f1, COUNT(*) FROM druid.numfoo GROUP BY f1 ORDER BY f1 DESC LIMIT 10
    `,
    sane`
      SELECT l1, COUNT(*) FROM druid.numfoo GROUP BY l1 ORDER BY l1 DESC LIMIT 10
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.numfoo
      WHERE l1 > 3
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.numfoo
      WHERE d1 > 0
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.numfoo
      WHERE f1 > 0
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.foo
      WHERE NULLIF(dim2, 'a') = ''
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.foo
      WHERE NULLIF(dim2, 'a') = ''
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.foo
      WHERE NULLIF(dim2, 'a') = null
    `,
    sane`
      SELECT COALESCE(dim2, dim1), COUNT(*) FROM druid.foo GROUP BY COALESCE(dim2, dim1)

    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim2 IS NULL

    `,
    sane`
      SELECT COUNT(*) FROM druid.foo x, druid.foo y

    `,
    sane`
      SELECT dim1 FROM druid.foo ORDER BY dim1
    `,
    sane`
      SELECT DISTINCT dim2 FROM druid.foo ORDER BY dim2 LIMIT 2 OFFSET 5
    `,
    sane`
      SELECT foo.dim1, foo.dim2, l.k, l.v
      FROM foo INNER JOIN lookup.lookyloo l ON foo.dim2 <> l.k
    `,
    sane`
      SELECT foo.dim1, foo.dim2, l.k, l.v
      FROM foo INNER JOIN lookup.lookyloo l ON CHARACTER_LENGTH(foo.dim2 || l.k) > 3

    `,
    sane`
      SELECT COUNT(distinct dim1), COUNT(distinct dim2) FROM druid.foo
    `,
    sane`
      SELECT * FROM druid.foo WHERE dim1 > 'd' OR dim2 = 'a'
    `,
    sane`
      SELECT COUNT(*), MAX(cnt) FROM druid.foo WHERE 1 = 0
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE FLOOR(__time TO DAY) = TIMESTAMP '2000-01-02 01:00:00'
      OR FLOOR(__time TO DAY) = TIMESTAMP '2000-01-02 02:00:00'
    `,
    sane`
      SELECT COUNT(*), MAX(cnt) FROM druid.foo WHERE 1 = 0 GROUP BY dim1
    `,
    sane`
      SELECT COUNT(*), MAX(cnt) FROM druid.foo WHERE dim1 = 'foobar'
    `,
    sane`
      SELECT COUNT(*), SUM(cnt) FROM druid.foo GROUP BY ()
    `,
    sane`
      SELECT COUNT(*), MAX(cnt) FROM druid.foo WHERE dim1 = 'foobar' GROUP BY 'dummy'
    `,
    sane`
      SELECT COUNT(cnt) FROM druid.foo
    `,
    sane`
      SELECT COUNT(dim2) FROM druid.foo
    `,
    sane`
      SELECT COUNT(CASE WHEN dim2 = 'abc' THEN 'yes' WHEN dim2 = 'def' THEN 'yes' END) FROM druid.foo
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
    `,
    sane`
      SELECT COUNT(*) FROM druid.aview WHERE dim1_firstchar <> 'z'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim1 like 'a%' OR dim2 like '%xb%' escape 'x'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt >= 3 OR cnt = 1
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt > 1.1 and cnt < 100000001.0
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt = 1.0
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt = 100000001.0
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt = 1.0 or cnt = 100000001.0
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt = 1 OR cnt = 2
    `,
    sane`
      SELECT distinct dim1 FROM druid.foo WHERE dim1 = 10 OR (floor(CAST(dim1 AS float)) = 10.00 and CAST(dim1 AS float) > 9 and CAST(dim1 AS float) <= 10.5)
    `,
    sane`
      SELECT COUNT(*), COUNT(cnt), COUNT(dim1), AVG(cnt), SUM(cnt), SUM(cnt) + MIN(cnt) + MAX(cnt), COUNT(dim2) FROM druid.foo
    `,
    sane`
      SELECT dim1, MIN(m1) + MAX(m1) AS x FROM druid.foo GROUP BY dim1 ORDER BY x LIMIT 3
    `,
    sane`
      SELECT dim1, MIN(m1) + MAX(m1) AS x FROM druid.foo GROUP BY dim1 ORDER BY x LIMIT 3
    `,
    sane`
      SELECT dim1, MIN(m1) + MAX(m1) AS x FROM druid.foo GROUP BY dim1 ORDER BY x LIMIT 3
    `,
    sane`
      SELECT SUM(case dim1 when 'abc' then cnt end), SUM(case dim1 when 'abc' then null else cnt end), SUM(case substring(dim1, 1, 1) when 'a' then cnt end), COUNT(dim2) filter(WHERE dim1 <> '1'), COUNT(CASE WHEN dim1 <> '1' THEN 'dummy' END), SUM(CASE WHEN dim1 <> '1' THEN 1 ELSE 0 END), SUM(cnt) filter(WHERE dim2 = 'a'), SUM(case when dim1 <> '1' then cnt end) filter(WHERE dim2 = 'a'), SUM(CASE WHEN dim1 <> '1' THEN cnt ELSE 0 END), MAX(CASE WHEN dim1 <> '1' THEN cnt END), COUNT(DISTINCT CASE WHEN dim1 <> '1' THEN m1 END), SUM(cnt) filter(WHERE dim2 = 'a' AND dim1 = 'b') FROM druid.foo
    `,
    sane`
      SELECT
        cnt,
        SUM(CASE WHEN dim1 <> '1' THEN 1 ELSE 0 END) + SUM(cnt)
      FROM druid.foo
      GROUP BY cnt
    `,
    sane`
      SELECT
      COUNT(*) filter(WHERE dim1 NOT IN ('1')),
      COUNT(dim2) filter(WHERE dim1 NOT IN ('1'))
      FROM druid.foo
    `,
    sane`
      SELECT
        SUM(cnt * 3),
        LN(SUM(cnt) + SUM(m1)),
        MOD(SUM(cnt), 4),
        SUM(CHARACTER_LENGTH(CAST(cnt * 10 AS VARCHAR))),
        MAX(CHARACTER_LENGTH(dim2) + LN(m1))
      FROM druid.foo
    `,
    sane`
      SELECT
        FLOOR(m1 / 2) * 2,
        COUNT(*)
      FROM druid.foo
      WHERE FLOOR(m1 / 2) * 2 > -1
      GROUP BY FLOOR(m1 / 2) * 2
      ORDER BY 1 DESC
    `,
    sane`
      SELECT
        CAST(m1 AS BIGINT) / 2 * 2,
        COUNT(*)
      FROM druid.foo
      WHERE CAST(m1 AS BIGINT) / 2 * 2 > -1
      GROUP BY CAST(m1 AS BIGINT) / 2 * 2
      ORDER BY 1 DESC
    `,
    sane`
      SELECT
        FLOOR(CAST(dim1 AS FLOAT) / 2) * 2,
        COUNT(*)
      FROM druid.foo
      WHERE FLOOR(CAST(dim1 AS FLOAT) / 2) * 2 > -1
      GROUP BY FLOOR(CAST(dim1 AS FLOAT) / 2) * 2
      ORDER BY 1 DESC
    `,
    sane`
      SELECT dim1, COUNT(*) FROM druid.foo WHERE dim1 IN ('abc', 'def', 'ghi') GROUP BY dim1
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim2 = 'a' and (dim1 > 'a' OR dim1 < 'b')
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim2 = 'a' and not (dim1 > 'a' OR dim1 < 'b')
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE 2.5 < m1 AND m1 < 3.5
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE (dim1 >= 'a' and dim1 < 'b') OR dim1 = 'ab'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE (dim1 >= 'a' and dim1 < 'b') and dim1 = 'abc'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE CAST(dim1 AS bigint) = 2
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE __time >= TIMESTAMP '2000-01-01 00:00:00' AND __time < TIMESTAMP '2001-01-01 00:00:00'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE
        CASE
          WHEN __time >= TIME_PARSE('2000-01-01 00:00:00', 'yyyy-MM-dd HH:mm:ss') AND __time < TIMESTAMP '2001-01-01 00:00:00'
          THEN true
          ELSE false
        END
      OR
        __time >= TIMESTAMP '2010-01-01 00:00:00' AND __time < TIMESTAMP '2011-01-01 00:00:00'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE __time = TIMESTAMP '2000-01-01 00:00:00.111'
      OR (__time >= TIMESTAMP '2000-01-01 00:00:00.888' AND __time < TIMESTAMP '2000-01-02 00:00:00.222')
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE __time >= '2000-01-01 00:00:00' AND __time < '2001-01-01T00:00:00'
      OR __time >= '2001-02-01' AND __time < '2001-02-02'
      OR __time BETWEEN '2001-03-01' AND '2001-03-02'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE __time >= 'z2000-01-01 00:00:00' AND __time < '2001-01-01 00:00:00'

    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE __time = TIMESTAMP '2000-01-01 00:00:00'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE __time = TIMESTAMP '2000-01-01 00:00:00' OR __time = TIMESTAMP '2000-01-01 00:00:00' + INTERVAL '1' DAY
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim2 = 'a' and (  (__time >= TIMESTAMP '2000-01-01 00:00:00' AND __time < TIMESTAMP '2001-01-01 00:00:00')  OR (    (__time >= TIMESTAMP '2002-01-01 00:00:00' AND __time < TIMESTAMP '2003-05-01 00:00:00')    and (__time >= TIMESTAMP '2002-05-01 00:00:00' AND __time < TIMESTAMP '2004-01-01 00:00:00')    and dim1 = 'abc'  ))
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE not (dim2 = 'a' and (    (__time >= TIMESTAMP '2000-01-01 00:00:00' AND __time < TIMESTAMP '2001-01-01 00:00:00')    OR (      (__time >= TIMESTAMP '2002-01-01 00:00:00' AND __time < TIMESTAMP '2004-01-01 00:00:00')      and (__time >= TIMESTAMP '2002-05-01 00:00:00' AND __time < TIMESTAMP '2003-05-01 00:00:00')      and dim1 = 'abc'    )  ))
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim1 <> 'xxx' and not (    (__time >= TIMESTAMP '2000-01-01 00:00:00' AND __time < TIMESTAMP '2001-01-01 00:00:00')    OR (__time >= TIMESTAMP '2003-01-01 00:00:00' AND __time < TIMESTAMP '2004-01-01 00:00:00'))
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim2 <> 'a' and __time BETWEEN TIMESTAMP '2000-01-01 00:00:00' AND TIMESTAMP '2000-12-31 23:59:59.999'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE dim2 <> 'a' or __time BETWEEN TIMESTAMP '2000-01-01 00:00:00' AND TIMESTAMP '2000-12-31 23:59:59.999'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt >= EXTRACT(EPOCH FROM TIMESTAMP '1970-01-01 00:00:00') * 1000 AND cnt < EXTRACT(EPOCH FROM TIMESTAMP '1970-01-02 00:00:00') * 1000
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt >= EXTRACT(EPOCH FROM DATE '1970-01-01') * 1000 AND cnt < EXTRACT(EPOCH FROM DATE '1970-01-02') * 1000
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE cnt >= TIMESTAMP_TO_MILLIS(TIMESTAMP '1970-01-01 00:00:00') AND cnt < TIMESTAMP_TO_MILLIS(TIMESTAMP '1970-01-02 00:00:00')
    `,
    sane`
      SELECT SUM(CAST(dim1 AS INTEGER)) FROM druid.foo
    `,
    sane`
      SELECT SUM(CAST(SUBSTRING(dim1, 1, 10) AS INTEGER)) FROM druid.foo
    `,
    sane`
      SELECT
        FLOOR(MILLIS_TO_TIMESTAMP(cnt) TO YEAR),
        COUNT(*)
      FROM
        druid.foo
      WHERE
        MILLIS_TO_TIMESTAMP(cnt) >= TIMESTAMP '1970-01-01 00:00:00'
        AND MILLIS_TO_TIMESTAMP(cnt) < TIMESTAMP '1970-01-02 00:00:00'
      GROUP BY
        FLOOR(MILLIS_TO_TIMESTAMP(cnt) TO YEAR)
    `,
    sane`
      SELECT distinct dim1 FROM druid.foo WHERE substring(substring(dim1, 2), 1, 1) = 'e' OR dim2 = 'a'
    `,
    sane`
      SELECT distinct dim1 FROM druid.foo WHERE CHARACTER_LENGTH(dim1) = 3 OR CAST(CHARACTER_LENGTH(dim1) AS varchar) = 3
    `,
    sane`
      SELECT DISTINCT dim2 FROM druid.foo LIMIT 10
    `,
    sane`
      SELECT * FROM (SELECT DISTINCT dim2 FROM druid.foo ORDER BY dim2) LIMIT 10
    `,
    sane`
      SELECT * FROM (SELECT DISTINCT dim2 FROM druid.foo ORDER BY dim2 LIMIT 5) LIMIT 10
    `,
    sane`
      SELECT * FROM (SELECT DISTINCT dim2 FROM druid.foo ORDER BY dim2 LIMIT 2 OFFSET 5) OFFSET 2
    `,
    sane`
      SELECT * FROM (SELECT DISTINCT dim2 FROM druid.foo ORDER BY dim2 DESC LIMIT 5) LIMIT 10
    `,
    sane`
      SELECT SUM(cnt), COUNT(distinct dim2), COUNT(distinct unique_dim1) FROM druid.foo
    `,
    sane`
      SELECT
      COUNT(DISTINCT CASE WHEN m1 >= 4 THEN m1 END),
      COUNT(DISTINCT CASE WHEN m1 >= 4 THEN dim1 END),
      COUNT(DISTINCT CASE WHEN m1 >= 4 THEN unique_dim1 END)
      FROM druid.foo
    `,
    sane`
      SELECT COUNT(distinct dim2) FROM druid.foo
    `,
    sane`
      SELECT APPROX_COUNT_DISTINCT(dim2) FROM druid.foo
    `,
    sane`
      SELECT dim2, SUM(cnt), COUNT(distinct dim1) FROM druid.foo GROUP BY dim2
    `,
    sane`
      SELECT
          FLOOR(__time to hour) AS __time,
          dim1,
          COUNT(m2)
      FROM (
          SELECT
              MAX(__time) AS __time,
              m2,
              dim1
          FROM druid.foo
          WHERE 1=1
              AND m1 = '5.0'
          GROUP BY m2, dim1
      )
      GROUP BY FLOOR(__time to hour), dim1
    `,
    sane`
      SELECT SUM(cnt), COUNT(*) FROM (
        SELECT dim2, SUM(t1.cnt) cnt FROM (
          SELECT
            dim1,
            dim2,
            COUNT(*) cnt
          FROM druid.foo
          GROUP BY dim1, dim2
        ) t1
        GROUP BY dim2
      ) t2
    `,
    sane`
      SELECT MAX(cnt) FROM (
        SELECT dim2, MAX(t1.cnt) cnt FROM (
          SELECT
            dim1,
            dim2,
            COUNT(*) cnt
          FROM druid.foo
          GROUP BY dim1, dim2
        ) t1
        GROUP BY dim2
      ) t2
    `,
    sane`
      SELECT
        SUM(cnt),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS cnt FROM druid.foo GROUP BY dim2)
    `,
    sane`
      SELECT * FROM (  SELECT max(cnt), min(cnt), avg(cnt), TIME_EXTRACT(max(t), 'EPOCH') last_time, count(1) num_days FROM (
            SELECT TIME_FLOOR(__time, 'P1D') AS t, count(1) cnt
            FROM "foo"
            GROUP BY 1
        )) LIMIT 1

    `,
    sane`
      SELECT
        AVG(u)
      FROM (SELECT FLOOR(__time TO DAY), APPROX_COUNT_DISTINCT(cnt) AS u FROM druid.foo GROUP BY 1)
    `,
    sane`
      SELECT t1.dim1, SUM(t1.cnt)
      FROM druid.foo t1
        INNER JOIN (
        SELECT
          SUM(cnt) AS sum_cnt,
          dim2
        FROM druid.foo
        GROUP BY dim2
        ORDER BY 1 DESC
        LIMIT 2
      ) t2 ON (t1.dim2 = t2.dim2)
      GROUP BY t1.dim1
      ORDER BY 1

    `,
    sane`
      SELECT SUBSTRING(t1.dim1, 1, 10), SUM(t1.cnt)
      FROM druid.foo t1
        INNER JOIN (
        SELECT
          SUM(cnt) AS sum_cnt,
          dim2
        FROM druid.foo
        GROUP BY dim2
        ORDER BY 1 DESC
        LIMIT 2
      ) t2 ON (t1.dim2 = t2.dim2)
      GROUP BY SUBSTRING(t1.dim1, 1, 10)
    `,
    sane`
      SELECT t1.dim1, SUM(t1.cnt)
      FROM druid.foo t1
        LEFT JOIN (
        SELECT
          SUM(cnt) AS sum_cnt,
          dim2
        FROM druid.foo
        GROUP BY dim2
        ORDER BY 1 DESC
        LIMIT 2
      ) t2 ON (t1.dim2 = t2.dim2)
      GROUP BY t1.dim1
      ORDER BY 1

    `,
    sane`
      SELECT COUNT(*)
      FROM (
        SELECT DISTINCT dim2
        FROM druid.foo
        WHERE SUBSTRING(dim2, 1, 1) IN (
          SELECT SUBSTRING(dim1, 1, 1) FROM druid.foo WHERE dim1 <> ''
        ) AND __time >= '2000-01-01' AND __time < '2002-01-01'
      )
    `,
    sane`
      SELECT COUNT(*)
      FROM druid.foo
      WHERE SUBSTRING(dim2, 1, 1) IN (
        SELECT SUBSTRING(dim1, 1, 1) FROM druid.foo WHERE dim1 <> ''
      )

    `,
    sane`
      SELECT
        SUM(cnt),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS cnt FROM druid.foo GROUP BY dim2)
      WHERE dim2 <> ''
    `,
    sane`
      SELECT
        SUM(cnt),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS cnt FROM druid.foo GROUP BY dim2)
      WHERE dim2 IS NOT NULL
    `,
    sane`
      SELECT
        SUM(cnt),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS cnt FROM druid.foo GROUP BY dim2 LIMIT 1)WHERE cnt > 0
    `,
    sane`
      SELECT
        COUNT(*) AS exact_count,
        COUNT(DISTINCT dim1) AS approx_count,
        (CAST(1 AS FLOAT) - COUNT(DISTINCT dim1) / COUNT(*)) * 100 AS error_pct
      FROM (SELECT DISTINCT dim1 FROM druid.foo WHERE dim1 <> '')
    `,
    sane`
      SELECT
        CAST(thecnt AS VARCHAR),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS thecnt FROM druid.foo GROUP BY dim2)
      GROUP BY CAST(thecnt AS VARCHAR)
    `,
    sane`
      SELECT
        CAST(thecnt AS VARCHAR),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS thecnt FROM druid.foo GROUP BY dim2)
      GROUP BY CAST(thecnt AS VARCHAR) ORDER BY CAST(thecnt AS VARCHAR) LIMIT 2
    `,
    sane`
      SELECT
        SUM(cnt),
        COUNT(DISTINCT dim2),
        CAST(COUNT(DISTINCT dim2) AS FLOAT),
        SUM(cnt) / COUNT(DISTINCT dim2),
        SUM(cnt) / COUNT(DISTINCT dim2) + 3,
        CAST(SUM(cnt) AS FLOAT) / CAST(COUNT(DISTINCT dim2) AS FLOAT) + 3
      FROM druid.foo
    `,
    sane`
      SELECT COUNT(DISTINCT SUBSTRING(dim1, 1, 1)) FROM druid.foo WHERE dim1 <> ''
    `,
    sane`
      SELECT COUNT(DISTINCT TRIM(BOTH ' ' FROM dim1)) FROM druid.foo WHERE TRIM(dim1) <> ''
    `,
    sane`
      SELECT CAST((EXTRACT(MONTH FROM __time) - 1 ) / 3 + 1 AS INTEGER) AS quarter, COUNT(*)
      FROM foo
      GROUP BY CAST((EXTRACT(MONTH FROM __time) - 1 ) / 3 + 1 AS INTEGER)
    `,
    sane`
      SELECT DISTINCT
        REGEXP_EXTRACT(dim1, '^.'),
        REGEXP_EXTRACT(dim1, '^(.)', 1)
      FROM foo
      WHERE REGEXP_EXTRACT(dim1, '^(.)', 1) <> 'x'
    `,
    sane`
      SELECT COUNT(*)
      FROM foo
      WHERE REGEXP_EXTRACT(dim1, '^1') IS NOT NULL OR REGEXP_EXTRACT('Z' || dim1, '^Z2') IS NOT NULL
    `,
    sane`
      SELECT COUNT(*)
      FROM foo
      WHERE REGEXP_LIKE(dim1, '^1') OR REGEXP_LIKE('Z' || dim1, '^Z2')
    `,
    sane`
      SELECT dim2, dim1, SUM(cnt) FROM druid.foo GROUP BY dim2, dim1 ORDER BY dim1 LIMIT 4
    `,
    sane`
      SELECT dim1, dim2, SUM(cnt) AS thecnt FROM druid.foo group by dim1, dim2 having SUM(cnt) = 1 order by dim2 limit 4
    `,
    sane`
      SELECT dim4, substring(dim5, 1, 1), count(*) FROM druid.numfoo WHERE dim4 = 'a' GROUP BY 1,2 LIMIT 2
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE
      FLOOR(__time TO MONTH) = TIMESTAMP '2000-01-01 00:00:00'
      OR FLOOR(__time TO MONTH) = TIMESTAMP '2000-02-01 00:00:00'
    `,
    sane`
      SELECT TIME_FLOOR(__time, 'P1M', NULL, 'America/Los_Angeles'), COUNT(*)
      FROM druid.foo
      WHERE
      TIME_FLOOR(__time, 'P1M', NULL, 'America/Los_Angeles') =   TIME_PARSE('2000-01-01 00:00:00', NULL, 'America/Los_Angeles')
      OR TIME_FLOOR(__time, 'P1M', NULL, 'America/Los_Angeles') =   TIME_PARSE('2000-02-01 00:00:00', NULL, 'America/Los_Angeles')
      GROUP BY 1
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE
        __time >= CURRENT_TIMESTAMP + INTERVAL '01:02' HOUR TO MINUTE
        AND __time < TIMESTAMP '2003-02-02 01:00:00' - INTERVAL '1 1' DAY TO HOUR - INTERVAL '1-1' YEAR TO MONTH
    `,
    sane`
      SELECT CURRENT_TIMESTAMP, CURRENT_DATE, CURRENT_DATE + INTERVAL '1' DAY
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE __time >= CURRENT_TIMESTAMP + INTERVAL '1' DAY AND __time < TIMESTAMP '2002-01-01 00:00:00'
    `,
    sane`
      SELECT * FROM bview
    `,
    sane`
      SELECT * FROM bview
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE
      FLOOR(__time TO MONTH) <> TIMESTAMP '2001-01-01 00:00:00'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE
      FLOOR(__time TO MONTH) < TIMESTAMP '2000-02-01 00:00:00'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE
      FLOOR(__time TO MONTH) < TIMESTAMP '2000-02-01 00:00:01'
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE EXTRACT(YEAR FROM __time) = 2000
      AND EXTRACT(MONTH FROM __time) = 1
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE EXTRACT(YEAR FROM __time) = 2000
      AND EXTRACT(DAY FROM __time) IN (2, 3, 5)
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo4
      WHERE EXTRACT(YEAR FROM __time) = 2000
      AND EXTRACT(MICROSECOND FROM __time) = 946723
      AND EXTRACT(MILLISECOND FROM __time) = 695
      AND EXTRACT(ISODOW FROM __time) = 6
      AND EXTRACT(ISOYEAR FROM __time) = 2000
      AND EXTRACT(DECADE FROM __time) = 200
      AND EXTRACT(CENTURY FROM __time) = 20
      AND EXTRACT(MILLENNIUM FROM __time) = 2

    `,
    sane`
      SELECT COUNT(*) FROM druid.foo WHERE floor(__time TO month) = TIMESTAMP '2000-01-01 00:00:01'
    `,
    sane`
      SELECT floor(CAST(dim1 AS float)), COUNT(*) FROM druid.foo GROUP BY floor(CAST(dim1 AS float))
    `,
    sane`
      SELECT floor(CAST(dim1 AS float)) AS fl, COUNT(*) FROM druid.foo GROUP BY floor(CAST(dim1 AS float)) ORDER BY fl DESC
    `,
    sane`
      SELECT floor(__time TO year), dim2, COUNT(*) FROM druid.foo GROUP BY floor(__time TO year), dim2 ORDER BY floor(__time TO year), dim2, COUNT(*) DESC
    `,
    sane`
      SELECT CHARACTER_LENGTH(dim1), COUNT(*) FROM druid.foo GROUP BY CHARACTER_LENGTH(dim1)
    `,
    sane`
      SELECT LOOKUP(dim1, 'lookyloo'), COUNT(*) FROM foo
      WHERE LOOKUP(dim1, 'lookyloo') <> 'xxx'
      GROUP BY LOOKUP(dim1, 'lookyloo')
    `,
    sane`
      SELECT lookyloo.k, COUNT(*)
      FROM foo LEFT JOIN lookup.lookyloo ON foo.dim2 = lookyloo.k
      WHERE lookyloo.v = '123'
      GROUP BY lookyloo.k
    `,
    sane`
      SELECT lookyloo.v, COUNT(*)
      FROM foo LEFT JOIN lookup.lookyloo ON foo.dim2 = lookyloo.k
      WHERE lookyloo.v <> 'xa' OR lookyloo.v IS NULL
      GROUP BY lookyloo.v
    `,
    sane`
      SELECT lookyloo.v, COUNT(*)
      FROM lookup.lookyloo RIGHT JOIN foo ON foo.dim2 = lookyloo.k
      WHERE lookyloo.v <> 'xa'
      GROUP BY lookyloo.v
    `,
    sane`
      SELECT lookyloo.v, COUNT(*)
      FROM foo LEFT JOIN lookup.lookyloo ON foo.dim2 = lookyloo.k
      WHERE lookyloo.v <> 'xa'
      GROUP BY lookyloo.v
    `,
    sane`
      SELECT lookyloo.k, COUNT(*)
      FROM foo LEFT JOIN lookup.lookyloo ON foo.dim2 = lookyloo.k
      WHERE lookyloo.v = 'xa'
      GROUP BY lookyloo.k
    `,
    sane`
      SELECT base.dim2, lookyloo.v, base.cnt FROM (
        SELECT dim2, COUNT(*) cnt FROM foo GROUP BY dim2
      ) base
      LEFT JOIN lookup.lookyloo ON base.dim2 = lookyloo.k
      WHERE lookyloo.v <> 'xa' OR lookyloo.v IS NULL
    `,
    sane`
      SELECT lookyloo.v, COUNT(*)
      FROM foo INNER JOIN lookup.lookyloo ON foo.dim1 = lookyloo.k
      GROUP BY lookyloo.v
    `,
    sane`
      SELECT dim2, lookyloo.*
      FROM foo INNER JOIN lookup.lookyloo ON foo.dim2 = lookyloo.k

    `,
    sane`
      SELECT dim1, dim2, l1.v, l2.v
      FROM foo
      LEFT JOIN lookup.lookyloo l1 ON foo.dim1 = l1.k
      LEFT JOIN lookup.lookyloo l2 ON foo.dim2 = l2.k

    `,
    sane`
      SELECT dim1
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.dim2 = l.k
      INNER JOIN lookup.lookyloo l2 ON foo.dim2 = l2.k
      WHERE l.v = 'xa'
      LIMIT 100

    `,
    sane`
      SELECT dim1
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.dim2 = l.k
      INNER JOIN lookup.lookyloo l2 ON foo.dim2 = l2.k
      WHERE l.v = 'xa'

    `,
    sane`
      SELECT __time, cnt, dim1, dim2, dim3, m1, m2, unique_dim1
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.dim2 = l.k
      INNER JOIN lookup.lookyloo l2 ON foo.dim2 = l2.k
      WHERE l.v = 'xa'
      LIMIT 100

    `,
    sane`
      SELECT __time, cnt, dim1, dim2, dim3, m1, m2, unique_dim1
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.dim2 = l.k
      INNER JOIN lookup.lookyloo l2 ON foo.dim2 = l2.k
      WHERE l.v = 'xa'

    `,
    sane`
      SELECT dim1
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.dim2 = l.k
      INNER JOIN lookup.lookyloo l2 ON foo.dim2 = l2.k
      INNER JOIN lookup.lookyloo l3 ON foo.dim2 = l3.k
      INNER JOIN lookup.lookyloo l4 ON foo.dim2 = l4.k
      INNER JOIN lookup.lookyloo l5 ON foo.dim2 = l5.k
      INNER JOIN lookup.lookyloo l6 ON foo.dim2 = l6.k
      INNER JOIN lookup.lookyloo l7 ON foo.dim2 = l7.k
      INNER JOIN lookup.lookyloo l8 ON foo.dim2 = l8.k
      INNER JOIN lookup.lookyloo l9 ON foo.dim2 = l9.k
      INNER JOIN lookup.lookyloo l10 ON foo.dim2 = l10.k
      INNER JOIN lookup.lookyloo l11 ON foo.dim2 = l11.k
      INNER JOIN lookup.lookyloo l12 ON foo.dim2 = l12.k
      INNER JOIN lookup.lookyloo l13 ON foo.dim2 = l13.k
      INNER JOIN lookup.lookyloo l14 ON foo.dim2 = l14.k
      INNER JOIN lookup.lookyloo l15 ON foo.dim2 = l15.k
      INNER JOIN lookup.lookyloo l16 ON foo.dim2 = l16.k
      INNER JOIN lookup.lookyloo l17 ON foo.dim2 = l17.k
      INNER JOIN lookup.lookyloo l18 ON foo.dim2 = l18.k
      INNER JOIN lookup.lookyloo l19 ON foo.dim2 = l19.k
      WHERE l.v = 'xa'

    `,
    sane`
      SELECT dim1, dim2, t1.v, t1.v
      FROM foo
      INNER JOIN
        (SELECT SUBSTRING(k, 1, 1) k, LATEST(v, 10) v FROM lookup.lookyloo GROUP BY 1) t1
        ON foo.dim2 = t1.k
    `,
    sane`
      SELECT dim1, dim2, t1.sk
      FROM foo
      INNER JOIN
        (SELECT k, SUBSTRING(v, 1, 3) sk FROM lookup.lookyloo) t1
        ON foo.dim2 = t1.k
    `,
    sane`
      SELECT COUNT(*)
      FROM foo
      INNER JOIN lookup.lookyloo l1 ON l1.k = foo.m1
      INNER JOIN lookup.lookyloo l2 ON l2.k = l1.k
    `,
    sane`
      SELECT COUNT(*)
      FROM lookup.lookyloo l1
      INNER JOIN lookup.lookyloo l2 ON l1.k = l2.k
      INNER JOIN foo on l2.k = foo.m1
    `,
    sane`
      SELECT l.k, l.v, SUM(f.m1), SUM(nf.m1)
      FROM lookup.lookyloo l
      INNER JOIN druid.foo f on f.dim1 = l.k
      INNER JOIN druid.numfoo nf on nf.dim1 = l.k
      GROUP BY 1, 2 ORDER BY 2
    `,
    sane`
      SELECT l.k, l.v, SUM(f.m1), SUM(nf.m1)
      FROM lookup.lookyloo l
      INNER JOIN druid.foo f on f.dim1 = l.k
      INNER JOIN druid.numfoo nf on nf.dim1 = f.dim1
      GROUP BY 1, 2 ORDER BY 2
    `,
    sane`
      SELECT * FROM foo where dim1 IN (SELECT NULL FROM lookup.lookyloo)
    `,
    sane`
      SELECT foo.dim1, foo.dim2, l.k, l.v
      FROM foo, lookup.lookyloo l
      WHERE SUBSTRING(foo.dim2, 1, 1) = l.k

    `,
    sane`
      SELECT COUNT(*)
      FROM foo, lookup.lookyloo l, numfoo
      WHERE foo.cnt = l.k AND l.k = numfoo.cnt

    `,
    sane`
      SELECT COUNT(*)
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.cnt = l.k
      INNER JOIN numfoo ON l.k = numfoo.cnt

    `,
    sane`
      SELECT foo.m1, l.k, l.v
      FROM foo
      INNER JOIN lookup.lookyloo l ON CAST(foo.m1 AS VARCHAR) = l.k

    `,
    sane`
      SELECT foo.m1, l.k, l.v
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.m1 = CAST(l.k AS FLOAT)

    `,
    sane`
      SELECT foo.m1, l.k, l.v
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.m1 = l.k

    `,
    sane`
      SELECT foo.dim1, foo.dim2, l.k, l.v
      FROM foo
      INNER JOIN lookup.lookyloo l ON SUBSTRING(foo.dim2, 1, 1) = l.k

    `,
    sane`
      SELECT foo.dim1, foo.dim2, l.k, l.v
      FROM foo
      INNER JOIN lookup.lookyloo l ON foo.dim2 = SUBSTRING(l.k, 1, 2)

    `,
    sane`
      SELECT dim2, l1.v, l2.v
      FROM foo
      LEFT JOIN lookup.lookyloo l1 ON foo.dim2 = l1.k
      LEFT JOIN lookup.lookyloo l2 ON l1.k = l2.k
    `,
    sane`
      SELECT dim1, dim2, l1.v, l2.v, l3.v
      FROM foo
      LEFT JOIN lookup.lookyloo l1 ON foo.dim1 = l1.k
      LEFT JOIN lookup.lookyloo l2 ON foo.dim2 = l2.k
      LEFT JOIN lookup.lookyloo l3 ON l2.k = l3.k
    `,
    sane`
      SELECT dim1, lookyloo.*
      FROM foo LEFT JOIN lookup.lookyloo ON foo.dim1 = lookyloo.k
      WHERE lookyloo.v <> 'xxx' OR lookyloo.v IS NULL
    `,
    sane`
      SELECT dim1, lookyloo.*
      FROM foo RIGHT JOIN lookup.lookyloo ON foo.dim1 = lookyloo.k
      WHERE lookyloo.v <> 'xxx' OR lookyloo.v IS NULL
    `,
    sane`
      SELECT dim1, m1, cnt, lookyloo.*
      FROM foo FULL JOIN lookup.lookyloo ON foo.dim1 = lookyloo.k
      WHERE lookyloo.v <> 'xxx' OR lookyloo.v IS NULL
    `,
    sane`
      SELECT COUNT(DISTINCT LOOKUP(dim1, 'lookyloo')) FROM foo
    `,
    sane`
      SELECT COUNT(DISTINCT lookyloo.v)
      FROM foo LEFT JOIN lookup.lookyloo ON foo.dim1 = lookyloo.k
    `,
    sane`
      SELECT * FROM lookup.lookyloo
    `,
    sane`
      SELECT SUBSTRING(v, 1, 1), COUNT(*) FROM lookup.lookyloo GROUP BY 1
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT floor(__time TO month) AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT
        SUM(cnt) FILTER(WHERE __time >= TIMESTAMP '2000-01-01 00:00:00'
                          AND __time <  TIMESTAMP '2000-02-01 00:00:00'),
        SUM(cnt) FILTER(WHERE __time >= TIMESTAMP '2000-01-01 00:00:01'
                          AND __time <  TIMESTAMP '2000-02-01 00:00:00'),
        SUM(cnt) FILTER(WHERE __time >= TIMESTAMP '2001-01-01 00:00:00'
                          AND __time <  TIMESTAMP '2001-02-01 00:00:00')
      FROM foo
      WHERE
        __time >= TIMESTAMP '2000-01-01 00:00:00'
        AND __time < TIMESTAMP '2001-02-01 00:00:00'
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT FLOOR(__time TO MONTH) AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT
          FLOOR(__time TO MONTH) AS gran,
          cnt
        FROM druid.foo
        WHERE __time >= TIME_PARSE('1999-12-01 00:00:00') AND __time < TIME_PARSE('2002-01-01 00:00:00')
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT TIME_FLOOR(__time, 'P1M') AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT TIME_FLOOR(TIME_SHIFT(__time, 'P1D', -1), 'P1M') AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT TIME_FLOOR(TIMESTAMPADD(DAY, -1, __time), 'P1M') AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT TIME_FLOOR(__time, 'P1M', TIMESTAMP '1970-01-01 01:02:03') AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT TIME_FLOOR(__time, 'P1M', CAST(NULL AS TIMESTAMP), 'America/Los_Angeles') AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT TIME_FLOOR(__time, 'P1M') AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT floor(__time TO HOUR) AS gran, cnt FROM druid.foo
        WHERE __time >= TIMESTAMP '2000-01-01 00:00:00' AND __time < TIMESTAMP '2000-01-02 00:00:00'
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT SUM(cnt), dt FROM (
        SELECT CAST(__time AS DATE) AS dt,
        cnt FROM druid.foo
      ) AS x
      GROUP BY dt
      ORDER BY dt
    `,
    sane`
      SELECT SUM(cnt), dt FROM (
        SELECT CAST(FLOOR(__time TO QUARTER) AS DATE) AS dt,
        cnt FROM druid.foo
      ) AS x
      GROUP BY dt
      ORDER BY dt
    `,
    sane`
      SELECT gran, SUM(cnt) FROM (
        SELECT floor(__time TO month) AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran DESC
    `,
    sane`
      SELECT
        EXTRACT(YEAR FROM __time) AS "year",
        SUM(cnt)
      FROM druid.foo
      GROUP BY EXTRACT(YEAR FROM __time)
      ORDER BY 1
    `,
    sane`
      SELECT
        TIME_FORMAt(__time, 'yyyy MM') AS "year",
        SUM(cnt)
      FROM druid.foo
      GROUP BY TIME_FORMAt(__time, 'yyyy MM')
      ORDER BY 1
    `,
    sane`
      SELECT
      EXTRACT(YEAR FROM FLOOR(__time TO YEAR)) AS "year", SUM(cnt)
      FROM druid.foo
      GROUP BY EXTRACT(YEAR FROM FLOOR(__time TO YEAR))
    `,
    sane`
      SELECT
      EXTRACT(YEAR FROM FLOOR(__time TO YEAR)) AS "year", SUM(cnt)
      FROM druid.foo
      GROUP BY EXTRACT(YEAR FROM FLOOR(__time TO YEAR))
    `,
    sane`
      SELECT gran, SUM(cnt)
      FROM (
        SELECT floor(__time TO month) AS gran, cnt
        FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
      LIMIT 1
    `,
    sane`
      SELECT gran, SUM(cnt)
      FROM (
        SELECT floor(__time TO month) AS gran, cnt
        FROM druid.foo
      ) AS x
      GROUP BY gran
      LIMIT 1
    `,
    sane`
      SELECT gran, SUM(cnt)
      FROM (
        SELECT floor(__time TO month) AS gran, cnt
        FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
      LIMIT 1
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, dim2, cnt FROM druid.foo) AS x
      GROUP BY dim2, gran
      ORDER BY dim2, gran
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY GROUPING SETS ( (dim2, gran), (dim2), (gran), () )
    `,
    sane`
      SELECT cnt, COUNT(*)
      FROM foo
      GROUP BY GROUPING SETS ( (cnt), () )
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY ROLLUP (dim2, gran)
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY ROLLUP (gran, dim2)
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY CUBE (dim2, gran)
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY GROUPING SETS ( (dim2, 'dummy', gran), (dim2), (gran), ('dummy') )
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY GROUPING SETS ( (), (dim2), (gran) )
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY GROUPING SETS ( (), (dim2), (gran) )
      ORDER BY gran, dim2 DESC
    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY GROUPING SETS ( (), (dim2), (gran) )
      ORDER BY SUM(cnt)

    `,
    sane`
      SELECT dim2, gran, SUM(cnt)
      FROM (SELECT FLOOR(__time TO MONTH) AS gran, COALESCE(dim2, '') dim2, cnt FROM druid.foo) AS x
      GROUP BY GROUPING SETS ( (), (dim2), (gran) )
      ORDER BY SUM(cnt)
      LIMIT 1
    `,
    sane`
      SELECT dim1, dim2, COUNT(*) FROM druid.foo
      WHERE dim2 IN (SELECT dim1 FROM druid.foo WHERE dim1 <> '')
      AND dim1 <> 'xxx'
      group by dim1, dim2 ORDER BY dim2
    `,
    sane`
      SELECT dim1, dim2, COUNT(*) FROM druid.foo
      WHERE dim1 = 'xxx' OR dim2 IN (SELECT dim1 FROM druid.foo WHERE dim1 LIKE '%bc')
      group by dim1, dim2 ORDER BY dim2
    `,
    sane`
      SELECT __time, cnt, dim1, dim2 FROM druid.foo  WHERE (dim1, dim2) IN (   SELECT dim1, dim2 FROM (     SELECT dim1, dim2, COUNT(*)     FROM druid.foo     WHERE dim2 = 'abc'     GROUP BY dim1, dim2     HAVING COUNT(*) = 1   ) )
    `,
    sane`
      SELECT dim1, dim2 FROM druid.foo
       WHERE dim2 IN (
         SELECT dim2
         FROM druid.foo
         GROUP BY dim2
         ORDER BY dim2 DESC
       )
    `,
    sane`
      SELECT dim1, EXTRACT(MONTH FROM __time) FROM druid.foo
       WHERE dim2 IN (
         SELECT dim2
         FROM druid.foo
         WHERE dim1 = 'def'
       ) AND dim1 <> ''
    `,
    sane`
      SELECT COUNT(DISTINCT dim1), EXTRACT(MONTH FROM __time) FROM druid.foo
       WHERE dim2 IN (
         SELECT dim2
         FROM druid.foo
         WHERE dim1 = 'def'
       ) AND dim1 <> ''GROUP BY EXTRACT(MONTH FROM __time)
      ORDER BY EXTRACT(MONTH FROM __time)
    `,
    sane`
      SELECT DISTINCT __time FROM druid.foo WHERE __time IN (SELECT MAX(__time) FROM druid.foo)
    `,
    sane`
      SELECT DISTINCT __time FROM druid.foo WHERE __time NOT IN (SELECT MAX(__time) FROM druid.foo)
    `,
    sane`
      SELECT dim2, COUNT(*) FROM druid.foo WHERE substring(dim2, 1, 1) IN (SELECT substring(dim1, 1, 1) FROM druid.foo WHERE dim1 <> '')group by dim2
    `,
    sane`
      SELECT dim1, l.v from druid.foo f inner join lookup.lookyloo l on f.dim1 = l.k where f.dim2 is null
    `,
    sane`
      SELECT dim3, l.v, count(*) from druid.foo f inner join lookup.lookyloo l on f.dim3 = l.k group by 1, 2
    `,
    sane`
      SELECT COUNT(*) AS cnt FROM ( SELECT * FROM druid.foo LIMIT 10 ) tmpA
    `,
    sane`
      SELECT COUNT(*) AS cnt FROM ( SELECT * FROM druid.foo ) tmpA
    `,
    sane`
      select dim1 from (select dim1, dim2, count(*) cnt from druid.foo group by dim1, dim2 order by cnt)
    `,
    sane`
      select s / cnt, dim1, dim2, s from (select dim1, dim2, count(*) cnt, sum(m2) s from druid.foo group by dim1, dim2 order by cnt)
    `,
    sane`
      select dim1 from (select dim1, dim1, count(*) cnt from druid.foo group by dim1, dim1 order by cnt)
    `,
    sane`
      select copydim1 from (select dim1, dim1 AS copydim1, count(*) cnt from druid.foo group by dim1, dim1 order by cnt)
    `,
    sane`
      SELECT   cnt FROM (  SELECT     __time,     dim1,     COUNT(m2) AS cnt   FROM (    SELECT         __time,         m2,         dim1     FROM druid.foo     GROUP BY __time, m2, dim1   )   GROUP BY __time, dim1   ORDER BY cnt)
    `,
    sane`
      SELECT   FLOOR(__time TO YEAR),   SUM(m1),   SUM(m1) + SUM(m2) FROM   druid.foo WHERE   dim2 = 'a' GROUP BY FLOOR(__time TO YEAR) ORDER BY FLOOR(__time TO YEAR) desc
    `,
    sane`
      SELECT   AVG(m2),   SUM(m1) + SUM(m2) FROM   druid.foo WHERE   dim2 = 'a' GROUP BY m1 ORDER BY m1 LIMIT 5
    `,
    sane`
      SELECT CONCAT(dim1, '-', dim1, '_', dim1) as dimX FROM foo
    `,
    sane`
      SELECT CONCAt(dim1, CONCAt(dim2,'x'), m2, 9999, dim1) as dimX FROM foo
    `,
    sane`
      SELECT textcat(dim1, dim1) as dimX FROM foo
    `,
    sane`
      SELECT textcat(dim1, CAST(m2 as VARCHAR)) as dimX FROM foo
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT __time as t, floor(__time TO month) AS gran,
        cnt FROM druid.foo
      ) AS x
      WHERE t >= '2000-01-01' and t < '2002-01-01'GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT
        SUM(cnt),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS cnt FROM druid.foo WHERE __time >= '2000-01-01' GROUP BY dim2)
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE __time >= '2000-01-01' AND SUBSTRING(dim2, 1, 1) IN (
        SELECT SUBSTRING(dim1, 1, 1) FROM druid.foo
        WHERE dim1 <> '' AND __time >= '2000-01-01'
      )
    `,
    sane`
      SELECT SUM(cnt), gran FROM (
        SELECT __time as t, floor(__time TO month) AS gran,
        cnt FROM druid.foo
      ) AS x
      GROUP BY gran
      ORDER BY gran
    `,
    sane`
      SELECT
        SUM(cnt),
        COUNT(*)
      FROM (SELECT dim2, SUM(cnt) AS cnt FROM druid.foo GROUP BY dim2)
    `,
    sane`
      SELECT COUNT(*) FROM druid.foo
      WHERE SUBSTRING(dim2, 1, 1) IN (
        SELECT SUBSTRING(dim1, 1, 1) FROM druid.foo
        WHERE dim1 <> '' AND __time >= '2000-01-01'
      )
    `,
    sane`
      SELECT dim1 FROM numfoo WHERE f1 = 0.1 LIMIT 1
    `,
    sane`
      SELECT dim1 FROM numfoo WHERE d1 = 1.7 LIMIT 1
    `,
    sane`
      SELECT dim1 FROM numfoo WHERE l1 = 7 LIMIT 1
    `,
    sane`
      SELECT exp(count(*)) + 10, sin(pi / 6), cos(pi / 6), tan(pi / 6), cot(pi / 6),asin(exp(count(*)) / 2), acos(exp(count(*)) / 2), atan(exp(count(*)) / 2), atan2(exp(count(*)), 1) FROM druid.foo WHERE  dim2 = 0
    `,
    sane`
      SELECT RADIANS(m1 * 15)/DEGREES(m2) FROM numfoo WHERE dim1 = '1'
    `,
    sane`
      SELECT TIMESTAMPDIFF(DAY, TIMESTAMP '1999-01-01 00:00:00', __time),
      TIMESTAMPDIFF(DAY, __time, DATE '2001-01-01'),
      TIMESTAMPDIFF(HOUR, TIMESTAMP '1999-12-31 01:00:00', __time),
      TIMESTAMPDIFF(MINUTE, TIMESTAMP '1999-12-31 23:58:03', __time),
      TIMESTAMPDIFF(SECOND, TIMESTAMP '1999-12-31 23:59:03', __time),
      TIMESTAMPDIFF(MONTH, TIMESTAMP '1999-11-01 00:00:00', __time),
      TIMESTAMPDIFF(YEAR, TIMESTAMP '1996-11-01 00:00:00', __time),
      TIMESTAMPDIFF(QUARTER, TIMESTAMP '1996-10-01 00:00:00', __time),
      TIMESTAMPDIFF(WEEK, TIMESTAMP '1998-10-01 00:00:00', __time)
      FROM druid.foo
      LIMIT 2
    `,
    sane`
      SELECT CEIL(TIMESTAMP '2000-01-01 00:00:00' TO DAY),
      CEIL(TIMESTAMP '2000-01-01 01:00:00' TO DAY)
      FROM druid.foo
      LIMIT 1
    `,
    sane`
      SELECT NVL(dim2, dim1), COUNT(*) FROM druid.foo GROUP BY NVL(dim2, dim1)

    `,
    sane`
      SELECT concat(dim3, 'foo'), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT concat(dim3, 'foo'), SUM(cnt) FROM druid.numfoo where concat(dim3, 'foo') = 'bfoo' GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT concat(dim3, 'foo') FROM druid.numfoo
    `,
    sane`
      SELECT concat(dim3, '-lol-', dim3) FROM druid.numfoo
    `,
    sane`
      SELECT concat(dim3, 'foo') FROM druid.numfoo where concat(dim3, 'foo') = 'bfoo'
    `,
    sane`
      SELECT ARRAY[1,2] as arr, dim1 FROM foo LIMIT 1
    `,
    sane`
      SELECT ARRAY[CONCAT(dim1, 'word'),'up'] as arr, dim1 FROM foo LIMIT 5
    `,
    sane`
      SELECT ARRAY[CONCAT(dim3, 'word'),'up'] as arr, dim1 FROM foo LIMIT 5
    `,
    sane`
      SELECT dim3 FROM druid.numfoo WHERE MV_OVERLAP(dim3, ARRAY['a','b']) LIMIT 5
    `,
    sane`
      SELECT dim3 FROM druid.numfoo WHERE MV_OVERLAP(dim3, ARRAY[dim2]) LIMIT 5
    `,
    sane`
      SELECT dim3 FROM druid.numfoo WHERE MV_CONTAINS(dim3, ARRAY['a','b']) LIMIT 5
    `,
    sane`
      SELECT dim3 FROM druid.numfoo WHERE MV_CONTAINS(dim3, ARRAY['a']) LIMIT 5
    `,
    sane`
      SELECT dim3 FROM druid.numfoo WHERE MV_CONTAINS(dim3, ARRAY[dim2]) LIMIT 5
    `,
    sane`
      SELECT MV_SLICE(dim3, 1) FROM druid.numfoo
    `,
    sane`
      SELECT dim1, MV_LENGTH(dim3), SUM(cnt) FROM druid.numfoo GROUP BY 1, 2 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_APPEND(dim3, 'foo'), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_PREPEND('foo', dim3), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_TO_STRING(MV_PREPEND('foo', dim3), ','), MV_TO_STRING(MV_APPEND(dim3, 'foo'), ','), SUM(cnt) FROM druid.numfoo GROUP BY 1,2 ORDER BY 3 DESC
    `,
    sane`
      SELECT MV_CONCAT(dim3, dim3), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_OFFSET(dim3, 1), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_ORDINAL(dim3, 2), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_OFFSET_OF(dim3, 'b'), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_ORDINAL_OF(dim3, 'b'), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT MV_TO_STRING(dim3, ','), SUM(cnt) FROM druid.numfoo GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT STRING_TO_MV(CONCAT(MV_TO_STRING(dim3, ','), ',d'), ','), SUM(cnt) FROM druid.numfoo WHERE MV_LENGTH(dim3) > 0 GROUP BY 1 ORDER BY 2 DESC
    `,
    sane`
      SELECT
        dim1,  LEFT(dim1, 2),
        RIGHT(dim1, 2)
      FROM druid.foo
      GROUP BY dim1

    `,
    sane`
      SELECT dim1 FROM druid.foo GROUP BY dim1 ORDER BY dim1 DESC
    `,
    sane`
      SELECT dim1 FROM druid.foo GROUP BY dim1 ORDER BY dim1 DESC LIMIT 9
    `,
    sane`
      SELECT dim1 FROM druid.foo GROUP BY dim1 ORDER BY dim1 DESC LIMIT 2
    `,
    sane`
      SELECT dim1 FROM foo WHERE dim1 IN (SELECT dim1 FROM foo WHERE dim1 = '10.1')

    `,
    sane`
      SELECT REGEXP_LIKE('x', NULL)
    `,
    sane`
      SELECT REGEXP_LIKE('x', dim1) FROM foo
    `,
    sane`
      SELECT REGEXP_LIKE('x', 1) FROM foo
    `,
  ];

  it('all queries work', () => {
    let bad = 0;
    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        bad++;
        console.log(sql);
      }
    }

    expect(bad).toEqual(0);
  });
});
