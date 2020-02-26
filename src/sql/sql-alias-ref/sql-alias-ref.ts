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

import { SqlRef } from '..';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlAliasRefValue extends SqlBaseValue {
  column: SqlBase;
  postColumn?: string;
  asKeyword: string;
  postAs?: string;
  alias: SqlRef;
}

export class SqlAliasRef extends SqlBase {
  public column: SqlBase;
  public postColumn?: string;
  public asKeyword: string;
  public postAs?: string;
  public alias: SqlRef;

  static type = 'alias-ref';

  static aliasfactory(column: SqlBase, alias: string) {
    return new SqlAliasRef({
      column: column,
      postColumn: ' ',
      asKeyword: 'AS',
      postAs: ' ',
      alias: SqlRef.fromNameWithDoubleQuotes(alias),
    } as SqlAliasRef);
  }
  constructor(options: SqlAliasRefValue) {
    super(options, SqlAliasRef.type);
    this.column = options.column;
    this.postColumn = options.postColumn;
    this.asKeyword = options.asKeyword;
    this.postAs = options.postAs;
    this.alias = options.alias;
  }

  public valueOf() {
    const value: any = super.valueOf();
    value.column = this.column;
    value.postColumn = this.postColumn;
    value.asKeyword = this.asKeyword;
    value.postAs = this.postAs;
    value.alias = this.alias;
    return value as SqlAliasRefValue;
  }

  public toRawString(): string {
    if (!this.column) throw Error('not a valid alias');
    return (
      this.column + (this.postColumn || ' ') + this.asKeyword + this.postAs + this.alias.toString()
    );
  }
}

SqlBase.register(SqlAliasRef.type, SqlAliasRef);
