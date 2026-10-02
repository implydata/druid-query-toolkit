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

import { sane } from '../utils';

import type { SqlExpression } from '.';
import { SeparatedArray, SqlCase, SqlColumn, SqlLiteral, SqlTable } from '.';
import { parse as parseSql } from './parser';
import { SqlBase } from './sql-base';

describe('SqlBase', () => {
  describe('.parseSql', () => {
    it('parses a string', () => {
      expect(SqlBase.parseSql('a + 1').toString()).toEqual('a + 1');
    });

    it('returns a SqlBase as is', () => {
      const x = SqlColumn.create('x');
      expect(SqlBase.parseSql(x)).toBe(x);
    });

    it('throws on unknown input', () => {
      expect(() => SqlBase.parseSql(1 as any)).toThrow('unknown input');
    });
  });

  describe('.setCapitalization', () => {
    const ex = SqlCase.ifThenElse(SqlColumn.optionalQuotes('a'), 1, 0);

    afterEach(() => {
      SqlBase.setCapitalization('upper');
    });

    it('uses upper case', () => {
      SqlBase.setCapitalization('upper');
      expect(ex.toString()).toEqual('CASE WHEN a THEN 1 ELSE 0 END');
    });

    it('uses lower case', () => {
      SqlBase.setCapitalization('lower');
      expect(ex.toString()).toEqual('case when a then 1 else 0 end');
    });

    it('uses title case', () => {
      SqlBase.setCapitalization('title');
      expect(ex.toString()).toEqual('Case When a Then 1 Else 0 End');
    });

    it('uses a deterministic random case', () => {
      SqlBase.setCapitalization('random');
      const str = ex.toString();
      expect(str).toMatchInlineSnapshot(`"cAsE WhEn a TheN 1 ElsE 0 End"`);
      expect(str.toUpperCase()).toEqual('CASE WHEN A THEN 1 ELSE 0 END');
      expect(ex.toString()).toEqual(str);
    });

    it('does not change explicitly set keywords', () => {
      SqlBase.setCapitalization('lower');
      expect(parseSql('CASE WHEN a THEN 1 END').toString()).toEqual('CASE WHEN a THEN 1 END');
    });

    it('throws on an unknown capitalization', () => {
      expect(() => SqlBase.setCapitalization('lol' as any)).toThrow(`unknown capitalization 'lol'`);
    });
  });

  describe('.walkSeparatedArray', () => {
    const a = SqlColumn.optionalQuotes('a');
    const b = SqlColumn.optionalQuotes('b');
    const arr = SeparatedArray.fromArray<SqlExpression>([a, b]);

    it('returns the same array when nothing changes', () => {
      expect(SqlBase.walkSeparatedArray(arr, [], x => x, false)).toBe(arr);
    });

    it('returns a new array when something changes', () => {
      const ret = SqlBase.walkSeparatedArray(arr, [], x => (x === b ? a : x), false);
      expect(ret).not.toBe(arr);
      expect(String(ret)).toEqual('a, a');
    });

    it('returns undefined and stops when the walk is aborted', () => {
      const seen: string[] = [];
      const ret = SqlBase.walkSeparatedArray(
        arr,
        [],
        x => {
          seen.push(String(x));
          return;
        },
        false,
      );
      expect(ret).toBeUndefined();
      expect(seen).toEqual(['a']);
    });
  });

  describe('.normalizeKeywordSpace', () => {
    it('collapses whitespace and comments into single spaces', () => {
      expect(SqlBase.normalizeKeywordSpace('GROUP\n  BY')).toEqual('GROUP BY');
      expect(SqlBase.normalizeKeywordSpace('GROUP/* c */BY')).toEqual('GROUP BY');
      expect(SqlBase.normalizeKeywordSpace('GROUP -- c\nBY')).toEqual('GROUP BY');
    });
  });

  describe('.getConstructorFor', () => {
    it('returns the registered class', () => {
      expect(SqlBase.getConstructorFor('column')).toBe(SqlColumn);
    });

    it('throws on an unregistered type', () => {
      expect(() => SqlBase.getConstructorFor('lol' as any)).toThrow(
        `unsupported expression type 'lol'`,
      );
    });
  });

  describe('.fromValue', () => {
    it('builds an instance of the right class', () => {
      const x = SqlColumn.create('x');
      const copy = SqlBase.fromValue(x.valueOf());
      expect(copy).toBeInstanceOf(SqlColumn);
      expect(copy.equals(x)).toBe(true);
    });

    it('throws when type is not set', () => {
      expect(() => SqlBase.fromValue({})).toThrow(`must set 'type' to use fromValue`);
    });
  });

  describe('#valueOf', () => {
    it('includes parens only when there are some', () => {
      expect('parens' in parseSql('a').valueOf()).toBe(false);
      expect(parseSql('(a)').valueOf().parens).toEqual([{ leftSpacing: '', rightSpacing: '' }]);
    });
  });

  describe('#toJSON', () => {
    it('serializes to the SQL string', () => {
      expect(JSON.stringify({ x: parseSql(`COUNT(*)`) })).toEqual('{"x":"COUNT(*)"}');
    });
  });

  describe('#equals', () => {
    const ex = parseSql('a + 1');

    it('is false for undefined', () => {
      expect(ex.equals(undefined)).toBe(false);
    });

    it('is true for the same instance', () => {
      expect(ex.equals(ex)).toBe(true);
    });

    it('is false for a different type', () => {
      expect(SqlColumn.create('x').equals(SqlTable.create('x'))).toBe(false);
    });

    it('compares the SQL text', () => {
      expect(ex.equals(parseSql('a + 1'))).toBe(true);
      expect(ex.equals(parseSql('a  +  1'))).toBe(false);
    });
  });

  describe('#logicalEquals', () => {
    const ex = parseSql('a + 1');

    it('is false for undefined', () => {
      expect(ex.logicalEquals(undefined)).toBe(false);
    });

    it('is true for the same instance', () => {
      expect(ex.logicalEquals(ex)).toBe(true);
    });

    it('is false for a different type', () => {
      expect(SqlColumn.create('x').logicalEquals(SqlTable.create('x'))).toBe(false);
    });

    it('ignores spacing and keyword casing', () => {
      expect(ex.logicalEquals(parseSql('a  +\n1'))).toBe(true);
      expect(parseSql('x is null').logicalEquals(parseSql('x IS NULL'))).toBe(true);
      expect(ex.logicalEquals(parseSql('a + 2'))).toBe(false);
    });
  });

  describe('#getParens', () => {
    it('returns the parens, innermost first, or an empty array', () => {
      expect(parseSql('a').getParens()).toEqual([]);
      expect(parseSql('(( a ))').getParens()).toEqual([
        { leftSpacing: ' ', rightSpacing: ' ' },
        { leftSpacing: '', rightSpacing: '' },
      ]);
    });
  });

  describe('#hasParens', () => {
    it('says whether there are parens', () => {
      expect(parseSql('a').hasParens()).toBe(false);
      expect(parseSql('(a)').hasParens()).toBe(true);
    });
  });

  describe('#changeParens', () => {
    it('removes parens when given an empty array', () => {
      const ex = parseSql('(a)').changeParens([]);
      expect(ex.parens).toBeUndefined();
      expect(ex.toString()).toEqual('a');
    });

    it('returns the same instance when there are no parens to remove', () => {
      const ex = parseSql('a');
      expect(ex.changeParens([])).toBe(ex);
    });
  });

  describe('#addParens', () => {
    it('works with single lines', () => {
      expect(parseSql(`COUNT(*)`).addParens().toString()).toEqual(`(COUNT(*))`);
    });

    it('works with multiple lines', () => {
      expect(
        parseSql(sane`
          SELECT
            datasource d,
            COUNT(*) AS num_segments
          FROM sys.segments
        `)
          .addParens()
          .toString(),
      ).toEqual(sane`
        (
          SELECT
            datasource d,
            COUNT(*) AS num_segments
          FROM sys.segments
        )
      `);
    });

    it('uses the given spacing', () => {
      expect(parseSql('a').addParens(' ', '  ').toString()).toEqual('( a  )');
    });

    it('stacks on existing parens', () => {
      expect(parseSql('(a)').addParens().toString()).toEqual('((a))');
    });
  });

  describe('#ensureParens', () => {
    it('adds parens when there are none', () => {
      expect(parseSql('a').ensureParens().toString()).toEqual('(a)');
    });

    it('keeps existing parens', () => {
      const ex = parseSql('( a )');
      expect(ex.ensureParens()).toBe(ex);
    });
  });

  describe('#removeOwnParenSpaces', () => {
    it('removes the spacing inside parens', () => {
      expect(parseSql('(  ( a ) )').removeOwnParenSpaces().toString()).toEqual('((a))');
    });

    it('returns the same instance when there are no parens', () => {
      const ex = parseSql('a');
      expect(ex.removeOwnParenSpaces()).toBe(ex);
    });
  });

  describe('#resetOwnSpacing', () => {
    it('resets spacing to the defaults', () => {
      expect(parseSql('COUNT(  *  )').resetOwnSpacing().toString()).toEqual('COUNT(*)');
    });

    it('returns the same instance when there is no spacing', () => {
      const ex = SqlColumn.create('x');
      expect(ex.resetOwnSpacing()).toBe(ex);
    });
  });

  describe('#resetOwnKeywords', () => {
    it('resets only its own keywords to the defaults', () => {
      expect(parseSql('case when a then 1 end').resetOwnKeywords().toString()).toEqual(
        'CASE when a then 1 END',
      );
    });

    it('returns the same instance when there are no keywords', () => {
      const ex = SqlColumn.create('x');
      expect(ex.resetOwnKeywords()).toBe(ex);
    });
  });

  describe('#normalizeOwnKeywordSpaces', () => {
    it('normalizes the spacing within keywords but keeps their casing', () => {
      expect(parseSql('x is\n  not null').normalizeOwnKeywordSpaces().toString()).toEqual(
        'x is not null',
      );
    });

    it('returns the same instance when there are no keywords', () => {
      const ex = SqlColumn.create('x');
      expect(ex.normalizeOwnKeywordSpaces()).toBe(ex);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('returns the same instance by default', () => {
      const ex = SqlColumn.create('x');
      expect(ex.clearOwnSeparators()).toBe(ex);
    });
  });

  describe('#getSpace', () => {
    it('returns the stored space, even when empty', () => {
      expect(parseSql('COUNT(*)').getSpace('postArguments')).toEqual('');
    });

    it('falls back to the default', () => {
      const ex = SqlColumn.create('x');
      expect(ex.getSpace('preOp')).toEqual(' ');
      expect(ex.getSpace('preOp', '\n')).toEqual('\n');
    });
  });

  describe('#changeSpace', () => {
    it('works', () => {
      let sql = parseSql(`COUNT(*)`);
      expect(sql.getSpace('postArguments')).toEqual('');
      sql = sql.changeSpace('postArguments', '   ');
      expect(sql.getSpace('postArguments')).toEqual('   ');
      expect(sql.toString()).toEqual(`COUNT(*   )`);
    });
  });

  describe('#changeSpaces', () => {
    it('merges with the existing spacing', () => {
      const ex = parseSql('a  +  1').changeSpaces({ initial: '\n', final: ' ' });
      expect(ex.toString()).toEqual('\na  +  1 ');
    });
  });

  describe('#getKeyword', () => {
    it('returns the stored keyword', () => {
      expect(parseSql('case when a then 1 end').getKeyword('case', 'CASE')).toEqual('case');
    });

    it('falls back to the default keyword', () => {
      expect(SqlColumn.create('x').getKeyword('as', 'AS')).toEqual('AS');
    });

    it('appends the follow space', () => {
      const ex = SqlColumn.create('x');
      expect(ex.getKeyword('as', 'AS', 'postAs')).toEqual('AS ');
      expect(ex.getKeyword('as', 'AS', 'postAs', '\n')).toEqual('AS\n');
      expect(ex.changeSpace('postAs', '  ').getKeyword('as', 'AS', 'postAs')).toEqual('AS  ');
    });

    it('does not append the follow space to an empty keyword', () => {
      expect(SqlColumn.create('x').getKeyword('as', '', 'postAs')).toEqual('');
    });
  });

  describe('#toString', () => {
    it('keeps the initial and final spacing', () => {
      expect(parseSql('  a + 1\n').toString()).toEqual('  a + 1\n');
    });

    it('keeps explicit paren spacing on multi line expressions', () => {
      expect(parseSql('(a\n+ 1)').toString()).toEqual('(a\n+ 1)');
    });
  });

  describe('#walk', () => {
    const ex: SqlBase = parseSql('a + b');

    it('returns the same instance when nothing changes', () => {
      expect(ex.walk(x => x)).toBe(ex);
    });

    it('returns the original when aborted', () => {
      expect(ex.walk(() => undefined)).toBe(ex);
    });

    it('visits parents before children and passes the stack', () => {
      const seen: string[] = [];
      ex.walk((x, stack) => {
        seen.push(`${x.type}:${String(x)}:${stack.length}`);
        return x;
      });
      expect(seen).toEqual(['multi:a + b:0', 'column:a:1', 'column:b:1']);
    });

    it('does not walk inside a replacement', () => {
      const seen: string[] = [];
      const ret = ex.walk(x => {
        seen.push(String(x));
        return x === ex ? parseSql('c + d') : x;
      });
      expect(String(ret)).toEqual('c + d');
      expect(seen).toEqual(['a + b']);
    });
  });

  describe('#walkPostorder', () => {
    const ex: SqlBase = parseSql('a + b');

    it('visits children before parents', () => {
      const seen: string[] = [];
      ex.walkPostorder(x => {
        seen.push(String(x));
        return x;
      });
      expect(seen).toEqual(['a', 'b', 'a + b']);
    });

    it('returns the original when aborted', () => {
      expect(ex.walkPostorder(x => (x === ex ? undefined : x))).toBe(ex);
      expect(ex.walkPostorder(x => (String(x) === 'b' ? undefined : x))).toBe(ex);
    });

    it('sees replaced children in the parent', () => {
      expect(
        String(
          ex.walkPostorder(x =>
            x instanceof SqlColumn ? SqlColumn.optionalQuotes(x.getName().toUpperCase()) : x,
          ),
        ),
      ).toEqual('A + B');
    });
  });

  describe('#isPart', () => {
    it('is true only for part types', () => {
      expect((parseSql('CASE WHEN a THEN b END') as SqlCase).whenThenParts.first().isPart()).toBe(
        true,
      );
      expect(parseSql('a').isPart()).toBe(false);
    });
  });

  describe('#some', () => {
    const ex: SqlBase = parseSql('a + b * 2');

    it('is true when some node matches', () => {
      expect(ex.some(x => x instanceof SqlLiteral)).toBe(true);
    });

    it('is false when no node matches', () => {
      expect(ex.some(x => x instanceof SqlTable)).toBe(false);
    });
  });

  describe('#every', () => {
    it('is true when every node matches', () => {
      expect(SqlBase.parseSql('a').every(x => x instanceof SqlColumn)).toBe(true);
    });

    it('is false when some node does not match', () => {
      expect(SqlBase.parseSql('a + 1').every(x => x instanceof SqlColumn)).toBe(false);
    });
  });

  describe('#collect', () => {
    it('collects every matching node in order', () => {
      expect(
        SqlBase.parseSql('a + 1 + b + 2')
          .collect((x): x is SqlLiteral => x instanceof SqlLiteral)
          .map(String),
      ).toEqual(['1', '2']);
    });
  });

  describe('#find', () => {
    it('finds the first matching node', () => {
      expect(
        String(
          SqlBase.parseSql('a + 1 + b + 2').find((x): x is SqlLiteral => x instanceof SqlLiteral),
        ),
      ).toEqual('1');
    });

    it('returns undefined when nothing matches', () => {
      expect(SqlBase.parseSql('a + b').find((x): x is SqlLiteral => x instanceof SqlLiteral)).toBe(
        undefined,
      );
    });
  });

  describe('#getColumns', () => {
    it('returns all the columns', () => {
      expect(parseSql('b + a + b').getColumns().map(String)).toEqual(['b', 'a', 'b']);
    });
  });

  describe('#getUsedColumnNames', () => {
    it('returns sorted unique column names', () => {
      expect(parseSql('b + a + t.b').getUsedColumnNames()).toEqual(['a', 'b']);
    });
  });

  describe('#getTables', () => {
    it('returns all the tables', () => {
      expect(
        parseSql('SELECT * FROM t2 JOIN sys.t1 ON t2.x = t1.x').getTables().map(String),
      ).toEqual(['t2', 'sys.t1']);
    });
  });

  describe('#getUsedTableNames', () => {
    it('returns sorted unique table names', () => {
      expect(
        parseSql('SELECT * FROM t2 JOIN t1 ON t2.x = t1.x JOIN t2 ON TRUE').getUsedTableNames(),
      ).toEqual(['t1', 't2']);
    });
  });

  describe('#getFirstTableName', () => {
    it('returns the name of the first table', () => {
      expect(parseSql('SELECT * FROM t2 JOIN t1 ON TRUE').getFirstTableName()).toEqual('t2');
    });

    it('returns undefined when there is no table', () => {
      expect(parseSql('SELECT 1').getFirstTableName()).toBeUndefined();
    });
  });

  describe('#getFirstSchema', () => {
    it('returns the namespace of the first table that has one', () => {
      expect(parseSql('SELECT * FROM t2 JOIN sys.t1 ON TRUE').getFirstSchema()).toEqual('sys');
    });

    it('returns undefined when no table has a namespace', () => {
      expect(parseSql('SELECT * FROM t').getFirstSchema()).toBeUndefined();
    });
  });

  describe('#contains', () => {
    const ex = parseSql('a + (b * 2)');

    it('is true when a node equals the thing', () => {
      expect(ex.contains(parseSql('(b * 2)'))).toBe(true);
      expect(ex.contains(SqlColumn.optionalQuotes('a'))).toBe(true);
    });

    it('is false otherwise', () => {
      expect(ex.contains(parseSql('b * 2'))).toBe(false);
      expect(ex.contains(SqlColumn.optionalQuotes('c'))).toBe(false);
    });
  });

  describe('#containsColumnName', () => {
    it('checks for a column with the given name', () => {
      const ex = parseSql('t.a + 1');
      expect(ex.containsColumnName('a')).toBe(true);
      expect(ex.containsColumnName('t')).toBe(false);
    });
  });

  describe('#containsFunction', () => {
    const sql: SqlBase = parseSql(`SUM(A) + COUNT(*) + 1`);

    it('works', () => {
      expect(sql.containsFunction('SUM')).toBe(true);
      expect(sql.containsFunction('Count')).toBe(true);
      expect(sql.containsFunction('Blah')).toBe(false);
    });
  });

  describe('#getFirstColumnName', () => {
    it('returns the name of the first column', () => {
      expect(parseSql('1 + b + a').getFirstColumnName()).toEqual('b');
    });

    it('returns undefined when there are no columns', () => {
      expect(parseSql('1 + 2').getFirstColumnName()).toBeUndefined();
    });
  });

  describe('#addClarifyingParens', () => {
    it('adds parens to AND/OR nested in AND/OR', () => {
      expect(parseSql('a AND b OR c AND d').addClarifyingParens().toString()).toEqual(
        '(a AND b) OR (c AND d)',
      );
    });

    it('leaves existing parens and other operators alone', () => {
      expect(parseSql('(a AND b) OR c + d = 1').addClarifyingParens().toString()).toEqual(
        '(a AND b) OR c + d = 1',
      );
      expect(parseSql('NOT (a AND b)').addClarifyingParens().toString()).toEqual('NOT (a AND b)');
    });
  });

  describe('#prettify', () => {
    const ex = parseSql('a  AND  b   OR  c');

    it('resets spacing and keywords and clarifies', () => {
      expect(ex.prettify().toString()).toEqual('(a AND b) OR c');
    });

    it('can preserve keyword casing', () => {
      expect(
        parseSql('case  when a then 1\n  end').prettify({ keywordCasing: 'preserve' }).toString(),
      ).toEqual('case when a then 1 end');
      expect(parseSql('a  and b Or c').prettify({ keywordCasing: 'preserve' }).toString()).toEqual(
        '(a and b) Or c',
      );
      expect(parseSql('a  and b Or c').prettify().toString()).toEqual('(a AND b) OR c');
    });

    it('can skip the clarifying parens', () => {
      expect(ex.prettify({ clarifyingParens: 'disable' }).toString()).toEqual('a AND b OR c');
    });

    it('keeps a lower case naked function a function', () => {
      expect(parseSql('current_timestamp').prettify().toString()).toEqual('CURRENT_TIMESTAMP');
    });

    it('upper cases the unit of an interval', () => {
      expect(parseSql(`x - interval '1' day`).prettify().toString()).toEqual(
        `x - INTERVAL '1' DAY`,
      );
    });
  });

  describe('#prettyTrim', () => {
    it('works in basic case', () => {
      expect(
        parseSql(
          `abcd_efgh_ijkl_mnop_qrst_uvwx_yz.abcd_efgh_ijkl_mnop_qrst_uvwx_yz = 'abcd_efgh_ijkl_mnop_qrst_uvwx_yz'`,
        )
          .prettyTrim(10)
          .toString(),
      ).toEqual(`"abcd_ef..."."abcd_ef..." = 'abcd_ef...'`);
    });

    it('works with COUNT(*)', () => {
      expect(parseSql(`COUNT(*)`).prettyTrim(10).toString()).toEqual(`COUNT(*)`);
    });
  });

  describe('#apply', () => {
    it('calls the function with itself', () => {
      expect(SqlBase.parseSql('a').apply(x => `${x} is here`)).toEqual('a is here');
    });
  });

  describe('#applyIf', () => {
    const ex: SqlBase = parseSql('a');

    it('applies the then function when the condition is truthy', () => {
      expect(String(ex.applyIf(1, x => x.addParens()))).toEqual('(a)');
    });

    it('applies the else function when the condition is falsy', () => {
      expect(
        String(
          ex.applyIf(
            '',
            x => x.addParens(),
            x => x.changeSpace('initial', ' '),
          ),
        ),
      ).toEqual(' a');
    });

    it('returns itself when the condition is falsy and there is no else function', () => {
      expect(ex.applyIf(false, x => x.addParens())).toBe(ex);
    });
  });

  describe('#applyForEach', () => {
    it('applies the function for each thing in turn', () => {
      expect(
        String(
          SqlBase.parseSql('a').applyForEach(['<', '>'] as const, (x, s, i) =>
            x.changeSpace(i ? 'final' : 'initial', s),
          ),
        ),
      ).toEqual('<a>');
    });
  });
});
