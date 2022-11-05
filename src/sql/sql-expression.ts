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
  SqlColumn,
  SqlComparison,
  SqlFunction,
  SqlLiteral,
  SqlMulti,
  SqlOrderByDirection,
  SqlOrderByExpression,
  SqlPlaceholder,
  SqlUnary,
} from '.';
import { parseSql } from './parser';
import { SqlBase, Substitutor } from './sql-base';
import { SeparatedArray, Separator } from './utils';

export interface DecomposeViaAndOptions {
  flatten?: boolean;
}

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

  static and(...args: (SqlExpression | undefined)[]): SqlExpression {
    const compactArgs = filterMap(args, a => {
      if (!a) return;
      if (a instanceof SqlMulti) {
        return a.ensureParens();
      }
      return a;
    });

    switch (compactArgs.length) {
      case 0:
        return SqlLiteral.TRUE;

      case 1:
        return compactArgs[0]!;

      default:
        return new SqlMulti({
          op: 'AND',
          args: SeparatedArray.fromArray(compactArgs, Separator.symmetricSpace('AND')),
        });
    }
  }

  static or(...args: (SqlExpression | undefined)[]): SqlExpression {
    const compactArgs = filterMap(args, a => {
      if (!a) return;
      if (a instanceof SqlMulti) {
        return a.ensureParens();
      }
      return a;
    });

    switch (compactArgs.length) {
      case 0:
        return SqlLiteral.FALSE;

      case 1:
        return compactArgs[0]!;

      default:
        return new SqlMulti({
          op: 'OR',
          args: SeparatedArray.fromArray(compactArgs, Separator.symmetricSpace('OR')),
        });
    }
  }

  static fromTimeRefAndInterval(timeRef: SqlColumn, interval: string | string[]): SqlExpression {
    if (Array.isArray(interval)) {
      return SqlExpression.or(
        ...interval.map(int => SqlExpression.fromTimeRefAndInterval(timeRef, int)),
      );
    }

    const parts = interval.split('/');
    if (parts.length !== 2) throw new Error(`can not convert interval: ${interval}`);

    const start = new Date(parts[0]!);
    if (isNaN(start.valueOf())) throw new Error(`can not parse the start of interval: ${interval}`);

    const end = new Date(parts[1]!);
    if (isNaN(end.valueOf())) throw new Error(`can not parse the end of interval: ${interval}`);

    return SqlLiteral.create(start)
      .lessThanOrEqual(timeRef)
      .and(timeRef.lessThan(SqlLiteral.create(end)));
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

  public convertToTable(): SqlExpression {
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

  // SqlUnary

  public not(): SqlUnary {
    return SqlUnary.not(this);
  }

  public negate(): SqlExpression {
    return this.not();
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

  public in(values: (SqlExpression | LiteralValue)[]): SqlComparison {
    return SqlComparison.in(this, values);
  }

  public notIn(values: (SqlExpression | LiteralValue)[]): SqlComparison {
    return SqlComparison.notIn(this, values);
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

  public and(expression: SqlExpression): SqlExpression {
    return SqlExpression.and(this, expression);
  }

  public or(expression: SqlExpression): SqlExpression {
    return SqlExpression.or(this, expression);
  }

  public decomposeViaAnd(_options?: DecomposeViaAndOptions): SqlExpression[] {
    return [this];
  }

  public filterAnd(fn: (ex: SqlExpression) => boolean): SqlExpression | undefined {
    if (!fn(this)) return;
    return this;
  }

  public removeColumnFromAnd(column: string): SqlExpression | undefined {
    return this.filterAnd(ex => !ex.containsColumnName(column));
  }

  public fillPlaceholders(fillWith: (SqlExpression | LiteralValue)[]): SqlExpression {
    let i = 0;
    return this.walk(ex => {
      if (ex instanceof SqlPlaceholder) {
        if (i === fillWith.length) {
          return ex;
        }

        return SqlExpression.wrap(fillWith[i++]!); // We checked above that i is in range
      }
      return ex;
    }) as SqlExpression;
  }

  // SqlFunction

  public cast(asType: string): SqlExpression {
    return SqlFunction.cast(this, asType);
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
        } catch (e: any) {
          if (e.message === 'column reference outside aggregation') {
            return x.addWhereExpression(filter);
          }
          throw e;
        }
      } else if (x instanceof SqlColumn) {
        throw new Error('column reference outside aggregation');
      }
      return x;
    }) as SqlExpression;
  }
}
