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

import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SqlExpression, SqlRef } from '../../sql-expression';

export interface SqlAliasValue extends SqlBaseValue {
  expression: SqlExpression;
  asKeyword?: string;
  alias?: SqlRef;
}

export class SqlAlias extends SqlBase {
  static type = 'alias';

  static fromBase(base: SqlBase): SqlAlias {
    if (base instanceof SqlAlias) return base;
    if (base instanceof SqlExpression) {
      return new SqlAlias({
        expression: base,
      });
    }
    throw new Error(`can not construct and alias from ${base.type}`);
  }

  static sqlAliasFactory(expression: SqlExpression, alias: string) {
    return new SqlAlias({
      expression: expression,
      asKeyword: 'AS',
      alias: SqlRef.fromStringWithDoubleQuotes(alias),
    });
  }

  public readonly expression: SqlExpression;
  public readonly asKeyword?: string;
  public readonly alias?: SqlRef;

  constructor(options: SqlAliasValue) {
    super(options, SqlAlias.type);
    this.expression = options.expression;
    this.asKeyword = options.asKeyword;
    this.alias = options.alias;
  }

  public valueOf() {
    const value = super.valueOf() as SqlAliasValue;
    value.expression = this.expression;
    value.asKeyword = this.asKeyword;
    value.alias = this.alias;
    return value as SqlAliasValue;
  }

  public toRawString(): string {
    const rawParts: string[] = [this.expression.toString()];

    if (this.alias) {
      if (this.asKeyword) {
        rawParts.push(this.getInnerSpace('preAs'), this.asKeyword);
      }

      rawParts.push(this.getInnerSpace('preAlias'), this.alias.toString());
    }

    return rawParts.join('');
  }

  public walk(fn: (t: SqlBase) => void) {
    super.walk(fn);
    this.expression.walk(fn);
  }

  public upgrade() {
    const { expression } = this;
    if (!(expression instanceof SqlRef)) return this;

    const value = this.valueOf();
    value.expression = expression.upgrade();
    return new SqlAlias(value);
  }

  public getOutputName(): string | undefined {
    if (this.alias) return this.alias.getName();
    const { expression } = this;
    if (expression instanceof SqlRef) {
      return expression.getColumn();
    }
    return;
  }
}

SqlBase.register(SqlAlias.type, SqlAlias);
