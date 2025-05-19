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

import type { LiteralValue, RefName, SqlMultiOp, SqlOrderByDirection, SqlType } from '.';
import {
  SqlAlias,
  SqlColumn,
  SqlComparison,
  SqlFunction,
  SqlLiteral,
  SqlMulti,
  SqlOrderByExpression,
  SqlPlaceholder,
  SqlUnary,
} from '.';
import { parse as parseSql } from './parser';
import type { Substitutor } from './sql-base';
import { SqlBase } from './sql-base';

export interface DecomposeViaOptions {
  flatten?: boolean;
  preserveParens?: boolean;
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

  static verify(input: SqlExpression): SqlExpression {
    if (input instanceof SqlExpression) return input;
    throw new TypeError('must be a SqlExpression');
  }

  static and(...args: (SqlExpression | undefined)[]): SqlExpression {
    return SqlMulti.createIfNeeded(
      'AND',
      args.flatMap(a => {
        if (a == null) return [];
        if (a instanceof SqlLiteral && a.value === true) {
          return []; // Skip no-op TRUE this is a special case
        }
        if (a instanceof SqlMulti) return a.flattenIfNeeded('AND');
        return SqlExpression.verify(a);
      }),
    );
  }

  static or(...args: (SqlExpression | undefined)[]): SqlExpression {
    return SqlMulti.createIfNeeded(
      'OR',
      args.flatMap(a => {
        if (a == null) return [];
        if (a instanceof SqlLiteral && a.value === false) {
          return []; // Skip no-op FALSE this is a special case
        }
        if (a instanceof SqlMulti) return a.flattenIfNeeded('OR');
        return SqlExpression.verify(a);
      }),
    );
  }

  static concat(...args: (SqlExpression | undefined)[]): SqlExpression {
    return SqlMulti.createIfNeeded(
      '||',
      args.flatMap(a => {
        if (a == null) return [];
        if (a instanceof SqlMulti) return a.flattenIfNeeded('||');
        return SqlExpression.verify(a);
      }),
    );
  }

  static add(...args: (SqlExpression | undefined)[]): SqlExpression {
    return SqlMulti.createIfNeeded(
      '+',
      args.flatMap(a => {
        if (a == null) return [];
        if (a instanceof SqlMulti) return a.flattenIfNeeded('+');
        return SqlExpression.verify(a);
      }),
    );
  }

  static subtract(...args: (SqlExpression | undefined)[]): SqlExpression {
    if (!args[0]) throw new Error('first argument to subtract must be defined');
    return SqlMulti.createIfNeeded(
      '-',
      args.flatMap(a => {
        if (a == null) return [];
        if (a instanceof SqlMulti) return a.flattenIfNeeded('+');
        return SqlExpression.verify(a);
      }),
    );
  }

  static multiply(...args: (SqlExpression | undefined)[]): SqlExpression {
    return SqlMulti.createIfNeeded(
      '*',
      args.flatMap(a => {
        if (a == null) return [];
        if (a instanceof SqlMulti) return a.flattenIfNeeded('*');
        return SqlExpression.verify(a);
      }),
    );
  }

  static divide(...args: (SqlExpression | undefined)[]): SqlExpression {
    if (!args[0]) throw new Error('first argument to divide must be defined');
    return SqlMulti.createIfNeeded(
      '/',
      args.flatMap(a => {
        if (a == null) return [];
        if (a instanceof SqlMulti) return a.flattenIfNeeded('*');
        return SqlExpression.verify(a);
      }),
    );
  }

  static fromTimeExpressionAndInterval(
    time: SqlExpression,
    interval: string | string[],
  ): SqlExpression {
    if (Array.isArray(interval)) {
      return SqlExpression.or(
        ...interval.map(int => SqlExpression.fromTimeExpressionAndInterval(time, int)),
      );
    }

    const parts = interval.split('/');
    if (parts.length !== 2) throw new Error(`can not convert interval: ${interval}`);

    const start = new Date(parts[0]!);
    if (isNaN(start.valueOf())) throw new Error(`can not parse the start of interval: ${interval}`);

    const end = new Date(parts[1]!);
    if (isNaN(end.valueOf())) throw new Error(`can not parse the end of interval: ${interval}`);

    return SqlLiteral.create(start)
      .lessThanOrEqual(time)
      .and(time.lessThan(SqlLiteral.create(end)));
  }

