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

import type { SqlFunction, SqlWindowSpec } from '../..';
import { SqlExpression, SqlFrameBound } from '../..';
import { backAndForth } from '../../test-utils';

function parseWindowSpec(overSql: string): SqlWindowSpec {
  return (SqlExpression.parse(`SUM(x) OVER ${overSql}`) as SqlFunction).windowSpec!;
}

describe('SqlFrameBound', () => {
  describe('parses', () => {
    it.each([
      `SUM(x) OVER (ROWS CURRENT ROW)`,
      `SUM(x) OVER (ROWS current  row)`,
      `SUM(x) OVER (ROWS 3 PRECEDING)`,
      `SUM(x) OVER (RANGE unbounded   following)`,
      `SUM(x) OVER (ROWS BETWEEN Unbounded Preceding AND 10 following)`,
    ])('parses: %s', sql => {
      backAndForth(sql);
    });

    it('parses a numeric bound', () => {
      const bound = parseWindowSpec(`(ROWS 3  PRECEDING)`).frameBound1!;
      expect(bound).toBeInstanceOf(SqlFrameBound);
      expect(bound.boundValue).toEqual(3);
      expect(bound.following).toEqual(false);
      expect(bound.spacing).toEqual({ postBoundValue: '  ' });
    });

    it('parses an unbounded following bound keeping the keyword casing', () => {
      const bound = parseWindowSpec(`(ROWS unbounded Following)`).frameBound1!;
      expect(bound.boundValue).toEqual('unbounded');
      expect(bound.following).toEqual(true);
      expect(bound.keywords).toEqual({ unbounded: 'unbounded', following: 'Following' });
    });

    it('parses the current row', () => {
      const bound = parseWindowSpec(`(ROWS current row)`).frameBound1!;
      expect(bound.boundValue).toEqual('currentRow');
      expect(bound.following).toBeUndefined();
      expect(String(bound)).toEqual('current row');
    });
  });

  describe('.CURRENT_ROW', () => {
    it('is the current row', () => {
      expect(SqlFrameBound.CURRENT_ROW.boundValue).toEqual('currentRow');
      expect(String(SqlFrameBound.CURRENT_ROW)).toEqual('CURRENT ROW');
    });
  });

  describe('.preceding', () => {
    it('makes a preceding bound', () => {
      expect(String(SqlFrameBound.preceding(5))).toEqual('5 PRECEDING');
      expect(String(SqlFrameBound.preceding('unbounded'))).toEqual('UNBOUNDED PRECEDING');
      expect(SqlFrameBound.preceding(5).following).toEqual(false);
    });
  });

  describe('.following', () => {
    it('makes a following bound', () => {
      expect(String(SqlFrameBound.following(0))).toEqual('0 FOLLOWING');
      expect(String(SqlFrameBound.following('unbounded'))).toEqual('UNBOUNDED FOLLOWING');
      expect(SqlFrameBound.following(0).following).toEqual(true);
    });
  });

  describe('#changeSpace', () => {
    it('changes the space between the value and the direction', () => {
      expect(String(SqlFrameBound.preceding(5).changeSpace('postBoundValue', '  '))).toEqual(
        '5  PRECEDING',
      );
    });
  });
});
