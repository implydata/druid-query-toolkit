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

import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../sql-base';
import { SqlColumn } from '../sql-column/sql-column';
import { SqlColumnList } from '../sql-column-list/sql-column-list';
import { SqlExpression } from '../sql-expression';
import { RefName } from '../utils';

export interface SqlAliasValue extends SqlBaseValue {
  expression: SqlExpression;
  alias: RefName;
  columns?: SqlColumnList;
}

export class SqlAlias extends SqlExpression {
  static type: SqlType = 'alias';

  static DEFAULT_AS_KEYWORD = 'AS';

  static create(
    expression: SqlExpression,
    alias: RefName | string,
    forceQuotes?: boolean,
  ): SqlAlias {
    if (expression instanceof SqlAlias) {
      return expression.changeAlias(alias, forceQuotes);
    }

    if (expression.type === 'query') {
      expression = expression.ensureParens();
    }
    return new SqlAlias({
      expression: expression,
      alias: typeof alias === 'string' ? RefName.alias(alias, forceQuotes) : alias,
    });
  }

  public readonly expression: SqlExpression;
  public readonly alias: RefName;
  public readonly columns?: SqlColumnList;

  constructor(options: SqlAliasValue) {
    super(options, SqlAlias.type);
    this.expression = options.expression;
    this.alias = options.alias;
    this.columns = options.columns;
  }

  public valueOf() {
    const value = super.valueOf() as SqlAliasValue;
    value.expression = this.expression;
    value.alias = this.alias;
    value.columns = this.columns;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [this.expression.toString()];

    if (this.keywords['as'] !== '') {
      rawParts.push(this.getSpace('preAs'), this.getKeyword('as', SqlAlias.DEFAULT_AS_KEYWORD));
    }

    rawParts.push(this.getSpace('preAlias'), this.alias.toString());

    if (this.columns) {
      rawParts.push(this.getSpace('preColumns'), this.columns.toString());
    }

    return rawParts.join('');
  }

  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public changeAlias(alias: string | RefName, forceQuotes = false): this {
    const newAlias =
      typeof alias === 'string'
        ? forceQuotes
          ? RefName.alias(alias, forceQuotes)
          : this.alias.changeNameAsAlias(alias)
        : alias;

    const value = this.valueOf();
    value.alias = newAlias;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression as any);
    }

    return ret;
  }

  public ifUnnamedAliasAs(_alias: RefName | string, _forceQuotes?: boolean): SqlExpression {
    return this;
  }

  public convertToTable(): SqlExpression {
    const { expression } = this;
    if (expression instanceof SqlColumn) {
      return this.changeExpression(expression.convertToTable());
    }
    return this;
  }

  public getAliasName(): string | undefined {
    return this.alias.name;
  }

  public getOutputName(): string | undefined {
    return this.alias.name;
  }

  public getUnderlyingExpression(): SqlExpression {
    return this.expression;
  }
}

SqlBase.register(SqlAlias);