  static arrayOfLiterals(xs: LiteralValue[]) {
    return SqlFunction.array(...xs);
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

  // Alias

  public as(alias: RefName | string, forceQuotes?: boolean): SqlAlias {
    return SqlAlias.create(this, alias, forceQuotes);
  }

  public setAlias(alias: RefName | string | undefined, forceQuotes?: boolean): SqlExpression {
    if (!alias) return this.getUnderlyingExpression();
    return SqlAlias.create(this, alias, forceQuotes);
  }

  public ifUnnamedAliasAs(alias: RefName | string, forceQuotes?: boolean): SqlExpression {
    return SqlAlias.create(this, alias, forceQuotes);
  }

  public getUnderlyingExpression(): SqlExpression {
    return this;
  }

  public changeUnderlyingExpression(newExpression: SqlExpression): SqlExpression {
    return newExpression;
  }

  public getOutputName(): string | undefined {
    return;
  }

  public convertToTable(): SqlExpression {
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

  public isNotDistinctFrom(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.isNotDistinctFrom(this, rhs);
  }

  public isDistinctFrom(rhs: SqlExpression | LiteralValue): SqlComparison {
    return SqlComparison.isDistinctFrom(this, rhs);
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

  public and(...expressions: SqlExpression[]): SqlExpression {
    return SqlExpression.and(this, ...expressions);
  }

  public or(...expressions: SqlExpression[]): SqlExpression {
    return SqlExpression.or(this, ...expressions);
  }

  public concat(...expressions: SqlExpression[]): SqlExpression {
    return SqlExpression.concat(this, ...expressions);
  }

  public add(...expressions: SqlExpression[]): SqlExpression {
    return SqlExpression.add(this, ...expressions);
  }

  public subtract(...expressions: SqlExpression[]): SqlExpression {
    return SqlExpression.subtract(this, ...expressions);
  }

  public multiply(...expressions: SqlExpression[]): SqlExpression {
    return SqlExpression.multiply(this, ...expressions);
  }

  public divide(...expressions: SqlExpression[]): SqlExpression {
    return SqlExpression.divide(this, ...expressions);
  }

  public flatten(_flatteningOp?: SqlMultiOp): SqlExpression {
    return this;
  }

  public decomposeViaAnd(_options?: DecomposeViaOptions): SqlExpression[] {
    return [this];
  }

  public decomposeViaOr(_options?: DecomposeViaOptions): SqlExpression[] {
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

  public cast(asType: SqlType | string): SqlExpression {
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

  /**
   * Updates a specific clause
   * @param clause the new clause to add
   * @returns the updated where clause
   * @deprecated
   */
  public changeClauseInWhere(clause: SqlExpression | string) {
    const parsed = SqlExpression.parse(clause);
    if (String(this) === 'TRUE') {
      return parsed;
    } else {
      let currentClauses = this.decomposeViaAnd();

      const usedColumnNames = parsed.getUsedColumnNames();
      if (usedColumnNames.length === 1) {
        const clauseColumn = usedColumnNames[0];
        currentClauses = currentClauses.filter(c => {
          const cUsedColumn = c.getUsedColumnNames();
          return cUsedColumn.length !== 1 || cUsedColumn[0] !== clauseColumn;
        });
      }

      return SqlExpression.and(...currentClauses, parsed);
    }
  }

  /**
   * Toggles a specific clause
   * @param clause the clause to toggle
   * @returns the updated where clause
   * @deprecated
   */
  public toggleClauseInWhere(clause: SqlExpression | string) {
    const parsed = SqlExpression.parse(clause);
    if (String(this) === 'TRUE') {
      return parsed;
    } else {
      const currentClauses = this.decomposeViaAnd();
      const currentClausesWithoutClause = currentClauses.filter(c => !c.equals(parsed));

      if (currentClauses.length === currentClausesWithoutClause.length) {
        return SqlExpression.and(...currentClauses, parsed);
      } else {
        return SqlExpression.and(...currentClausesWithoutClause);
      }
    }
  }
}
