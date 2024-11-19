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

import { backAndForth } from "../../test-utils";
import { RefName, SqlAlias, SqlColumn, SqlQuery } from "..";

describe("SqlAlias", () => {
  describe("parses", () => {
    it("works in no alias case", () => {
      const sql = `SELECT city`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0))
        .toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "city",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        }
      `);
    });

    it("works in basic case", () => {
      const sql = `SELECT city AS City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0))
        .toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
          },
          "keywords": Object {
            "as": "AS",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": " ",
            "preAs": " ",
          },
          "type": "alias",
        }
      `);
    });

    it("works with table prefix", () => {
      const sql = `SELECT tbl.city  As   City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0))
        .toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {
              "postDot": "",
              "postTable": "",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "tbl",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "column",
          },
          "keywords": Object {
            "as": "As",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": "   ",
            "preAs": "  ",
          },
          "type": "alias",
        }
      `);
    });

    it("works without AS", () => {
      const sql = `SELECT tbl.city City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0))
        .toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {
              "postDot": "",
              "postTable": "",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "tbl",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "column",
          },
          "keywords": Object {
            "as": "",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": " ",
          },
          "type": "alias",
        }
      `);
    });
  });

  describe(".create", () => {
    expect(
      SqlAlias.create(
        SqlAlias.create(SqlColumn.create("X"), "name1"),
        "name2"
      ).toString()
    ).toEqual('"X" AS "name2"');
  });

  describe("#changeAlias", () => {
    const x = SqlAlias.create(SqlColumn.optionalQuotes("X"), "test");
    const z = SqlAlias.create(
      SqlColumn.optionalQuotes("Z"),
      RefName.create("test", true)
    );

    it("should work with normal string", () => {
      expect(String(x.changeAlias("hello"))).toEqual('X AS "hello"');
    });

    it("should preserve quotes", () => {
      expect(String(z.changeAlias("hello"))).toEqual('Z AS "hello"');
    });

    it("should work with quotes if needed", () => {
      expect(String(x.changeAlias("select"))).toEqual('X AS "select"');
    });

    it("should work with quotes if forced", () => {
      expect(String(x.changeAlias("hello", true))).toEqual('X AS "hello"');
    });
  });
});
