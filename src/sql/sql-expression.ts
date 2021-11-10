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

import { filterMap } from '../utils';

import {
  LiteralValue,
  RefName,
  SqlAlias,
  SqlComparison,
  SqlFunction,
  SqlLiteral,
  SqlMulti,
  SqlOrderByDirection,
  SqlOrderByExpression,
  SqlPlaceholder,
  SqlRef,
} from '.';
import { parseSql } from './parser';
import { SqlBase, Substitutor } from './sql-base';
import { SeparatedArray, Separator } from './utils';

export abstract class SqlExpression extends SqlBase {
  static parse(input: string | SqlExpression): SqlExpression {
    if (typeof input === 'string') {
      const parsed = parseSql(input);
      if (!(parsed instanceof SqlExpression)) {
        throw new Error('Provided SQL was not an expression');
      }
      return parsed;
    } else if (input instanceof SqlExpression) {
      return input;
    } else {
      throw new Error('unknown input');
    }
  }

  static maybeParse(input: string | SqlExpression): SqlExpression | undefined {
    try {
      return SqlExpression.parse(input);
    } catch {
      return;
    }
  }

  static wrap(input: SqlExpression | LiteralValue): SqlExpression {
    return input instanceof SqlExpression ? input : SqlLiteral.create(input);
  }

  static and(...args: (SqlExpression | string | undefined)[]): SqlExpression {
    const compactArgs = filterMap(args, a => {
      if (!a) return;
      a = SqlExpression.parse(a);
      if (a instanceof SqlMulti && a.op === 'OR') {
        return a.ensureParens();
      }
      return a;
    });

    if (compactArgs.length === 0) {
      return SqlLiteral.TRUE;
    } else if (compactArgs.length === 1) {
      return compactArgs[0];
    } else {
      return new SqlMulti({
        op: 'AND',
        args: SeparatedArray.fromArray(compactArgs, Separator.symmetricSpace('AND')),
      });
    }
  }

  // ------------------------------

  public _walkHelper(
    stack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    const ret = super._walkHelper(stack, fn, postorder);
    if (!ret) return;
    if (ret === this) return this;
    if (ret instanceof SqlExpression) {
      return ret;
    } else {
      throw new Error('expression walker must return a SQL expression');
    }
  }

  public _walkInner(
    _nextStack: SqlBase[],
    _fn: Substitutor,
    _postorder: boolean,
  ): SqlExpression | undefined {
    return this;
  }

  public as(alias: RefName | string | undefined, forceQuotes?: boolean): SqlExpression {
    if (!alias) return this.getUnderlyingExpression();
    return SqlAlias.create(this, alias, forceQuotes);
  }

  public ifUnnamedAliasAs(alias: RefName | string, forceQuotes?: boolean): SqlExpression {
    return SqlAlias.create(this, alias, forceQuotes);
  }

  public convertToTableRef(): SqlExpression {
    return this;
  }

  public getAliasName(): string | undefined {
    return;
  }

  public getOutputName(): string | undefined {
    return;
  }

  public getUnderlyingExpression(): SqlExpression {
    return this;
  }

  public toOrderByExpression(direction?: SqlOrderByDirection): SqlOrderByExpression {
    return SqlOrderByExpression.create(this, direction);
  }

  // SqlComparison

  public equal(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.equal(this, rhs);
  }

  public unequal(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.unequal(this, rhs);
  }

  public lessThan(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.lessThan(this, rhs);
  }

  public greaterThan(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.greaterThan(this, rhs);
  }

  public lessThanOrEqual(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.lessThanOrEqual(this, rhs);
  }

  public greaterThanOrEqual(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.greaterThanOrEqual(this, rhs);
  }

  public isNull(): SqlComparison {
    return SqlComparison.isNull(this);
  }

  public isNotNull(): SqlComparison {
    return SqlComparison.isNotNull(this);
  }

  public like(rhs: SqlExpression | string, escape?: SqlExpression | string): SqlComparison {
    return SqlComparison.like(this, rhs, escape);
  }

  public between(
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return SqlComparison.between(this, start, end);
  }

  public notBetween(
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return SqlComparison.notBetween(this, start, end);
  }

  public betweenSymmetric(
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return SqlComparison.betweenSymmetric(this, start, end);
  }

  public notBetweenSymmetric(
    start: SqlExpression | LiteralValue,
    end: SqlExpression | LiteralValue,
  ): SqlComparison {
    return SqlComparison.notBetweenSymmetric(this, start, end);
  }

  // SqlMulti

  public and(expression: SqlExpression | string): SqlExpression {
    return SqlExpression.and(this, expression);
  }

  public decomposeViaAnd(): SqlExpression[] {
    return [this];
  }

  public filterAnd(fn: (ex: SqlExpression) => boolean): SqlExpression | undefined {
    if (!fn(this)) return;
    return this;
  }

  public removeColumnFromAnd(column: string): SqlExpression | undefined {
    return this.filterAnd(ex => !ex.containsColumn(column));
  }

  public fillPlaceholders(fillWith: (SqlExpression | LiteralValue)[]): SqlExpression {
    let i = 0;
    return this.walk(ex => {
      if (ex instanceof SqlPlaceholder) {
        if (i === fillWith.length) {
          return ex;
        }

        let filler = fillWith[i++];
        if (!(filler instanceof SqlExpression)) {
          if (typeof filler === 'string') {
            filler = SqlExpression.parse(filler);
          } else {
            filler = SqlLiteral.create(filler);
          }
        }

        return filler;
      }
      return ex;
    }) as SqlExpression;
  }

  // Logic

  public addFilterToAggregations(
    filter: SqlExpression,
    knownAggregations: string[],
  ): SqlExpression {
    return this.walk(x => {
      if (x instanceof SqlFunction) {
        if (x.isAggregation(knownAggregations)) return x.addWhereExpression(filter);

        const { args } = x;
        if (!args) return x;

        try {
          return x.changeArgs(
            args.map(a => {
              return a.addFilterToAggregations(filter, knownAggregations);
            }),
          );
        } catch (e) {
          if (e.message === 'column reference outside aggregation') {
            return x.addWhereExpression(filter);
          }
          throw e;
        }
      } else if (x instanceof SqlRef) {
        throw new Error('column reference outside aggregation');
      }
      return x;
    }) as SqlExpression;
  }
}
