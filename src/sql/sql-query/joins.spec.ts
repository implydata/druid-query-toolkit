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

import { parseSqlExpression, parseSqlQuery, SqlJoinPart, SqlRef } from '../..';
import { backAndForth, sane } from '../../test-utils';

describe('parse join with lookup', () => {
  it('parses a basic math expression', () => {
    backAndForth(sane`
      SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName
    `);
  });

  it('parses CROSS JOIN', () => {
    const sql = sane`
      SELECT
        "channel", lookup.lang.v,
        COUNT(*) AS "Count"
      FROM "wikipedia_k" CROSS JOIN lookup.lang
      GROUP BY 1, 2
      ORDER BY "Count" DESC
    `;

    backAndForth(sql);
  });

  it.skip('parses USING', () => {
    const sql = sane`
      SELECT
        "channel", lookup.lang.v,
        COUNT(*) AS "Count"
      FROM "wikipedia_k" USING (k)
      GROUP BY 1, 2
      ORDER BY "Count" DESC
    `;

    backAndForth(sql);
  });
});

describe('Add Join', () => {
  it('Add left join', () => {
    expect(
      parseSqlQuery(`SELECT countryName from wikipedia`)
        .addJoin(
          SqlJoinPart.factory(
            'LEFT',
            SqlRef.factory('country', 'lookup'),
            parseSqlExpression('lookup.country.v = wikipedia.countryName'),
          ),
        )
        .toString(),
    ).toMatchInlineSnapshot(
      `"SELECT countryName from wikipedia LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName"`,
    );
  });

  it('Add inner join', () => {
    expect(
      parseSqlQuery(`SELECT countryName from wikipedia`)
        .addJoin(
          SqlJoinPart.factory(
            'INNER',
            SqlRef.factory('country', 'lookup'),
            parseSqlExpression('lookup.country.v = wikipedia.countryName'),
          ),
        )
        .toString(),
    ).toMatchInlineSnapshot(
      `"SELECT countryName from wikipedia INNER JOIN lookup.country ON lookup.country.v = wikipedia.countryName"`,
    );
  });
});

describe('Remove join', () => {
  it('Remove Join', () => {
    expect(
      parseSqlQuery(sane`
        SELECT countryName from wikipedia
        LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `)
        .removeAllJoins()
        .toString(),
    ).toMatchInlineSnapshot(`"SELECT countryName from wikipedia"`);
  });
});

/*
describe('Check if column is in On expression', () => {
  it('is contained 1', () => {
    expect(
      (parseSqlQuery(sane`
        SELECT countryName
        from wikipedia LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `).onExpression as SqlExpression).containsColumn('v'),
    ).toEqual(true);
  });

  it('is contained 2', () => {
    expect(
      (parseSqlQuery(sane`
        SELECT countryName
        from wikipedia LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `).onExpression as SqlExpression).containsColumn('countryName'),
    ).toEqual(true);
  });

  it('is not contained', () => {
    expect(
      (parseSqlQuery(sane`
        SELECT countryName
        from wikipedia LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `).onExpression as SqlExpression).containsColumn('k'),
    ).toEqual(false);
  });
});
*/
