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
import { SqlExpression } from '../../sql-expression';
import { SeparatedArray } from '../../utils';
import { SqlQuery } from '../sql-query';

export interface SqlWithPartValue extends SqlBaseValue {
  withTable: SqlExpression;
  withColumns?: SeparatedArray<SqlBase>;
  postWithColumns: string;
  asKeyword: string;
  withQuery: SqlQuery;
}

export class SqlWithPart extends SqlBase {
  static type = 'withPart';

  public readonly withTable: SqlExpression;
  public readonly withColumns?: SeparatedArray<SqlBase>;
  public readonly postWithColumns: string;
  public readonly asKeyword: string;
  public readonly withQuery: SqlQuery;

  constructor(options: SqlWithPartValue) {
    super(options, SqlWithPart.type);
    this.withTable = options.withTable;
    this.withColumns = options.withColumns;
    this.postWithColumns = options.postWithColumns;
    this.asKeyword = options.asKeyword;
    this.withQuery = options.withQuery;
  }

  public toRawString(): string {
    const rawParts: string[] = [this.withTable.toString(), this.getInnerSpace('postWithTable')];

    if (this.withColumns) {
      rawParts.push(
        '(',
        this.getInnerSpace('postLeftParen'),
        this.withColumns.toString(),
        this.getInnerSpace('preRightParen'),
        ')',
        this.getInnerSpace('postWithColumns'),
      );
    }

    rawParts.push(this.asKeyword, this.getInnerSpace('postAs'), this.withQuery.toString());

    return rawParts.join('');
  }

  public walkInner(
    nextStack: SqlBase[],
    fn: (t: SqlBase, stack: SqlBase[]) => void,
    postorder: boolean,
  ): void {
    this.withTable.walkHelper(nextStack, fn, postorder);
    SqlBase.walkSeparatedArray(this.withColumns, nextStack, fn, postorder);
    this.withQuery.walkHelper(nextStack, fn, postorder);
  }
}

SqlBase.register(SqlWithPart.type, SqlWithPart);
