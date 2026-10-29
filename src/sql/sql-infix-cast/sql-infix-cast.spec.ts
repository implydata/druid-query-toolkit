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
import {
  SqlColonAccess,
  SqlColumn,
  SqlExpression,
  SqlFunction,
  SqlInfixCast,
  SqlMulti,
  SqlType,
  SqlUnary,
} from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlInfixCast', () => {
  describe('parses', () => {
    it('parses casts to different types', () => {
      backAndForth('x::BIGINT', SqlInfixCast);
      backAndForth('x::varchar', SqlInfixCast);
      backAndForth('x::LONG', SqlInfixCast);
      backAndForth('x::VARCHAR ARRAY', SqlInfixCast);
      backAndForth("x::TYPE('COMPLEX<json>')", SqlInfixCast);
    });

    it('parses different expressions', () => {
      backAndForth('t.x::BIGINT', SqlInfixCast);
      backAndForth("'1'::BIGINT", SqlInfixCast);
      backAndForth('-1::BIGINT', SqlInfixCast);
      backAndForth('?::VARCHAR', SqlInfixCast);
      backAndForth('F(x)::VARCHAR', SqlInfixCast);
      backAndForth('ARRAY[cnt]::VARCHAR ARRAY', SqlInfixCast);
      backAndForth('(a + b)::BIGINT', SqlInfixCast);
      backAndForth("CASE WHEN x THEN 'a' ELSE 'b' END::VARCHAR", SqlInfixCast);
      backAndForth('v:a.b::BIGINT', SqlInfixCast);
      backAndForth('x::VARCHAR::BIGINT', SqlInfixCast);
    });

    it('preserves whitespace and comments', () => {
      backAndForth('x :: BIGINT', SqlInfixCast);
      backAndForth('x/* c */::/* c */BIGINT', SqlInfixCast);
      backAndForth('v : a :: BIGINT', SqlInfixCast);
    });

    it('binds tighter than every operator', () => {
      const negated = SqlExpression.parse('-x::BIGINT') as SqlUnary;
      expect(negated).toBeInstanceOf(SqlUnary);
      expect(negated.argument).toBeInstanceOf(SqlInfixCast);

      const concat = SqlExpression.parse("'x' || cnt::VARCHAR") as SqlMulti;
      expect(concat).toBeInstanceOf(SqlMulti);
      expect(concat.getArg(1)).toBeInstanceOf(SqlInfixCast);

      expect(SqlExpression.parse('1 + x::BIGINT')).toBeInstanceOf(SqlMulti);
      expect(SqlExpression.parse('x::FLOAT > 9 AND x::FLOAT <= 10.5').getUsedColumnNames()).toEqual(
        ['x'],
      );
    });

    it('binds looser than colon access', () => {
      const cast = SqlExpression.parse('v:a.b::BIGINT') as SqlInfixCast;
      expect(cast.expression).toBeInstanceOf(SqlColonAccess);
      expect(String(cast.expression)).toEqual('v:a.b');
    });

    it('chains to the left', () => {
      const cast = SqlExpression.parse('x::VARCHAR::BIGINT') as SqlInfixCast;
      expect(String(cast.castType)).toEqual('BIGINT');
      expect(String(cast.expression)).toEqual('x::VARCHAR');
    });

    it('parses the structure', () => {
      expect(SqlExpression.parse('x :: varchar')).toMatchInlineSnapshot(`
        SqlInfixCast {
          "castType": SqlType {
            "keywords": Object {
              "type": "varchar",
            },
            "parens": undefined,
            "spacing": Object {},
            "type": "type",
            "value": "VARCHAR",
          },
          "expression": SqlColumn {
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
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {
            "postDoubleColon": " ",
            "preDoubleColon": " ",
          },
          "type": "infixCast",
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

      it('allows an infix cast in a short key', () => {
        backAndForth('JSON_OBJECT(k::VARCHAR: v)', SqlFunction);
        expect(keyValues('JSON_OBJECT(k::VARCHAR: v)')).toEqual([
          'infixCast<k::VARCHAR> column<v>',
        ]);
        expect(keyValues("JSON_OBJECT('a' || k::VARCHAR: 1)")).toEqual([
          "multi<'a' || k::VARCHAR> literal<1>",
        ]);
      });

      it('allows an infix cast in a short value', () => {
        backAndForth('JSON_OBJECT(k:v::BIGINT)', SqlFunction);
        expect(keyValues('JSON_OBJECT(k:v::BIGINT)')).toEqual(['column<k> infixCast<v::BIGINT>']);
        expect(keyValues('JSON_OBJECT(k:v:a::BIGINT)')).toEqual([
          'column<k> infixCast<v:a::BIGINT>',
        ]);
      });

      it('allows an infix cast of a colon access in a short key only inside parens', () => {
        expect(keyValues('JSON_OBJECT((v:a)::VARCHAR: 1)')).toEqual([
          'infixCast<(v:a)::VARCHAR> literal<1>',
        ]);
        expect(keyValues('JSON_OBJECT((v:a::VARCHAR): 1)')).toEqual([
          'infixCast<(v:a::VARCHAR)> literal<1>',
        ]);
      });
    });
  });

  describe('does not parse', () => {
    it('does not parse a missing type', () => {
      expect(() => SqlExpression.parse('x::')).toThrow();
      expect(() => SqlExpression.parse('x::1')).toThrow();
      expect(() => SqlExpression.parse('x: :BIGINT')).toThrow();
    });

    it('does not parse a colon access after an infix cast', () => {
      expect(() => SqlExpression.parse('x::VARCHAR:a')).toThrow();
    });

    it('does not parse an unparenthesized colon access in a short key', () => {
      expect(() => SqlExpression.parse('JSON_OBJECT(v:a::VARCHAR: 1)')).toThrow();
    });
  });

  describe('.create', () => {
    it('makes an infix cast', () => {
      expect(String(SqlInfixCast.create(SqlColumn.create('x'), 'BIGINT'))).toEqual('"x"::BIGINT');
      expect(String(SqlInfixCast.create(SqlColumn.create('x'), SqlType.VARCHAR_ARRAY))).toEqual(
        '"x"::VARCHAR ARRAY',
      );
      expect(String(SqlInfixCast.create(1, 'VARCHAR'))).toEqual('1::VARCHAR');
    });

    it('adds parens to an expression that is not a term', () => {
      expect(String(SqlInfixCast.create(SqlExpression.parse('a + b'), 'BIGINT'))).toEqual(
        '(a + b)::BIGINT',
      );
      expect(String(SqlInfixCast.create(SqlExpression.parse('-a'), 'BIGINT'))).toEqual(
        '(-a)::BIGINT',
      );
    });

    it('leaves a colon access or an infix cast bare', () => {
      expect(String(SqlInfixCast.create(SqlExpression.parse('v:a'), 'BIGINT'))).toEqual(
        'v:a::BIGINT',
      );
      expect(String(SqlInfixCast.create(SqlExpression.parse('x::VARCHAR'), 'BIGINT'))).toEqual(
        'x::VARCHAR::BIGINT',
      );
    });
  });

  describe('#changeExpression', () => {
    it('changes the expression', () => {
      const cast = SqlExpression.parse('x :: BIGINT') as SqlInfixCast;
      expect(String(cast.changeExpression(SqlColumn.create('y')))).toEqual('"y" :: BIGINT');
    });
  });

  describe('#changeCastType', () => {
    it('changes the type', () => {
      const cast = SqlExpression.parse('x :: BIGINT') as SqlInfixCast;
      expect(String(cast.changeCastType('DOUBLE'))).toEqual('x :: DOUBLE');
      expect(String(cast.changeCastType(SqlType.VARCHAR_ARRAY))).toEqual('x :: VARCHAR ARRAY');
    });
  });

  describe('#getOutputName', () => {
    it('is named after the column it casts', () => {
      expect(SqlExpression.parse('x::BIGINT').getOutputName()).toEqual('x');
      expect(SqlExpression.parse('t."x"::BIGINT').getOutputName()).toEqual('x');
      expect(SqlExpression.parse('(x)::BIGINT').getOutputName()).toEqual('x');
    });

    it('is named after the colon access or the infix cast it casts', () => {
      expect(SqlExpression.parse('v:a.b::BIGINT').getOutputName()).toEqual('b');
      expect(SqlExpression.parse('x::VARCHAR::BIGINT').getOutputName()).toEqual('x');
      expect(SqlExpression.parse('v:a::VARCHAR::BIGINT').getOutputName()).toEqual('a');
    });

    it('is unnamed for anything else', () => {
      expect(SqlExpression.parse("(x || 'a')::VARCHAR").getOutputName()).toBeUndefined();
      expect(SqlExpression.parse('CAST(x AS VARCHAR)::BIGINT').getOutputName()).toBeUndefined();
      expect(SqlExpression.parse('v:a[0]::BIGINT').getOutputName()).toBeUndefined();
    });
  });

  describe('#toFunction', () => {
    it('makes the CAST call', () => {
      expect(String((SqlExpression.parse('x::BIGINT') as SqlInfixCast).toFunction())).toEqual(
        'CAST(x AS BIGINT)',
      );
      expect(
        String((SqlExpression.parse('x::VARCHAR::BIGINT') as SqlInfixCast).toFunction()),
      ).toEqual('CAST(x::VARCHAR AS BIGINT)');
    });

    it('makes a JSON_VALUE call with a returning type for a colon access', () => {
      expect(String((SqlExpression.parse('v:a.b::BIGINT') as SqlInfixCast).toFunction())).toEqual(
        "JSON_VALUE(v, '$.a.b' RETURNING BIGINT)",
      );
      expect(
        String((SqlExpression.parse('(v:a)::VARCHAR ARRAY') as SqlInfixCast).toFunction()),
      ).toEqual("JSON_VALUE(v, '$.a' RETURNING VARCHAR ARRAY)");
    });

    it('drops the parens around the expression', () => {
      expect(String((SqlExpression.parse('(x + y)::BIGINT') as SqlInfixCast).toFunction())).toEqual(
        'CAST(x + y AS BIGINT)',
      );
    });
  });

  describe('#walk', () => {
    it('walks into the expression but not the type', () => {
      const cast = SqlExpression.parse('x::BIGINT');
      const seen: string[] = [];
      const walked = cast.walk(ex => {
        seen.push(ex.toString());
        return ex instanceof SqlColumn ? ex.changeName('y') : ex;
      });
      expect(seen).toEqual(['x::BIGINT', 'x']);
      expect(String(walked)).toEqual('y::BIGINT');
      expect(cast.getUsedColumnNames()).toEqual(['x']);
    });

    it('keeps the same instance when nothing changes', () => {
      const cast = SqlExpression.parse('x::BIGINT');
      expect(cast.walk(ex => ex)).toBe(cast);
    });
  });
});
