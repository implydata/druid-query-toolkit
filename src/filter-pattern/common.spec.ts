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

import { SqlExpression, SqlLiteral, SqlRecord } from '../sql';

import {
  castAsVarchar,
  extractOuterNot,
  oneOf,
  sqlRecordGetLiteralValues,
  unwrapCastAsVarchar,
  xor,
} from './common';

describe('common', () => {
  describe('extractOuterNot', () => {
    it('works without not', () => {
      const [negate, ex] = extractOuterNot(SqlExpression.parse('x > 5'));
      expect(negate).toEqual(false);
      expect(String(ex)).toEqual('x > 5');
    });

    it('works with not', () => {
      const [negate, ex] = extractOuterNot(SqlExpression.parse('NOT (x > 5)'));
      expect(negate).toEqual(true);
      expect(String(ex)).toEqual('x > 5');
    });

    it('cancels out a double not', () => {
      const [negate, ex] = extractOuterNot(SqlExpression.parse('NOT (NOT (x > 5))'));
      expect(negate).toEqual(false);
      expect(String(ex)).toEqual('x > 5');
    });
  });

  describe('sqlRecordGetLiteralValues', () => {
    it('returns the values when every element is a literal', () => {
      expect(
        sqlRecordGetLiteralValues(SqlRecord.create([1, 'a', null].map(v => SqlLiteral.create(v)))),
      ).toEqual([1, 'a', null]);
    });

    it('returns undefined when an element is not a literal', () => {
      expect(
        sqlRecordGetLiteralValues(
          SqlRecord.create([SqlLiteral.create(1), SqlExpression.parse('"col"')]),
        ),
      ).toBeUndefined();
    });

    it('returns an empty array for an empty record', () => {
      expect(sqlRecordGetLiteralValues(SqlRecord.create([]))).toEqual([]);
    });
  });

  describe('castAsVarchar', () => {
    it('wraps the expression in a cast', () => {
      expect(String(castAsVarchar(SqlExpression.parse('"channel"')))).toEqual(
        'CAST("channel" AS VARCHAR)',
      );
    });
  });

  describe('unwrapCastAsVarchar', () => {
    it('works when there is something to unwrap', () => {
      expect(
        String(unwrapCastAsVarchar(SqlExpression.parse('CAST(t."channel" AS VARCHAR)'))),
      ).toEqual('t."channel"');
    });

    it('works when there is nothing to unwrap', () => {
      expect(String(unwrapCastAsVarchar(SqlExpression.parse('t."channel"')))).toEqual(
        't."channel"',
      );
    });

    it('does not unwrap a cast to another type', () => {
      expect(String(unwrapCastAsVarchar(SqlExpression.parse('CAST("channel" AS BIGINT)')))).toEqual(
        'CAST("channel" AS BIGINT)',
      );
    });

    it('does not unwrap other functions', () => {
      expect(String(unwrapCastAsVarchar(SqlExpression.parse('UPPER("channel")')))).toEqual(
        'UPPER("channel")',
      );
    });
  });

  describe('oneOf', () => {
    it('tells if the thing is one of the options', () => {
      expect(oneOf('b', 'a', 'b', 'c')).toEqual(true);
      expect(oneOf('d', 'a', 'b', 'c')).toEqual(false);
      expect(oneOf('d')).toEqual(false);
    });
  });

  describe('xor', () => {
    it('is true when exactly one side is truthy', () => {
      expect(xor(false, false)).toEqual(false);
      expect(xor(true, false)).toEqual(true);
      expect(xor(0, 'x')).toEqual(true);
      expect(xor(1, 'x')).toEqual(false);
    });
  });
});
