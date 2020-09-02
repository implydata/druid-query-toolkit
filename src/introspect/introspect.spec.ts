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

  it('.decodeTableColumnIntrospectionResult', () => {
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

    expect(Introspect.decodeTableIntrospectionResult(emptyQueryResult)).toEqual([]);
  });

  it('.decodeTableColumnIntrospectionResult', () => {
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

    expect(Introspect.decodeTableColumnIntrospectionResult(emptyQueryResult)).toEqual([]);
  });

  it('.decodeQueryColumnIntrospectionResult', () => {
    const query = SqlQuery.parse(sane`
      SELECT
        cityName, COUNT(*) AS "Count"
      FROM wikipedia
      GROUP BY 1
      ORDER BY 2 DESC
    `);

    const queryResult = new QueryResult({
      sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
      header: [{ name: 'PLAN' }],
      rows: [
        [
          'DruidQueryRel(query=[{"queryType":"groupBy","dataSource":{"type":"table","name":"wikipedia"},"intervals":{"type":"intervals","intervals":["-146136543-09-08T08:23:32.096Z/146140482-04-24T15:36:27.903Z"]},"virtualColumns":[],"filter":null,"granularity":{"type":"all"},"dimensions":[{"type":"default","dimension":"cityName","outputName":"d0","outputType":"STRING"}],"aggregations":[{"type":"count","name":"a0"}],"postAggregations":[],"having":null,"limitSpec":{"type":"default","columns":[{"dimension":"a0","direction":"descending","dimensionOrder":{"type":"numeric"}}],"limit":2147483647},"context":{"populateCache":false,"sqlQueryId":"d99b39ec-c005-4208-9bb3-7d9755c7a4f5","useApproximateCountDistinct":false,"useCache":false},"descending":false}], signature=[{d0:STRING, a0:LONG}])\n',
        ],
      ],
    });

    expect(Introspect.decodeQueryColumnIntrospectionResult(queryResult)).toEqual([
      {
        name: 'cityName',
        type: 'STRING',
      },
      {
        name: 'Count',
        type: 'LONG',
      },
    ]);

    expect(Introspect.decodeQueryColumnIntrospectionResult(emptyQueryResult)).toEqual([]);
  });
});
