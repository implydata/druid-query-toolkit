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

import { RefName, SqlQuery, SqlStar } from '..';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { SqlRef } from '../sql-ref/sql-ref';

export interface SqlAliasValue extends SqlBaseValue {
  expression: SqlExpression | SqlQuery;
  alias?: RefName;
}

export class SqlAlias extends SqlBase {
  static type: SqlType = 'alias';

  static DEFAULT_AS_KEYWORD = 'AS';

  static STAR: SqlAlias;

  static fromBase(base: SqlBase): SqlAlias {
    if (base instanceof SqlAlias) return base;
    if (base instanceof SqlExpression || base instanceof SqlQuery) {
      return new SqlAlias({
        expression: base,
      });
    }
    throw new Error(`can not construct and alias from ${base.type}`);
  }

  static fromBaseAndUpgrade(base: SqlBase): SqlAlias {
    if (base instanceof SqlAlias) return base.upgrade();
    if (base instanceof SqlRef) base = base.convertToTableRef();
    if (base instanceof SqlExpression || base instanceof SqlQuery) {
      return new SqlAlias({
        expression: base,
      });
    }
    throw new Error(`can not construct and alias from ${base.type}`);
  }

  static create(expression: SqlExpression, alias?: RefName | string) {
    if (expression.type === 'query') {
      expression = expression.ensureParens();
    }
    return new SqlAlias({
      expression: expression,
      alias: alias ? (typeof alias === 'string' ? RefName.create(alias) : alias) : undefined,
    });
  }

  public readonly expression: SqlExpression | SqlQuery;
  public readonly alias?: RefName;

  constructor(options: SqlAliasValue) {
    super(options, SqlAlias.type);
    this.expression = options.expression;
    this.alias = options.alias;
  }

  public valueOf() {
    const value = super.valueOf() as SqlAliasValue;
    value.expression = this.expression;
    value.alias = this.alias;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [this.expression.toString()];

    if (this.alias) {
      if (this.keywords['as'] !== '') {
        rawParts.push(this.getSpace('preAs'), this.getKeyword('as', SqlAlias.DEFAULT_AS_KEYWORD));
      }

      rawParts.push(this.getSpace('preAlias'), this.alias.toString());
    }

    return rawParts.join('');
  }

  public changeExpression(expression: SqlExpression | SqlQuery): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public changeAlias(alias: RefName | undefined): this {
    const value = this.valueOf();
    value.alias = alias;
    return SqlBase.fromValue(value);
  }

  public changeAliasName(aliasName: string | undefined, forceQuotes = false): this {
    const { alias } = this;
    return this.changeAlias(
      aliasName
        ? alias && !forceQuotes
          ? alias.changeName(aliasName)
          : RefName.create(aliasName, forceQuotes)
        : undefined,
    );
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression as any);
    }

    return ret;
  }

  public upgrade(): this {
    const { expression } = this;
    if (expression instanceof SqlRef) {
      return this.changeExpression(expression.convertToTableRef());
    }
    return this;
  }

  public getOutputName(): string | undefined {
    if (this.alias) return this.alias.name;
    const { expression } = this;
    if (expression instanceof SqlRef) {
      return expression.getOutputName();
    }
    return;
  }

  public isStar(): boolean {
    const { expression } = this;
    return expression instanceof SqlStar;
  }
}

SqlBase.register(SqlAlias);

SqlAlias.STAR = SqlAlias.create(SqlStar.PLAIN);
