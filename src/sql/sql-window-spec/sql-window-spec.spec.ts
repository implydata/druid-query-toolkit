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

import type { SqlFunction } from '../..';
import {
  RefName,
  SqlColumn,
  SqlExpression,
  SqlFrameBound,
  SqlOrderByClause,
  SqlOrderByExpression,
  SqlPartitionByClause,
  SqlWindowSpec,
} from '../..';
import { backAndForth } from '../../test-utils';

function parseWindowSpec(overSql: string): SqlWindowSpec {
  return (SqlExpression.parse(`SUM(x) OVER ${overSql}`) as SqlFunction).windowSpec!;
}

describe('SqlWindowSpec', () => {
  describe('parses', () => {
    it.each([
      `SUM(x) OVER ()`,
      `SUM(x) OVER ( )`,
      `SUM(x) OVER (w)`,
      `SUM(x) OVER (PARTITION BY a)`,
      `SUM(x) OVER (ORDER BY b DESC)`,
      `SUM(x) OVER (ROWS 1 PRECEDING)`,
      `SUM(x) OVER (range unbounded preceding)`,
      `SUM(x) OVER ( w  partition by a, b  order by c  rows  between 1 preceding  and  current row )`,
      `SUM(x) OVER (PARTITION BY a ORDER BY b RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)`,
    ])('parses: %s', sql => {
      backAndForth(sql);
    });

    it('parses every part', () => {
      expect(
        parseWindowSpec(
          `( w  partition by a  order by c  rows  between 1 preceding  and  current row )`,
        ),
      ).toMatchInlineSnapshot(`
        SqlWindowSpec {
          "frameBound1": SqlFrameBound {
            "boundValue": 1,
            "following": false,
            "keywords": Object {
              "preceding": "preceding",
            },
            "parens": undefined,
            "spacing": Object {
              "postBoundValue": " ",
            },
            "type": "frameBound",
          },
          "frameBound2": SqlFrameBound {
            "boundValue": "currentRow",
            "following": undefined,
            "keywords": Object {
              "currentRow": "current row",
            },
            "parens": undefined,
            "spacing": Object {},
            "type": "frameBound",
          },
          "frameType": "rows",
          "keywords": Object {
            "and": "and",
            "between": "between",
            "rows": "rows",
          },
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": undefined,
                  "expression": SqlColumn {
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
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "order by",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionByClause": SqlPartitionByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "a",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
              ],
            },
            "keywords": Object {
              "partitionBy": "partition by",
            },
            "parens": undefined,
            "spacing": Object {
              "postPartitionBy": " ",
            },
            "type": "partitionByClause",
          },
          "spacing": Object {
            "postAnd": "  ",
            "postBetween": " ",
            "postFrameType": "  ",
            "postLeftParen": " ",
            "postOrderBy": "  ",
            "postPartitionBy": "  ",
            "postWindowName": "  ",
            "preAnd": "  ",
            "preRightParen": " ",
          },
          "type": "windowSpec",
          "windowName": RefName {
            "name": "w",
            "quotes": false,
          },
        }
      `);
    });

    it('parses a single frame bound', () => {
      const windowSpec = parseWindowSpec(`(RANGE 2 FOLLOWING)`);
      expect(windowSpec.frameType).toEqual('range');
      expect(windowSpec.keywords).toEqual({ range: 'RANGE' });
      expect(String(windowSpec.frameBound1)).toEqual('2 FOLLOWING');
      expect(windowSpec.frameBound2).toBeUndefined();
    });
  });

  describe('does not parse', () => {
    it('rejects a frame without bounds', () => {
      expect(() => SqlExpression.parse(`SUM(x) OVER (ROWS)`)).toThrow();
    });

    it('rejects parts in the wrong order', () => {
      expect(() => SqlExpression.parse(`SUM(x) OVER (ORDER BY a PARTITION BY b)`)).toThrow();
    });
  });

  describe('#changeWindowName', () => {
    it('sets a window name', () => {
      expect(String(parseWindowSpec(`(ORDER BY b)`).changeWindowName('w'))).toEqual(
        `("w" ORDER BY b)`,
      );
      expect(
        String(parseWindowSpec(`(ORDER BY b)`).changeWindowName(RefName.create('w', false))),
      ).toEqual(`(w ORDER BY b)`);
    });

    it('removes the window name along with its spacing', () => {
      const windowSpec = parseWindowSpec(`(w   ORDER BY b)`).changeWindowName(undefined);
      expect(windowSpec.windowName).toBeUndefined();
      expect(windowSpec.spacing.postWindowName).toBeUndefined();
      expect(String(windowSpec)).toEqual(`(ORDER BY b)`);
    });
  });

  describe('#changePartitionByClause', () => {
    it('sets a partition by clause', () => {
      const windowSpec = parseWindowSpec(`(ORDER BY b)`).changePartitionByClause(
        SqlPartitionByClause.create([SqlColumn.optionalQuotes('a')]),
      );
      expect(String(windowSpec)).toEqual(`(PARTITION BY a ORDER BY b)`);
    });

    it('adds a partition by clause after a window name that was the last part', () => {
      const windowSpec = parseWindowSpec(`(w)`).changePartitionByClause(
        SqlPartitionByClause.create([SqlColumn.optionalQuotes('a')]),
      );
      expect(String(windowSpec)).toEqual(`(w PARTITION BY a)`);
    });

    it('removes the partition by clause when it is the only part', () => {
      expect(
        String(parseWindowSpec(`(PARTITION BY a)`).changePartitionByClause(undefined)),
      ).toEqual(`()`);
    });

    it('removes the partition by clause along with its spacing', () => {
      const windowSpec = parseWindowSpec(`(PARTITION BY a   ORDER BY b)`);
      const changed = windowSpec.changePartitionByClause(undefined);
      expect(changed.partitionByClause).toBeUndefined();
      expect(String(changed)).toEqual(`(ORDER BY b)`);
    });

    it('returns the same instance when nothing changes', () => {
      const windowSpec = parseWindowSpec(`(PARTITION BY a)`);
      expect(windowSpec.changePartitionByClause(windowSpec.partitionByClause)).toBe(windowSpec);
      const empty = parseWindowSpec(`()`);
      expect(empty.changePartitionByClause(undefined)).toBe(empty);
    });
  });

  describe('#changeOrderByClause', () => {
    it('sets an order by clause', () => {
      const windowSpec = parseWindowSpec(`(ROWS 1 PRECEDING)`).changeOrderByClause(
        SqlOrderByClause.create(SqlOrderByExpression.create(SqlColumn.optionalQuotes('b'), 'DESC')),
      );
      expect(String(windowSpec)).toEqual(`(ORDER BY b DESC ROWS 1 PRECEDING)`);
    });

    it('adds an order by clause after a partition by clause that was the last part', () => {
      const orderBy = SqlOrderByClause.create(
        SqlOrderByExpression.create(SqlColumn.optionalQuotes('b'), 'DESC'),
      );
      expect(String(parseWindowSpec(`(PARTITION BY a)`).changeOrderByClause(orderBy))).toEqual(
        `(PARTITION BY a ORDER BY b DESC)`,
      );
      expect(String(parseWindowSpec(`( PARTITION BY a )`).changeOrderByClause(orderBy))).toEqual(
        `( PARTITION BY a ORDER BY b DESC )`,
      );
    });

    it('removes the last part without leaving a stray space', () => {
      expect(
        String(parseWindowSpec(`(PARTITION BY a ORDER BY b)`).changeOrderByClause(undefined)),
      ).toEqual(`(PARTITION BY a)`);
    });

    it('removes the order by clause along with its spacing', () => {
      const windowSpec = parseWindowSpec(`(PARTITION BY a ORDER BY b   ROWS 1 PRECEDING)`);
      const changed = windowSpec.changeOrderByClause(undefined);
      expect(changed.orderByClause).toBeUndefined();
      expect(String(changed)).toEqual(`(PARTITION BY a ROWS 1 PRECEDING)`);
    });

    it('returns the same instance when nothing changes', () => {
      const windowSpec = parseWindowSpec(`(ORDER BY b)`);
      expect(windowSpec.changeOrderByClause(windowSpec.orderByClause)).toBe(windowSpec);
    });
  });

  describe('#_walkInner', () => {
    const rename = (ex: any) =>
      ex instanceof SqlColumn ? ex.changeName(ex.getName().toUpperCase()) : ex;

    it('substitutes inside the partition by and order by clauses', () => {
      const windowSpec = parseWindowSpec(`(w PARTITION BY a ORDER BY b ROWS 1 PRECEDING)`);
      expect(String(windowSpec.walk(rename))).toEqual(
        `(w PARTITION BY A ORDER BY B ROWS 1 PRECEDING)`,
      );
    });

    it('returns the same instance when nothing changes', () => {
      const windowSpec = parseWindowSpec(`(PARTITION BY a ORDER BY b)`);
      expect(windowSpec.walk(ex => ex)).toBe(windowSpec);
      const empty = parseWindowSpec(`(ROWS 1 PRECEDING)`);
      expect(empty.walk(rename)).toBe(empty);
    });

    it('stops when the substitutor returns nothing in the partition by clause', () => {
      const windowSpec = parseWindowSpec(`(PARTITION BY a ORDER BY b)`);
      const seen: string[] = [];
      const ret = windowSpec.walk(ex => {
        seen.push(String(ex));
        if (ex instanceof SqlColumn) return;
        return ex;
      });
      expect(ret).toBe(windowSpec);
      expect(seen).toEqual(['(PARTITION BY a ORDER BY b)', 'PARTITION BY a', 'a']);
    });

    it('stops when the substitutor returns nothing in the order by clause', () => {
      const windowSpec = parseWindowSpec(`(PARTITION BY a ORDER BY b)`);
      const ret = windowSpec.walk(ex =>
        ex instanceof SqlColumn && ex.getName() === 'b' ? undefined : ex,
      );
      expect(ret).toBe(windowSpec);
    });
  });

  describe('built from parts', () => {
    it('prints default keywords and spacing', () => {
      expect(String(new SqlWindowSpec({}))).toEqual(`()`);
      expect(
        String(
          new SqlWindowSpec({
            frameType: 'rows',
            frameBound1: SqlFrameBound.preceding('unbounded'),
            frameBound2: SqlFrameBound.CURRENT_ROW,
          }),
        ),
      ).toEqual(`(ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`);
      expect(
        String(
          new SqlWindowSpec({
            frameType: 'range',
            frameBound1: SqlFrameBound.following(3),
          }),
        ),
      ).toEqual(`(RANGE 3 FOLLOWING)`);
    });

    it('prints spacing between parts that are added one by one', () => {
      expect(
        String(
          new SqlWindowSpec({})
            .changePartitionByClause(SqlPartitionByClause.create([SqlColumn.optionalQuotes('a')]))
            .changeOrderByClause(
              SqlOrderByClause.create(SqlOrderByExpression.create(SqlColumn.optionalQuotes('b'))),
            ),
        ),
      ).toEqual(`(PARTITION BY a ORDER BY b)`);
    });

    it('ignores a frame type without a bound', () => {
      expect(String(new SqlWindowSpec({ frameType: 'rows' }))).toEqual(`()`);
    });
  });
});
