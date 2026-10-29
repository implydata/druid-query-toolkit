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

import type { SqlKeyValue } from '../..';
import { SqlColonAccess, SqlColumn, SqlExpression, SqlFunction, SqlMulti, SqlUnary } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlColonAccess', () => {
  describe('parses', () => {
    it('parses every kind of segment', () => {
      backAndForth('v:a', SqlColonAccess);
      backAndForth('v:a.b', SqlColonAccess);
      backAndForth('v:a.b.c', SqlColonAccess);
      backAndForth("v:['field name']", SqlColonAccess);
      backAndForth("v:[U&'f\\00e9e']", SqlColonAccess);
      backAndForth('v:[0]', SqlColonAccess);
      backAndForth("v:a['b'][0].c", SqlColonAccess);
      backAndForth("v:[0]['x'].y", SqlColonAccess);
      backAndForth('v:"from"."a b"', SqlColonAccess);
    });

    it('parses different bases', () => {
      backAndForth('t.v:a', SqlColonAccess);
      backAndForth('"s"."t"."v":a', SqlColonAccess);
      backAndForth('PARSE_JSON(x):a', SqlColonAccess);
      backAndForth('(a || b):c', SqlColonAccess);
      backAndForth('(v:a):b', SqlColonAccess);
      backAndForth("CASE WHEN x THEN v ELSE w END:['k']", SqlColonAccess);
    });

    it('preserves whitespace and comments', () => {
      backAndForth("v : a . b [ 'c' ] [ 0 ]", SqlColonAccess);
      backAndForth('v/* c */:/* c */a/* c */./* c */b', SqlColonAccess);
    });

    it('binds tighter than every operator', () => {
      expect(SqlExpression.parse('-v:a')).toBeInstanceOf(SqlUnary);
      expect(SqlExpression.parse("v:a || 'x'")).toBeInstanceOf(SqlMulti);
      expect(SqlExpression.parse('v:a + w:b * 2').getUsedColumnNames()).toEqual(['v', 'w']);

      const comparison = SqlExpression.parse("v:a = 1 AND w:['x'] > 2");
      expect(comparison.getUsedColumnNames()).toEqual(['v', 'w']);
    });

    it('parses the structure', () => {
      expect(SqlExpression.parse("t.v : a['b c'] [0]")).toMatchInlineSnapshot(`
        SqlColonAccess {
          "base": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "v",
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
                "name": "t",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "column",
          },
          "keywords": Object {},
          "parens": undefined,
          "segments": Array [
            Object {
              "name": RefName {
                "name": "a",
                "quotes": false,
              },
            },
            Object {
              "postLeftBracket": "",
              "preBracket": "",
              "preRightBracket": "",
              "value": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "'b c'",
                "type": "literal",
                "value": "b c",
              },
            },
            Object {
              "postLeftBracket": "",
              "preBracket": " ",
              "preRightBracket": "",
              "value": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "0",
                "type": "literal",
                "value": 0,
              },
            },
          ],
          "spacing": Object {
            "postColon": " ",
            "preColon": " ",
          },
          "type": "colonAccess",
        }
      `);
    });

    describe('JSON_OBJECT', () => {
      function keyValues(sql: string): string[] {
        const fn = SqlExpression.parse(sql) as SqlFunction;
        return fn.args!.values.map(arg => {
          const keyValue = arg as SqlKeyValue;
          return `${keyValue.key.type}<${keyValue.key}> ${keyValue.value.type}<${keyValue.value}>`;
        });
      }

      it('still reads a short key-value as one', () => {
        backAndForth('JSON_OBJECT(k: v)', SqlFunction);
        expect(keyValues('JSON_OBJECT(k: v)')).toEqual(['column<k> column<v>']);
        expect(keyValues("JSON_OBJECT('k':v)")).toEqual(["literal<'k'> column<v>"]);
      });

      it('takes the first colon as the key-value separator', () => {
        backAndForth('JSON_OBJECT(k:v:z)', SqlFunction);
        expect(keyValues('JSON_OBJECT(k:v:z)')).toEqual(['column<k> colonAccess<v:z>']);
        expect(keyValues("JSON_OBJECT('k' : v:z.y, 'j': w:[0])")).toEqual([
          "literal<'k'> colonAccess<v:z.y>",
          "literal<'j'> colonAccess<w:[0]>",
        ]);
      });

      it('allows a colon access in a short key only inside parens', () => {
        backAndForth('JSON_OBJECT((v:a): 1)', SqlFunction);
        expect(keyValues('JSON_OBJECT((v:a): 1)')).toEqual(['colonAccess<(v:a)> literal<1>']);
        expect(keyValues("JSON_OBJECT('a' || (v:b): 1)")).toEqual([
          "multi<'a' || (v:b)> literal<1>",
        ]);
      });

      it('allows a colon access anywhere in a long key-value', () => {
        backAndForth('JSON_OBJECT(KEY v:a VALUE w:b)', SqlFunction);
        expect(keyValues('JSON_OBJECT(KEY v:a VALUE w:b)')).toEqual([
          'colonAccess<v:a> colonAccess<w:b>',
        ]);
      });
    });
  });

  describe('does not parse', () => {
    it('does not parse a chained colon', () => {
      expect(() => SqlExpression.parse('v:a:b')).toThrow();
      expect(() => SqlExpression.parse('v:a.b:c')).toThrow();
    });

    it('does not parse an unquoted reserved keyword as a name', () => {
      expect(() => SqlExpression.parse('v:from')).toThrow();
      expect(() => SqlExpression.parse('v:a.select')).toThrow();
    });

    it('does not parse an empty or invalid bracket', () => {
      expect(() => SqlExpression.parse('v:[]')).toThrow();
      expect(() => SqlExpression.parse('v:[-1]')).toThrow();
      expect(() => SqlExpression.parse('v:[x]')).toThrow();
      expect(() => SqlExpression.parse('v:')).toThrow();
    });

    it('does not parse an unparenthesized colon access in a short key', () => {
      expect(() => SqlExpression.parse('JSON_OBJECT(v:a: 1)')).toThrow();
      expect(() => SqlExpression.parse('JSON_OBJECT(k || v:a : 1)')).toThrow();
    });
  });

  describe('.create', () => {
    it('creates names, bracketed strings and indexes', () => {
      expect(String(SqlColonAccess.create(SqlColumn.optionalQuotes('v'), ['a', 'b']))).toEqual(
        'v:a.b',
      );
      expect(
        String(SqlColonAccess.create(SqlColumn.optionalQuotes('v'), ['field name', 0, 'c'])),
      ).toEqual("v:['field name'][0].c");
      expect(
        String(SqlColonAccess.create(SqlColumn.optionalQuotes('v'), ['from', "it's"])),
      ).toEqual("v:['from']['it''s']");
    });

    it('adds parens to a base that is not a term', () => {
      const v = SqlColumn.optionalQuotes('v');
      expect(String(SqlColonAccess.create(SqlExpression.parse("v || 'x'"), ['a']))).toEqual(
        "(v || 'x'):a",
      );
      expect(String(SqlColonAccess.create(SqlColonAccess.create(v, ['a']), ['b']))).toEqual(
        '(v:a):b',
      );
      expect(String(SqlColonAccess.create(SqlFunction.simple('F', [v]), ['a']))).toEqual('F(v):a');
    });

    it('rejects an empty path or a bad index', () => {
      expect(() => SqlColonAccess.create(SqlColumn.optionalQuotes('v'), [])).toThrow(
        'colon access path must have at least one element',
      );
      expect(() => SqlColonAccess.create(SqlColumn.optionalQuotes('v'), [-1])).toThrow(
        'invalid index in colon access path: -1',
      );
      expect(() => SqlColonAccess.create(SqlColumn.optionalQuotes('v'), [1.5])).toThrow(
        'invalid index in colon access path: 1.5',
      );
    });
  });

  describe('.ensureTerm', () => {
    it('adds parens only when needed', () => {
      const v = SqlColumn.optionalQuotes('v');
      expect(SqlColonAccess.ensureTerm(v)).toBe(v);
      expect(String(SqlColonAccess.ensureTerm(SqlExpression.parse('a + b')))).toEqual('(a + b)');
      expect(String(SqlColonAccess.ensureTerm(SqlExpression.parse('(a + b)')))).toEqual('(a + b)');
    });
  });

  describe('.pathToSegments', () => {
    it('turns a path into segments', () => {
      expect(SqlColonAccess.pathToSegments(['a', 0]).map(s => Object.keys(s))).toEqual([
        ['name'],
        ['value'],
      ]);
    });
  });

  describe('#changeBase', () => {
    it('changes the base', () => {
      expect(String(SqlExpression.parse('v:a.b').changeBase(SqlColumn.create('w')))).toEqual(
        '"w":a.b',
      );
    });
  });

  describe('#changeSegments', () => {
    it('changes the segments', () => {
      const access = SqlExpression.parse('v : a') as SqlColonAccess;
      expect(String(access.changeSegments(SqlColonAccess.pathToSegments([0])))).toEqual('v : [0]');
    });

    it('rejects no segments', () => {
      const access = SqlExpression.parse('v:a') as SqlColonAccess;
      expect(() => access.changeSegments([])).toThrow(
        'colon access must have at least one segment',
      );
    });
  });

  describe('#changePath', () => {
    it('changes the path and keeps the colon spacing', () => {
      const access = SqlExpression.parse('v : a') as SqlColonAccess;
      expect(String(access.changePath(['x y', 'z']))).toEqual("v : ['x y'].z");
    });
  });

  describe('#getPath', () => {
    it('returns names and strings as strings, and indexes as numbers', () => {
      const access = SqlExpression.parse('v:a."b c"[\'d\'][0]') as SqlColonAccess;
      expect(access.getPath()).toEqual(['a', 'b c', 'd', 0]);
    });
  });

  describe('#getOutputName', () => {
    it('is named after the last segment when it is a field', () => {
      expect(SqlExpression.parse('v:a.b').getOutputName()).toEqual('b');
      expect(SqlExpression.parse('v:a."b c"').getOutputName()).toEqual('b c');
      expect(SqlExpression.parse("v:[0]['b']").getOutputName()).toEqual('b');
    });

    it('is unnamed when the last segment is an index or an empty string', () => {
      expect(SqlExpression.parse('v:a[0]').getOutputName()).toBeUndefined();
      expect(SqlExpression.parse("v:['']").getOutputName()).toBeUndefined();
    });
  });

  describe('#getJsonPath', () => {
    it('makes the matching JSON path', () => {
      expect((SqlExpression.parse('v:a.b') as SqlColonAccess).getJsonPath()).toEqual('$.a.b');
      expect((SqlExpression.parse('v:a."b c"[\'d\'][0]') as SqlColonAccess).getJsonPath()).toEqual(
        "$.a['b c'].d[0]",
      );
    });

    it('throws on a name containing a quote', () => {
      expect(() => (SqlExpression.parse("v:['it''s']") as SqlColonAccess).getJsonPath()).toThrow(
        "can not make a JSON path for a name containing a quote: it's",
      );
    });
  });

  describe('#toJsonValue', () => {
    it('makes the JSON_VALUE call', () => {
      expect(String((SqlExpression.parse('v:a.b') as SqlColonAccess).toJsonValue())).toEqual(
        "JSON_VALUE(v, '$.a.b')",
      );
    });

    it('adds the returning type', () => {
      expect(
        String((SqlExpression.parse('v:a[0]') as SqlColonAccess).toJsonValue('BIGINT')),
      ).toEqual("JSON_VALUE(v, '$.a[0]' RETURNING BIGINT)");
    });

    it('drops the parens around the base', () => {
      expect(String((SqlExpression.parse('(x + y):a') as SqlColonAccess).toJsonValue())).toEqual(
        "JSON_VALUE(x + y, '$.a')",
      );
    });

    it('throws on a name containing a quote', () => {
      expect(() => (SqlExpression.parse("v:['it''s']") as SqlColonAccess).toJsonValue()).toThrow(
        "can not make a JSON path for a name containing a quote: it's",
      );
    });
  });

  describe('#access', () => {
    it('extends the path instead of adding a second colon', () => {
      const access = SqlExpression.parse('v : a [ 0 ]') as SqlColonAccess;
      expect(String(access.access('b', 1))).toEqual('v : a [ 0 ].b[1]');
      expect(String(SqlColumn.create('v').access('a').access('b'))).toEqual('"v":a.b');
    });

    it('rejects an empty path', () => {
      const access = SqlExpression.parse('v:a') as SqlColonAccess;
      expect(() => access.access()).toThrow('colon access path must have at least one element');
    });
  });

  describe('#walk', () => {
    it('walks into the base but not the segments', () => {
      const access = SqlExpression.parse('v:a.b');
      const seen: string[] = [];
      const walked = access.walk(ex => {
        seen.push(ex.toString());
        return ex instanceof SqlColumn ? ex.changeName('w') : ex;
      });
      expect(seen).toEqual(['v:a.b', 'v']);
      expect(String(walked)).toEqual('w:a.b');
      expect(access.getUsedColumnNames()).toEqual(['v']);
    });

    it('keeps the same instance when nothing changes', () => {
      const access = SqlExpression.parse('v:a.b');
      expect(access.walk(ex => ex)).toBe(access);
    });
  });
});
