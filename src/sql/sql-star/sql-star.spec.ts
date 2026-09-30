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

import { SqlQuery, SqlStar, SqlTable } from '../..';
import { backAndForth } from '../../test-utils';
import { SqlExpression } from '../sql-expression';

function parseStar(sql: string): SqlStar {
  return SqlQuery.parse(`SELECT ${sql}`).getSelectExpressionForIndex(0) as SqlStar;
}

describe('SqlStar', () => {
  describe('parses', () => {
    it.each([
      'SELECT *',
      `SELECT hello. *`,
      `SELECT "hello" . *`,
      `SELECT """hello""".*`,
      `SELECT "a""b".*`,
      `SELECT a . b . *`,
      `SELECT "a""b".c.*`,
    ])('correctly parses: %s', sql => {
      backAndForth(sql);
    });

    it('without quotes + namespace', () => {
      const sql = `SELECT hello . "world" . *`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": undefined,
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postDot": " ",
                  "postTable": " ",
                },
                "table": SqlTable {
                  "keywords": Object {},
                  "namespace": SqlNamespace {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "hello",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "namespace",
                  },
                  "parens": undefined,
                  "refName": RefName {
                    "name": "world",
                    "quotes": true,
                  },
                  "spacing": Object {
                    "postDot": " ",
                    "postNamespace": " ",
                  },
                  "type": "table",
                },
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });
  });

  describe('.PLAIN', () => {
    it('is a star without a table', () => {
      expect(String(SqlStar.PLAIN)).toEqual('*');
      expect(SqlStar.PLAIN.table).toBeUndefined();
    });
  });

  describe('.create', () => {
    it('makes a star with or without a table', () => {
      expect(String(SqlStar.create())).toEqual('*');
      expect(String(SqlStar.create(SqlTable.create('t')))).toEqual('"t".*');
    });
  });

  describe('#changeTable', () => {
    it('sets a table', () => {
      expect(String(SqlStar.PLAIN.changeTable(SqlTable.optionalQuotes('t')))).toEqual('t.*');
    });

    it('replaces the table and keeps the spacing', () => {
      expect(String(parseStar('a . *').changeTable(SqlTable.optionalQuotes('b')))).toEqual('b . *');
    });

    it('removes the table along with its spacing', () => {
      const changed = parseStar('a . *').changeTable(undefined);
      expect(String(changed)).toEqual('*');
      expect(changed.table).toBeUndefined();
      expect(changed.spacing).toEqual({});
    });
  });

  describe('#getTableName', () => {
    it('returns the table name when there is one', () => {
      expect(parseStar('ns.t.*').getTableName()).toEqual('t');
      expect(parseStar('*').getTableName()).toBeUndefined();
    });
  });

  describe('#changeTableName', () => {
    it('renames an existing table and keeps its namespace and quoting', () => {
      expect(String(parseStar('ns.t.*').changeTableName('u'))).toEqual('ns.u.*');
    });

    it('creates a table when there is none', () => {
      expect(String(parseStar('*').changeTableName('t'))).toEqual('"t".*');
    });

    it('removes the table when given undefined', () => {
      expect(String(parseStar('t.*').changeTableName(undefined))).toEqual('*');
    });
  });

  describe('#prettyTrim', () => {
    it('trims the table and namespace names', () => {
      expect(String(parseStar('abcdefghij.klmnopqrst.*').prettyTrim(6))).toEqual(
        '"abc..."."klm...".*',
      );
    });

    it('returns a star without a table as is', () => {
      expect(SqlStar.PLAIN.prettyTrim(6)).toBe(SqlStar.PLAIN);
    });
  });
});
