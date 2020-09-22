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

import { Introspect, QueryResult, SqlQuery } from '..';
import { sane } from '../test-utils';

describe('Introspect', () => {
  const emptyQueryResult = new QueryResult({
    header: [],
    rows: [],
  });

  describe('.decodeTableIntrospectionResult', () => {
    it('works', () => {
      const queryResult = new QueryResult({
        header: [{ name: 'TABLE_NAME' }],
        rows: [['wikipedia'], ['github']],
      });

      expect(Introspect.decodeTableIntrospectionResult(queryResult)).toEqual([
        {
          name: 'wikipedia',
        },
        {
          name: 'github',
        },
      ]);
    });

    it('works with empty result', () => {
      expect(Introspect.decodeTableIntrospectionResult(emptyQueryResult)).toEqual([]);
    });
  });

  describe('.decodeTableColumnIntrospectionResult', () => {
    it('works', () => {
      const queryResult = new QueryResult({
        header: [{ name: 'COLUMN_NAME' }, { name: 'DATA_TYPE' }],
        rows: [
          ['__time', 'TIMESTAMP'],
          ['channel', 'VARCHAR'],
          ['cityName', 'VARCHAR'],
          ['comment', 'VARCHAR'],
          ['count', 'BIGINT'],
          ['sum_delta', 'BIGINT'],
          ['sum_deltaBucket', 'BIGINT'],
          ['user', 'VARCHAR'],
        ],
      });

      expect(Introspect.decodeTableColumnIntrospectionResult(queryResult)).toEqual([
        {
          name: '__time',
          type: 'TIMESTAMP',
        },
        {
          name: 'channel',
          type: 'VARCHAR',
        },
        {
          name: 'cityName',
          type: 'VARCHAR',
        },
        {
          name: 'comment',
          type: 'VARCHAR',
        },
        {
          name: 'count',
          type: 'BIGINT',
        },
        {
          name: 'sum_delta',
          type: 'BIGINT',
        },
        {
          name: 'sum_deltaBucket',
          type: 'BIGINT',
        },
        {
          name: 'user',
          type: 'VARCHAR',
        },
      ]);
    });

    it('works with empty result', () => {
      expect(Introspect.decodeTableColumnIntrospectionResult(emptyQueryResult)).toEqual([]);
    });
  });

  describe('.decodeColumnTypesFromPlan', () => {
    it('works', () => {
      const queryPlanResult = new QueryResult({
        header: [{ name: 'PLAN' }],
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:STRING, a0:LONG}])\n']],
      });

      expect(Introspect.decodeColumnTypesFromPlan(queryPlanResult)).toEqual(['STRING', 'LONG']);
    });

    it('works with empty result', () => {
      expect(Introspect.decodeColumnTypesFromPlan(emptyQueryResult)).toEqual([]);
    });
  });

  describe('.getQueryColumnSampleQuery', () => {
    expect(
      String(
        Introspect.getQueryColumnSampleQuery(
          SqlQuery.parse(sane`
            SELECT added + 1, * FROM "wikipedia"
          `),
        ),
      ),
    ).toEqual(sane`
      SELECT added + 1, * FROM "wikipedia"
      LIMIT 1
    `);
  });

  describe('.decodeQueryColumnIntrospectionResult', () => {
    it('works with empty result', () => {
      expect(Introspect.decodeQueryColumnIntrospectionResult(emptyQueryResult)).toEqual([]);
    });

    it('works with all columns having good names', () => {
      const query = SqlQuery.parse(sane`
        SELECT
          __time,
          cityName,
          COUNT(*) AS "Count"
        FROM wikipedia
        GROUP BY 1
        ORDER BY 2 DESC
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: [{ name: 'PLAN' }],
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:LONG, d1:STRING, a0:LONG}])\n']],
      });

      expect(Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult)).toEqual([
        {
          name: '__time',
          type: 'TIMESTAMP',
        },
        {
          name: 'cityName',
          type: 'STRING',
        },
        {
          name: 'Count',
          type: 'LONG',
        },
      ]);
    });

    it('works with some column not having good names', () => {
      const query = SqlQuery.parse(sane`
        SELECT
          cityName,
          COUNT(*)
        FROM wikipedia
        GROUP BY 1
        ORDER BY 2 DESC
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: [{ name: 'PLAN' }],
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:STRING, a0:LONG}])\n']],
      });

      expect(Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult)).toEqual([
        {
          name: 'cityName',
          type: 'STRING',
        },
      ]);
    });

    it('fails with star without sample', () => {
      const query = SqlQuery.parse(sane`
        SELECT cityName, * FROM wikipedia
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: [{ name: 'PLAN' }],
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:STRING, a0:LONG, a1:LONG}])\n']],
      });

      expect(() => Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult)).toThrow(
        'a query with a star must have sampleRowResult set',
      );
    });

    it('works with star', () => {
      const query = SqlQuery.parse(sane`
        SELECT "time", cityName, added + 1, * FROM wikipedia
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: [{ name: 'PLAN' }],
        rows: [
          [
            'DruidQueryRel(query=[...\n...], signature=[{d0:LONG, d1:STRING, a0:LONG, a1:LONG, a1:LONG}])\n',
          ],
        ],
      });

      const sampleResult = new QueryResult({
        header: [
          { name: 'time' },
          { name: 'cityName' },
          { name: 'EXPR$0' },
          { name: 'delta' },
          { name: 'deleted' },
        ],
        rows: [[new Date('2020-01-01T00:00:00'), 'SF', 1, 4, true]],
      });

      expect(
        Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult, sampleResult),
      ).toEqual([
        {
          name: 'time',
          type: 'TIMESTAMP',
        },
        {
          name: 'cityName',
          type: 'STRING',
        },
        {
          name: 'delta',
          type: 'LONG',
        },
        {
          name: 'deleted',
          type: 'BOOLEAN',
        },
      ]);
    });
  });
});
