/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { StringType } from './basic-expression/string-type';
import { Columns } from './clauses/columns/columns';

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

export function basicLiteralEscape(literalValue?: string): string {
  return `'${literalValue}'`;
}
export function basicIdentifierEscape(identifierValue?: string): string {
  return `"${identifierValue}"`;
}
