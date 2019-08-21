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
import { Alias } from './alias';
import { CaseExpression } from './basic-expression/case-expression/case-expression';
import { FilterClause } from './basic-expression/function-call/filter-clause';
import { Function } from './basic-expression/function-call/function';
import { Interval } from './basic-expression/interval';
import { NumberType } from './basic-expression/number-type';
import { RefExpression } from './basic-expression/ref-expression';
import { StringType } from './basic-expression/string-type';
import { Sub } from './basic-expression/sub';
import { Timestamp } from './basic-expression/timestamp';
import { Column } from './clauses/columns/column';
import { Columns } from './clauses/columns/columns';
import { HavingClause } from './clauses/having-clause';
import { WhereClause } from './clauses/where-clause';
import { AdditiveExpression } from './expression/additive-expression/additive-expression';
import { AndExpression } from './expression/and-expression/and-expression';
import { AndPart } from './expression/and-expression/and-part';
import { ComparisonExpression } from './expression/comparision-expression/comparison-expression';
import { ComparisonExpressionRhs } from './expression/comparision-expression/comparison-expression-rhs';
import { MultiplicativeExpression } from './expression/multipilicative-expression/multipilcative-expression';
import { NotExpression } from './expression/not-expression/not-expression';
import { OrExpression } from './expression/or-expression/or-expression';
import { OrPart } from './expression/or-expression/or-part';
import { SqlQuery } from './sql-query';

export function renderOpenParens(parens?: Parens[]): string {
  if (!parens) return '';
  const val: string[] = [];
  parens.map(paren => {
    val.push(paren.open[0] + (paren.open[1] ? paren.open[1] : ''));
  });
  return val.join('');
}

export function renderCloseParens(parens: Parens[]): string {
  if (!parens) return '';
  const val: string[] = [];
  parens.map(paren => {
    val.push((paren.close[0] ? paren.close[0] : '') + paren.close[1]);
  });
  return val.join('');
}

export interface Parens {
  open: string[];
  close: string[];
}

export function arrayContains(StringValue?: string, arrayValue?: string[]) {
  if (!arrayValue || !StringValue) {
    return false;
  }
  return arrayValue.indexOf(StringValue) > -1;
}

export function getColumns(columns: Columns) {
  const columnsArray: string[] = [];
  columns.columns.map(column => {
    if (column.getAlias()) {
      const alias = column.getAlias();
      if (alias) {
        columnsArray.push(
          alias.value instanceof StringType ? alias.value.getBasicValue() : alias.value,
        );
      }
    } else if (column.getBasicValue()) {
      columnsArray.push(column.getBasicValue());
    }
  });
  return columnsArray;
}

export function basicLiteralEscape(literalValue?: string | number): string {
  return typeof literalValue === 'number' ? `${literalValue}` : `'${literalValue}'`;
}
export function basicIdentifierEscape(identifierValue?: string): string {
  return `"${identifierValue}"`;
}

export function aliasFactory(alias: string): Alias {
  return new Alias({
    keyword: 'AS',
    spacing: [' '],
    value: new StringType({
      spacing: [],
      chars: alias,
      quote: `"`,
    }),
  });
}

export function refExpressionFactory(
  name: string | StringType,
  nameSpace?: string | StringType,
): RefExpression {
  return new RefExpression({
    quoteSpacing: [],
    quote: '',
    namespace: nameSpace ? nameSpace : '',
    name: name,
  });
}

export function intervalFactory(unit: string, chars: string): Interval {
  return new Interval({
    intervalKeyword: 'INTERVAL',
    unitKeyword: unit,
    spacing: [' ', ' '],
    ex: new StringType({
      spacing: [],
      chars: chars,
      quote: `'`,
    }),
  });
}

export function stringFactory(chars: string, quote: '"' | "'"): StringType {
  return new StringType({
    spacing: [],
    chars: chars,
    quote: quote,
  });
}

export function timestampFactory(chars: string): Timestamp {
  return new Timestamp({
    spacing: [' '],
    value: stringFactory(chars, `'`),
    keyword: 'TIMESTAMP',
  });
}

export function functionFactory(
  name: string,
  spacing: string[],
  argumentsArray: (StringType | number | RefExpression)[],
  filter?: FilterClause,
  distinct?: boolean,
): Function {
  return new Function({
    parens: [],
    fn: name,
    value: argumentsArray,
    spacing: ['', '', '', ''],
    argumentSpacing: spacing,
    filterClause: filter,
    distinct: distinct ? 'DISTINCT' : undefined,
  });
}

export function columnFactory(ex: string | Function, alias?: Alias): Column {
  return new Column({
    spacing: [alias ? ' ' : ''],
    parens: [],
    ex: ex instanceof Function ? ex : stringFactory(ex, `"`),
    alias: alias ? alias : null,
  });
}

export function columnsFactory(columns: Column[], spacing: string[]): Columns {
  return new Columns({
    columns: columns,
    parens: [],
    spacing: spacing,
  });
}

export function numberFactory(numberValue: number): NumberType {
  return new NumberType(numberValue);
}

export function orExpressionFactory(
  ex: (OrPart | Sub | StringType | RefExpression | NumberType | Function | CaseExpression)[],
): OrExpression {
  return new OrExpression({
    ex: ex,
    parens: [],
    spacing: [],
  });
}

export function comparisonRhsFactory(
  op: string,
  rhs:
    | Sub
    | StringType
    | RefExpression
    | NumberType
    | Function
    | CaseExpression
    | string
    | number
    | AdditiveExpression
    | Timestamp,
): ComparisonExpressionRhs {
  return new ComparisonExpressionRhs({
    parens: [],
    op: op,
    rhs: rhs,
    spacing: [' '],
  });
}

export function comparisonFactory(
  ex:
    | Sub
    | StringType
    | RefExpression
    | NumberType
    | Function
    | CaseExpression
    | AdditiveExpression
    | Timestamp,
  rhs: ComparisonExpressionRhs,
): ComparisonExpression {
  return new ComparisonExpression({
    ex: ex,
    rhs: rhs,
    parens: [],
    spacing: [' '],
  });
}

export function whereFactory(
  filter:
    | OrExpression
    | AndExpression
    | ComparisonExpression
    | MultiplicativeExpression
    | AdditiveExpression
    | NotExpression
    | Sub
    | StringType
    | RefExpression
    | NumberType
    | Function
    | CaseExpression,
): WhereClause {
  return new WhereClause({
    keyword: 'WHERE',
    spacing: [' '],
    filter: filter,
  });
}

export function andExpressionFactory(
  ex: (
    | ComparisonExpression
    | AndPart
    | Sub
    | StringType
    | RefExpression
    | NumberType
    | Function
    | AdditiveExpression
    | CaseExpression)[],
): AndExpression {
  return new AndExpression({
    parens: [],
    ex: ex,
    spacing: [' AND '],
  });
}

export function subFactory(
  ex:
    | SqlQuery
    | OrExpression
    | AndExpression
    | ComparisonExpression
    | MultiplicativeExpression
    | AdditiveExpression
    | NotExpression,
): Sub {
  return new Sub({ parens: [{ open: ['(', ''], close: ['', ')'] }], ex: ex });
}

export function havingFactory(
  having:
    | OrExpression
    | AndExpression
    | ComparisonExpression
    | MultiplicativeExpression
    | AdditiveExpression
    | NotExpression
    | Sub
    | StringType
    | RefExpression
    | NumberType
    | Function
    | CaseExpression,
): HavingClause {
  return new HavingClause({
    keyword: 'HAVING',
    spacing: [' '],
    having: having,
  });
}
