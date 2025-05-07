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

import { backAndForth } from '../../test-utils';
import { SqlColumn, SqlExpression, SqlFunction, SqlKeyValue, SqlLiteral, SqlStar } from '..';
import { RefName, SeparatedArray, Separator } from '../helpers';

describe('SqlFunction', () => {
  describe('parsing various SQL functions', () => {
    it.each([
      `COUNT(*)`,
      `"COUNT"(*)`,
      `COUNT(DISTINCT blah)`,
      `COUNT(ALL blah)`,
      "position('b' in 'abc')",
      "position('' in 'abc')",
      "position('b' in 'abcabc' FROM 3)",
      "position('b' in 'abcabc' FROM 5)",
      "position('b' in 'abcabc' FROM 6)",
      "position('b' in 'abcabc' FROM -5)",
      // "position('b' in ('abcabc') FROM -5)", // ToDo: make this work, right now it parses as an IN statement
      "position('' in 'abc' FROM 3)",
      "position('' in 'abc' FROM 10)",
      "position(x'bb' in x'aabbcc')",
      "position(x'' in x'aabbcc')",
      "position(x'bb' in x'aabbccaabbcc' FROM 3)",
      "position(x'bb' in x'aabbccaabbcc' FROM 5)",
      "position(x'bb' in x'aabbccaabbcc' FROM 6)",
      "position(x'bb' in x'aabbccaabbcc' FROM -5)",
      "position(x'cc' in x'aabbccdd' FROM 2)",
      "position(x'' in x'aabbcc' FROM 3)",
      "position (x'' in x'aabbcc' FROM 10)",
      "trim(leading 'eh' from 'hehe__hehe')",
      "trim(trailing 'eh' from 'hehe__hehe')",
      "trim('eh' from 'hehe__hehe')",
      `"trim" ('eh' from 'hehe__hehe')`,
      `JSON_VALUE(my_json, '$.x')`,
      `JSON_VALUE(my_json, '$.x' RETURNING DOUBLE)`,
      `SomeFn("arg1" => "boo")`,
      `"SomeFn" ("arg1" => "boo")`,
      `"ext" .  "SomeFn" ("arg1" => "boo")`,
      `LOCAL(path => '/tmp/druid')`,
      `EXTERN(LOCAL("path" => '/tmp/druid'))`,
      `NESTED_AGG(TIME_FLOOR(t.__time, 'P1D'), COUNT(DISTINCT t."ip") AS "daily_unique", AVG("daily_unique"))`,
      `TABLE(extern('{...}', '{...}', '[...]'))`,
      `"TABLE" (extern('{...}', '{...}', '[...]'))`,
      `TABLE(extern('{...}', '{...}')) EXTEND (x VARCHAR, y BIGINT, z TYPE('COMPLEX<json>'))`,
      `TABLE(extern('{...}', '{...}'))  (x VARCHAR, y BIGINT, z TYPE('COMPLEX<json>'))`,
      `TABLE(extern('{...}', '{...}'))  EXTEND  (xs VARCHAR   ARRAY, ys BIGINT  ARRAY, zs DOUBLE  ARRAY)`,
      `SUM(COUNT(*)) OVER ()`,
      `SUM(COUNT(*))   Over  ("windowName"  Order by COUNT(*) Desc)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE UNBOUNDED PRECEDING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC ROWS 5 PRECEDING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE CURRENT ROW)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE 5 FOLLOWING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE UNBOUNDED FOLLOWING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE BETWEEN UNBOUNDED FOLLOWING AND CURRENT ROW)`,
      `count(*) over (partition by cityName order by countryName rows between unbounded preceding and 1 preceding)`,
      `PI`,
      `CURRENT_TIMESTAMP`,
      `UNNEST(t)`,
    ])('correctly parses: %s', sql => {
      backAndForth(sql, SqlFunction);
    });
  });

  it('is smart about clearing separators', () => {
    const sql = `EXTRACT(HOUR FROM "time")`;
    expect(String(SqlExpression.parse(sql).clearOwnSeparators())).toEqual(sql);
  });

  it('.isValidFunctionName', () => {
    expect(SqlFunction.isValidFunctionName('SUM')).toEqual(true);
    expect(SqlFunction.isValidFunctionName('TABLE')).toEqual(true);
  });

  it('.count', () => {
    expect(SqlFunction.count().toString()).toEqual('COUNT(*)');
    expect(
      SqlFunction.count(SqlStar.PLAIN).addWhere(SqlExpression.parse('x > 1')).toString(),
    ).toEqual('COUNT(*) FILTER (WHERE x > 1)');
    expect(
      SqlFunction.count(SqlStar.PLAIN).addWhere(SqlExpression.parse('TRUE')).toString(),
    ).toEqual('COUNT(*)');
  });

  it('.countDistinct', () => {
    const x = SqlExpression.parse('x');
    expect(SqlFunction.countDistinct(x).toString()).toEqual('COUNT(DISTINCT x)');
  });

  it('.cast', () => {
    expect(SqlFunction.cast(SqlExpression.parse('X'), 'BIGINT').toString()).toEqual(
      'CAST(X AS BIGINT)',
    );
  });

  it('.jsonValue', () => {
    expect(SqlFunction.jsonValue(SqlExpression.parse('X'), '$.x').toString()).toEqual(
      `JSON_VALUE(X, '$.x')`,
    );

    expect(SqlFunction.jsonValue(SqlExpression.parse('X'), '$.x', 'DOUBLE').toString()).toEqual(
      `JSON_VALUE(X, '$.x' RETURNING DOUBLE)`,
    );
  });

  describe('.jsonObject', () => {
    it('with no arguments', () => {
      expect(SqlFunction.jsonObject().toString()).toEqual('JSON_OBJECT()');
      expect(SqlFunction.jsonObject({}).toString()).toEqual('JSON_OBJECT()');
    });

    it('with object of key-value pairs', () => {
      expect(SqlFunction.jsonObject({ name: 'John', age: 30 }).toString()).toEqual(
        `JSON_OBJECT('name':'John', 'age':30)`,
      );
    });

    it('with nested object', () => {
      expect(
        SqlFunction.jsonObject({
          name: 'John',
          age: { years: 30, months: 1 },
          hobbies: ['skiing', 'sleeping'],
        }).toString(),
      ).toEqual(
        `JSON_OBJECT('name':'John', 'age':JSON_OBJECT('years':30, 'months':1), 'hobbies':ARRAY['skiing', 'sleeping'])`,
      );
    });

    it('with a single SqlKeyValue (longhand)', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('name'), SqlLiteral.create('John'));
      expect(SqlFunction.jsonObject(keyValue).toString()).toEqual(
        `JSON_OBJECT(KEY 'name' VALUE 'John')`,
      );
    });

    it('with a single SqlKeyValue (shorthand)', () => {
      const keyValue = SqlKeyValue.short(SqlLiteral.create('name'), SqlLiteral.create('John'));
      expect(SqlFunction.jsonObject(keyValue).toString()).toEqual(`JSON_OBJECT('name':'John')`);
    });

    it('with an array of SqlKeyValue objects (longhand)', () => {
      const keyValues = [
        SqlKeyValue.create(SqlLiteral.create('name'), SqlLiteral.create('John')),
        SqlKeyValue.create(SqlLiteral.create('age'), SqlLiteral.create(30)),
      ];
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        `JSON_OBJECT(KEY 'name' VALUE 'John', KEY 'age' VALUE 30)`,
      );
    });

    it('with an array of SqlKeyValue objects (shorthand)', () => {
      const keyValues = [
        SqlKeyValue.short(SqlLiteral.create('name'), SqlLiteral.create('John')),
        SqlKeyValue.short(SqlLiteral.create('age'), SqlLiteral.create(30)),
      ];
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        `JSON_OBJECT('name':'John', 'age':30)`,
      );
    });

    it('with mixed longhand and shorthand SqlKeyValue objects', () => {
      const keyValues = [
        SqlKeyValue.create(SqlLiteral.create('name'), SqlLiteral.create('John')),
        SqlKeyValue.short(SqlLiteral.create('age'), SqlLiteral.create(30)),
      ];
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        `JSON_OBJECT(KEY 'name' VALUE 'John', 'age':30)`,
      );
    });

    it('with SqlExpression keys and values', () => {
      const keyValues = SqlKeyValue.create(
        SqlExpression.parse('column_name'),
        SqlExpression.parse('column_value'),
      );
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        'JSON_OBJECT(KEY column_name VALUE column_value)',
      );
    });

    it('with complex expressions', () => {
      // Create complex expressions using the builder pattern
      const userId = SqlColumn.create('user').concat(SqlColumn.create('id'));
      const valueAsVarchar = SqlFunction.cast(SqlColumn.create('value'), 'VARCHAR');

      const keyValues = SqlKeyValue.short(userId, valueAsVarchar);

      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        'JSON_OBJECT("user" || "id":CAST("value" AS VARCHAR))',
      );
    });
  });

  it('.floor', () => {
    expect(SqlFunction.floor(SqlColumn.create('__time'), 'Hour').toString()).toEqual(
      'FLOOR("__time" TO Hour)',
    );
  });

  it('.arrayOfLiterals', () => {
    expect(SqlFunction.arrayOfLiterals(['a', 'b', 'c']).toString()).toEqual(`ARRAY['a', 'b', 'c']`);
  });

  it('.array', () => {
    expect(SqlFunction.array().toString()).toEqual(`ARRAY[]`);
    expect(SqlFunction.array('a', 'b', 'c').toString()).toEqual(`ARRAY['a', 'b', 'c']`);
    expect(SqlFunction.array(1, 2, 3).toString()).toEqual(`ARRAY[1, 2, 3]`);
    expect(
      SqlFunction.array(SqlColumn.create('col1'), SqlColumn.create('col2')).toString(),
    ).toEqual(`ARRAY["col1", "col2"]`);

    // Test the backward compatibility case
    expect(SqlFunction.array([] as any).toString()).toEqual(`ARRAY[]`);
    expect(SqlFunction.array(['x', 'y', 'z'] as any).toString()).toEqual(`ARRAY['x', 'y', 'z']`);
  });

  describe('.simple', () => {
    it('with string function name and array of args', () => {
      const args = [SqlLiteral.create('A'), null, 0, false];
      const simpleFunc = SqlFunction.simple('MY_FUNC', args);

      expect(simpleFunc.getEffectiveFunctionName()).toEqual('MY_FUNC');
      expect(simpleFunc.toString()).toEqual("MY_FUNC('A', NULL, 0, FALSE)");
    });

    it('with RefName function name and SeparatedArray of args', () => {
      const funcName = RefName.functionName('my_func');
      const args = SeparatedArray.fromArray([SqlLiteral.create('test')], Separator.COMMA);
      const simpleFunc = SqlFunction.simple(funcName, args);

      expect(simpleFunc.getEffectiveFunctionName()).toEqual('MY_FUNC');
      expect(simpleFunc.toString()).toEqual("my_func('test')");
    });

    it('with filter expression', () => {
      const filterExpr = SqlExpression.parse('x > 10');
      const simpleFunc = SqlFunction.simple('COUNT', [SqlStar.PLAIN], filterExpr);

      expect(simpleFunc.toString()).toEqual('COUNT(*) FILTER (WHERE x > 10)');
    });
  });

  describe('.decorated', () => {
    it('with decorator and array of args', () => {
      const args = [SqlColumn.create('user_id')];
      const decoratedFunc = SqlFunction.decorated('COUNT', 'DISTINCT', args);

      expect(decoratedFunc.getEffectiveDecorator()).toEqual('DISTINCT');
      expect(decoratedFunc.toString()).toEqual('COUNT(DISTINCT "user_id")');
    });

    it('with undefined decorator', () => {
      const args = [SqlLiteral.create(42)];
      const decoratedFunc = SqlFunction.decorated('ABS', undefined, args);

      expect(decoratedFunc.getEffectiveDecorator()).toBeUndefined();
      expect(decoratedFunc.toString()).toEqual('ABS(42)');
    });

    it('with filter expression', () => {
      const args = [SqlColumn.create('revenue')];
      const filterExpr = SqlExpression.parse('country = "US"');
      const decoratedFunc = SqlFunction.decorated('SUM', 'DISTINCT', args, filterExpr);

      expect(decoratedFunc.toString()).toEqual(
        'SUM(DISTINCT "revenue") FILTER (WHERE country = "US")',
      );
    });
  });

  it('Function without args', () => {
    const sql = `FN()`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": undefined,
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "FN",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('Simple function', () => {
    const sql = `SUM(A)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('function in brackets', () => {
    const sql = `(  SUM(A))`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": Array [
          Object {
            "leftSpacing": "  ",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('function with expression', () => {
    const sql = `SUM( 1 + 2 AND 3 + 2)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "AND",
                  },
                ],
                "values": Array [
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "+",
                        },
                      ],
                      "values": Array [
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "1",
                          "type": "literal",
                          "value": 1,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "+",
                        },
                      ],
                      "values": Array [
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "3",
                          "type": "literal",
                          "value": 3,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('function with weird spacing ', () => {
    const sql = `SUM( A      )`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "      ",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('function in expression', () => {
    const sql = `Sum(A) OR SUM(B) AND SUM(c) * 4`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
            SqlFunction {
              "args": SeparatedArray {
                "separators": Array [],
                "values": Array [
                  SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "A",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                ],
              },
              "decorator": undefined,
              "extendClause": undefined,
              "functionName": RefName {
                "name": "Sum",
                "quotes": false,
              },
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "spacing": Object {
                "postArguments": "",
                "postLeftParen": "",
                "preLeftParen": "",
              },
              "specialParen": undefined,
              "type": "function",
              "whereClause": undefined,
              "windowSpec": undefined,
            },
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "AND",
                  },
                ],
                "values": Array [
                  SqlFunction {
                    "args": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlColumn {
                          "keywords": Object {},
                          "parens": undefined,
                          "refName": RefName {
                            "name": "B",
                            "quotes": false,
                          },
                          "spacing": Object {},
                          "table": undefined,
                          "type": "column",
                        },
                      ],
                    },
                    "decorator": undefined,
                    "extendClause": undefined,
                    "functionName": RefName {
                      "name": "SUM",
                      "quotes": false,
                    },
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "spacing": Object {
                      "postArguments": "",
                      "postLeftParen": "",
                      "preLeftParen": "",
                    },
                    "specialParen": undefined,
                    "type": "function",
                    "whereClause": undefined,
                    "windowSpec": undefined,
                  },
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "*",
                        },
                      ],
                      "values": Array [
                        SqlFunction {
                          "args": SeparatedArray {
                            "separators": Array [],
                            "values": Array [
                              SqlColumn {
                                "keywords": Object {},
                                "parens": undefined,
                                "refName": RefName {
                                  "name": "c",
                                  "quotes": false,
                                },
                                "spacing": Object {},
                                "table": undefined,
                                "type": "column",
                              },
                            ],
                          },
                          "decorator": undefined,
                          "extendClause": undefined,
                          "functionName": RefName {
                            "name": "SUM",
                            "quotes": false,
                          },
                          "keywords": Object {},
                          "namespace": undefined,
                          "parens": undefined,
                          "spacing": Object {
                            "postArguments": "",
                            "postLeftParen": "",
                            "preLeftParen": "",
                          },
                          "specialParen": undefined,
                          "type": "function",
                          "whereClause": undefined,
                          "windowSpec": undefined,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "4",
                          "type": "literal",
                          "value": 4,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "*",
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('function with filter', () => {
    const sql = `Sum(A) Filter (WHERE val > 1)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Sum",
          "quotes": false,
        },
        "keywords": Object {
          "filter": "Filter",
        },
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postFilter": " ",
          "postLeftParen": "",
          "preFilter": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": SqlWhereClause {
          "expression": SqlComparison {
            "decorator": undefined,
            "keywords": Object {
              "op": ">",
            },
            "lhs": SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "val",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
            "op": ">",
            "parens": undefined,
            "rhs": SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "spacing": Object {
              "postOp": " ",
              "preOp": " ",
            },
            "type": "comparison",
          },
          "keywords": Object {
            "where": "WHERE",
          },
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "spacing": Object {
            "postWhere": " ",
          },
          "type": "whereClause",
        },
        "windowSpec": undefined,
      }
    `);
  });

  it('Function with decorator and expression', () => {
    const sql = `Count(Distinct 1 + 2 AND 3 + 2)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "AND",
                  },
                ],
                "values": Array [
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "+",
                        },
                      ],
                      "values": Array [
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "1",
                          "type": "literal",
                          "value": 1,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "+",
                        },
                      ],
                      "values": Array [
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "3",
                          "type": "literal",
                          "value": 3,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "decorator": "DISTINCT",
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Count",
          "quotes": false,
        },
        "keywords": Object {
          "decorator": "Distinct",
        },
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postDecorator": " ",
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('Function with decorator and extra space', () => {
    const sql = `Count( Distinct 1 + 2 AND 3 + 2)`;

    backAndForth(sql);
  });

  it('CAST function', () => {
    const sql = `Cast( x AS Thing)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "AS",
            },
          ],
          "values": Array [
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "x",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
            SqlType {
              "keywords": Object {
                "type": "Thing",
              },
              "parens": undefined,
              "spacing": Object {},
              "type": "type",
              "value": "THING",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Cast",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('Trim function', () => {
    const sql = `Trim( Both A and B FROM D)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "FROM",
            },
          ],
          "values": Array [
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "and",
                  },
                ],
                "values": Array [
                  SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "A",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "B",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "D",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": "BOTH",
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Trim",
          "quotes": false,
        },
        "keywords": Object {
          "decorator": "Both",
        },
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postDecorator": " ",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('TABLE with EXTEND', () => {
    const sql = `TABLE(extern('{...}', '{...}')) EXTEND(x VARCHAR, y BIGINT, "z"  TYPE('COMPLEX<json>'))`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlFunction {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": "",
                    "right": " ",
                    "separator": ",",
                  },
                ],
                "values": Array [
                  SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "'{...}'",
                    "type": "literal",
                    "value": "{...}",
                  },
                  SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "'{...}'",
                    "type": "literal",
                    "value": "{...}",
                  },
                ],
              },
              "decorator": undefined,
              "extendClause": undefined,
              "functionName": RefName {
                "name": "extern",
                "quotes": false,
              },
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "spacing": Object {
                "postArguments": "",
                "postLeftParen": "",
                "preLeftParen": "",
              },
              "specialParen": undefined,
              "type": "function",
              "whereClause": undefined,
              "windowSpec": undefined,
            },
          ],
        },
        "decorator": undefined,
        "extendClause": SqlExtendClause {
          "columnDeclarations": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumnDeclaration {
                "column": RefName {
                  "name": "x",
                  "quotes": false,
                },
                "columnType": SqlType {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "type",
                  "value": "VARCHAR",
                },
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postColumn": " ",
                },
                "type": "columnDeclaration",
              },
              SqlColumnDeclaration {
                "column": RefName {
                  "name": "y",
                  "quotes": false,
                },
                "columnType": SqlType {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "type",
                  "value": "BIGINT",
                },
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postColumn": " ",
                },
                "type": "columnDeclaration",
              },
              SqlColumnDeclaration {
                "column": RefName {
                  "name": "z",
                  "quotes": true,
                },
                "columnType": SqlType {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "type",
                  "value": "TYPE('COMPLEX<json>')",
                },
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postColumn": "  ",
                },
                "type": "columnDeclaration",
              },
            ],
          },
          "keywords": Object {
            "extend": "EXTEND",
          },
          "parens": undefined,
          "spacing": Object {
            "postColumnDeclarations": "",
            "postExtend": "",
            "postLeftParen": "",
          },
          "type": "extendClause",
        },
        "functionName": RefName {
          "name": "TABLE",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preExtend": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('array works with array or numbers', () => {
    const sql = `Array [ 1, 2, 3  ]`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "3",
              "type": "literal",
              "value": 3,
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Array",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "  ",
          "postLeftParen": " ",
          "preLeftParen": " ",
        },
        "specialParen": "square",
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  it('array works with array or strings', () => {
    const sql = `Array['1', u&'a', ']']`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "'1'",
              "type": "literal",
              "value": "1",
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "u&'a'",
              "type": "literal",
              "value": "a",
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "']'",
              "type": "literal",
              "value": "]",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Array",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": "square",
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  describe('#getArg', () => {
    const fn = SqlExpression.parse(`BLAH(t."lol", 1, hello => "world")`) as SqlFunction;

    it('works with number', () => {
      expect(String(fn.getArg(0))).toEqual(`t."lol"`);
      expect(String(fn.getArg(1))).toEqual(`1`);
      expect(String(fn.getArg(-1))).toEqual(`hello => "world"`);
      expect(fn.getArg(7)).toBeUndefined();
    });

    it('works with label', () => {
      expect(String(fn.getArg('hello'))).toEqual(`"world"`);
      expect(fn.getArg('blah')).toBeUndefined();
    });
  });

  describe('#changeWhereExpression', () => {
    it('changes', () => {
      const fn = SqlExpression.parse(
        `SUM(t."lol") FILTER (WHERE t."country" = 'USA')`,
      ) as SqlFunction;

      expect(String(fn.changeWhereExpression(SqlExpression.parse(`t."country" = 'UK'`)))).toEqual(
        'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
      );
    });

    it('adds', () => {
      const fn = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;

      expect(String(fn.changeWhereExpression(SqlExpression.parse(`t."country" = 'UK'`)))).toEqual(
        'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
      );
    });
  });

  describe('#addWhere', () => {
    it('adds when something already exists', () => {
      const fn = SqlExpression.parse(
        `SUM(t."lol") FILTER (WHERE t."country" = 'USA' OR t."city" = 'SF')`,
      ) as SqlFunction;

      expect(String(fn.addWhere(SqlExpression.parse(`t."browser" = 'Chrome'`)))).toEqual(
        `SUM(t."lol") FILTER (WHERE (t."country" = 'USA' OR t."city" = 'SF') AND t."browser" = 'Chrome')`,
      );
    });

    it('adds when nothing exists', () => {
      const fn = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;

      expect(
        String(fn.changeWhereExpression(SqlExpression.parse(`t."browser" = 'Chrome'`))),
      ).toEqual('SUM(t."lol") FILTER (WHERE t."browser" = \'Chrome\')');
    });

    it('noop on NULL', () => {
      const fn = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;

      expect(String(fn.addWhere(SqlExpression.parse(`TRUE`)))).toEqual('SUM(t."lol")');
    });
  });
});
