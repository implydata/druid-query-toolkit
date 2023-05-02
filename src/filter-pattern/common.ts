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

import type { LiteralValue, SqlExpression, SqlRecord } from '../sql';
import { SqlFunction, SqlLiteral, SqlType, SqlUnary } from '../sql';
import { filterMap } from '../utils';

export interface FilterPatternDefinition<P> {
  name: string;
  fit(ex: SqlExpression): P | undefined;
  isValid(pattern: P): boolean;
  toExpression(pattern: P): SqlExpression;
  formatWithoutNegation(pattern: P): string;
  getColumn(pattern: P): string | undefined;
  getThing(pattern: P): string | undefined;
}

export function extractOuterNot(ex: SqlExpression): [boolean, SqlExpression] {
  let negated = false;
  if (ex instanceof SqlUnary && ex.op === 'NOT') {
    negated = true;
    ex = ex.argument.changeParens([]);
  }
  return [negated, ex];
}

export function sqlRecordGetLiteralValues(record: SqlRecord): LiteralValue[] | undefined {
  const exs = record.expressions ? record.expressions.values : [];
  const values = filterMap(exs, ex => (ex instanceof SqlLiteral ? ex.value : undefined));
  return exs.length === values.length ? values : undefined;
}

export function castAsVarchar(ex: SqlExpression): SqlExpression {
  return SqlFunction.cast(ex, 'VARCHAR');
}

export function unwrapCastAsVarchar(ex: SqlExpression): SqlExpression {
  if (ex instanceof SqlFunction && ex.getEffectiveFunctionName() === 'CAST') {
    const t = ex.getArg(1);
    if (t instanceof SqlType && t.getEffectiveType() === 'VARCHAR') {
      return ex.getArg(0)!;
    }
  }
  return ex;
}
