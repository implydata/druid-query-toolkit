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

import { N, SqlColumn, SqlExpression, SqlJoinPart, SqlQuery } from '../..';
import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';

describe('SqlQuery (joins)', () => {
  describe('parses', () => {
    it('parses a left join', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        Left JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0]!.joinType).toEqual('LEFT');
    });

    it('parses a left outer join', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        Left OUTER JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0]!.joinType).toEqual('LEFT');
    });

    it('parses a right outer join', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        Right OUTER JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0]!.joinType).toEqual('RIGHT');
    });

    it('parses a full outer join', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        FULL OUTER JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0]!.joinType).toEqual('FULL');
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
  });

  describe('#hasJoin', () => {
    it('tells if the FROM clause has a join', () => {
      expect(
        SqlQuery.parse(
          `SELECT * FROM wikipedia LEFT JOIN lookup.country ON v = countryName`,
        ).hasJoin(),
      ).toEqual(true);
      expect(SqlQuery.parse(`SELECT * FROM wikipedia`).hasJoin()).toEqual(false);
    });

    it('is false when there is no FROM clause', () => {
      expect(SqlQuery.parse(`SELECT 1`).hasJoin()).toEqual(false);
    });
  });

  describe('#getJoins', () => {
    it('returns the join parts', () => {
      expect(
        SqlQuery.parse(`SELECT * FROM wikipedia LEFT JOIN a ON a.k = x INNER JOIN b ON b.k = x`)
          .getJoins()
          .map(String),
      ).toEqual(['LEFT JOIN a ON a.k = x', 'INNER JOIN b ON b.k = x']);
    });

    it('returns nothing when there is no FROM clause', () => {
      expect(SqlQuery.parse(`SELECT 1`).getJoins()).toEqual([]);
    });
  });

  describe('#addJoin', () => {
    it('does nothing when there is no FROM clause', () => {
      const query = SqlQuery.parse(`SELECT 1`);

      expect(query.addJoin(SqlJoinPart.cross(N('lookup').table('country')))).toBe(query);
    });

    it('adds a left join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addJoin(
            SqlJoinPart.create(
              'LEFT',
              N('lookup').table('country'),
              SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
            ),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        LEFT JOIN \\"lookup\\".\\"country\\" ON lookup.country.v = wikipedia.countryName"
      `);
    });

    it('adds a natural left join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addJoin(SqlJoinPart.natural('LEFT', N('lookup').table('country')))
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        NATURAL LEFT JOIN \\"lookup\\".\\"country\\""
      `);
    });
  });

  describe('#addLeftJoin', () => {
    it('adds a left join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addLeftJoin(
            N('lookup').table('country'),
            SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        LEFT JOIN \\"lookup\\".\\"country\\" ON lookup.country.v = wikipedia.countryName"
      `);
    });
  });

  describe('#addRightJoin', () => {
    it('adds a right join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addRightJoin(
            N('lookup').table('country'),
            SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        RIGHT JOIN \\"lookup\\".\\"country\\" ON lookup.country.v = wikipedia.countryName"
      `);
    });
  });

  describe('#addInnerJoin', () => {
    it('adds an inner join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addInnerJoin(
            SqlColumn.optionalQuotes('country', 'lookup'),
            SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        INNER JOIN lookup.country ON lookup.country.v = wikipedia.countryName"
      `);
    });
  });

  describe('#addFullJoin', () => {
    it('adds a full join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addFullJoin(
            N('lookup').table('country'),
            SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        FULL JOIN \\"lookup\\".\\"country\\" ON lookup.country.v = wikipedia.countryName"
      `);
    });
  });

  describe('#addCrossJoin', () => {
    it('adds a cross join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addCrossJoin(N('lookup').table('country'))
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        CROSS JOIN \\"lookup\\".\\"country\\""
      `);
    });
  });

  describe('#removeAllJoins', () => {
    it('does nothing when there is no FROM clause', () => {
      const query = SqlQuery.parse(`SELECT 1`);

      expect(query.removeAllJoins()).toBe(query);
    });

    it('removes the join', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT countryName from wikipedia
          LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName
        `,
        )
          .removeAllJoins()
          .toString(),
      ).toMatchInlineSnapshot(`"SELECT countryName from wikipedia"`);
    });
  });
});
