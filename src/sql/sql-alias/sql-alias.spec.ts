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

import { SqlQuery, SqlRef } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlAlias', () => {
  describe('parses', () => {
    it('works in no alias case', () => {
      const sql = `SELECT city`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)!.getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": undefined,
          "as": undefined,
          "expression": SqlRef {
            "column": "city",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "keywords": Object {},
          "spacing": Object {},
          "type": "alias",
        }
      `);
    });

    it('works in basic case', () => {
      const sql = `SELECT city AS City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)!.getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": SqlRef {
            "column": "City",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "as": true,
          "expression": SqlRef {
            "column": "city",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "keywords": Object {
            "as": "AS",
          },
          "spacing": Object {
            "preAlias": " ",
            "preAs": " ",
          },
          "type": "alias",
        }
      `);
    });

    it('works with table prefix', () => {
      const sql = `SELECT tbl.city  As   City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)!.getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": SqlRef {
            "column": "City",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "as": true,
          "expression": SqlRef {
            "column": "city",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {
              "postTableDot": "",
              "preTableDot": "",
            },
            "table": "tbl",
            "tableQuotes": false,
            "type": "ref",
          },
          "keywords": Object {
            "as": "As",
          },
          "spacing": Object {
            "preAlias": "   ",
            "preAs": "  ",
          },
          "type": "alias",
        }
      `);
    });

    it('works without AS', () => {
      const sql = `SELECT tbl.city City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)!.getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": SqlRef {
            "column": "City",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "as": undefined,
          "expression": SqlRef {
            "column": "city",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {
              "postTableDot": "",
              "preTableDot": "",
            },
            "table": "tbl",
            "tableQuotes": false,
            "type": "ref",
          },
          "keywords": Object {},
          "spacing": Object {
            "preAlias": " ",
          },
          "type": "alias",
        }
      `);
    });
  });

  describe('changeAliasName', () => {
    const x = SqlRef.column('X').as('test');
    const y = SqlRef.column('Y').as();
    const z = SqlRef.column('Z').as(SqlRef.columnWithQuotes('test'));

    it('should work with undefined', () => {
      expect(String(x.changeAliasName(undefined))).toEqual('X');
    });

    it('should work with normal string', () => {
      expect(String(x.changeAliasName('hello'))).toEqual('X AS hello');
    });

    it('should preserve quotes', () => {
      expect(String(z.changeAliasName('hello'))).toEqual('Z AS "hello"');
    });

    it('should work with quotes if needed', () => {
      expect(String(x.changeAliasName('select'))).toEqual('X AS "select"');
    });

    it('should work with quotes if forced', () => {
      expect(String(x.changeAliasName('hello', true))).toEqual('X AS "hello"');
    });

    it('should work with adding a new alias', () => {
      expect(String(y.changeAliasName('hello'))).toEqual('Y AS hello');
    });
  });
});