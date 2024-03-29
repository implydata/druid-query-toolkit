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

export const RESERVED_KEYWORDS = [
  'ABS',
  'ALL',
  'ALLOCATE',
  'ALLOW',
  'ALTER',
  'AND',
  'ANY',
  'ARE',
  'ARRAY',
  'ARRAY_MAX_CARDINALITY',
  'AS',
  'ASENSITIVE',
  'ASYMMETRIC',
  'AT',
  'ATOMIC',
  'AUTHORIZATION',
  'AVG',
  'BEGIN',
  'BEGIN_FRAME',
  'BEGIN_PARTITION',
  'BETWEEN',
  'BIGINT',
  'BINARY',
  'BIT',
  'BLOB',
  'BOOLEAN',
  'BOTH',
  'BY',
  'CALL',
  'CALLED',
  'CARDINALITY',
  'CASCADED',
  'CASE',
  'CAST',
  'CEIL',
  'CEILING',
  'CHAR',
  'CHARACTER',
  'CHARACTER_LENGTH',
  'CHAR_LENGTH',
  'CHECK',
  'CLASSIFIER',
  'CLOB',
  'CLOSE',
  'CLUSTERED',
  'COALESCE',
  'COLLATE',
  'COLLECT',
  'COLUMN',
  'COMMIT',
  'CONDITION',
  'CONNECT',
  'CONSTRAINT',
  'CONTAINS',
  'CONVERT',
  'CORR',
  'CORRESPONDING',
  'COUNT',
  'COVAR_POP',
  'COVAR_SAMP',
  'CREATE',
  'CROSS',
  'CUBE',
  'CUME_DIST',
  'CURRENT',
  'CURRENT_DATE',
  'CURRENT_ROW',
  'CURRENT_TIME',
  'CURRENT_TIMESTAMP',
  'CURRENT_TRANSFORM_GROUP_FOR_TYPE',
  'CURSOR',
  'CYCLE',
  'DATE',
  'DAY',
  'DEALLOCATE',
  'DEC',
  'DECIMAL',
  'DECLARE',
  'DEFAULT',
  'DEFINE',
  'DELETE',
  'DENSE_RANK',
  'DEREF',
  'DESCRIBE',
  'DETERMINISTIC',
  'DISALLOW',
  'DISCONNECT',
  'DISTINCT',
  'DOUBLE',
  'DROP',
  'DYNAMIC',
  'EACH',
  'ELEMENT',
  'ELSE',
  'EMPTY',
  'END',
  'END_FRAME',
  'END_PARTITION',
  'EQUALS',
  'ESCAPE',
  'EVERY',
  'EXCEPT',
  'EXEC',
  'EXECUTE',
  'EXISTS',
  'EXP',
  'EXPLAIN',
  'EXTEND',
  'EXTERNAL',
  'EXTRACT',
  'FALSE',
  'FETCH',
  'FILTER',
  'FIRST_VALUE',
  'FLOAT',
  'FLOOR',
  'FOR',
  'FOREIGN',
  'FRAME_ROW',
  'FREE',
  'FROM',
  'FULL',
  'FUNCTION',
  'FUSION',
  'GET',
  'GLOBAL',
  'GRANT',
  'GROUP',
  'GROUPING',
  'GROUPS',
  'HAVING',
  'HOLD',
  'HOUR',
  'IDENTITY',
  'IMPORT',
  'IN',
  'INDICATOR',
  'INITIAL',
  'INNER',
  'INOUT',
  'INSENSITIVE',
  'INSERT',
  'INT',
  'INTEGER',
  'INTERSECT',
  'INTERSECTION',
  'INTERVAL',
  'INTO',
  'IS',
  'JOIN',
  'JSON_ARRAY',
  'JSON_ARRAYAGG',
  'JSON_EXISTS',
  'JSON_OBJECT',
  'JSON_OBJECTAGG',
  'JSON_QUERY',
  'JSON_VALUE',
  'LAG',
  'LANGUAGE',
  'LARGE',
  'LAST_VALUE',
  'LATERAL',
  'LEAD',
  'LEADING',
  'LEFT',
  'LIKE',
  'LIKE_REGEX',
  'LIMIT',
  'LN',
  'LOCAL',
  'LOCALTIME',
  'LOCALTIMESTAMP',
  'LOWER',
  'MATCH',
  'MATCHES',
  'MATCH_NUMBER',
  'MATCH_RECOGNIZE',
  'MAX',
  'MEASURES',
  'MEMBER',
  'MERGE',
  'METHOD',
  'MIN',
  'MINUS',
  'MINUTE',
  'MOD',
  'MODIFIES',
  'MODULE',
  'MONTH',
  'MULTISET',
  'NATIONAL',
  'NATURAL',
  'NCHAR',
  'NCLOB',
  'NEW',
  'NEXT',
  'NO',
  'NONE',
  'NORMALIZE',
  'NOT',
  'NTH_VALUE',
  'NTILE',
  'NULL',
  'NULLIF',
  'NUMERIC',
  'OCCURRENCES_REGEX',
  'OCTET_LENGTH',
  'OF',
  'OFFSET',
  'OLD',
  'OMIT',
  'ON',
  'ONE',
  'ONLY',
  'OPEN',
  'OR',
  'ORDER',
  'OUT',
  'OUTER',
  'OVER',
  'OVERLAPS',
  'OVERLAY',
  'PARAMETER',
  'PARTITION',
  'PARTITIONED',
  'PATTERN',
  'PER',
  'PERCENT',
  'PERCENTILE_CONT',
  'PERCENTILE_DISC',
  'PERCENT_RANK',
  'PERIOD',
  'PERMUTE',
  'PORTION',
  'POSITION',
  'POSITION_REGEX',
  'POWER',
  'PRECEDES',
  'PRECISION',
  'PREPARE',
  'PREV',
  'PRIMARY',
  'PROCEDURE',
  'RANGE',
  'RANK',
  'READS',
  'REAL',
  'RECURSIVE',
  'REF',
  'REFERENCES',
  'REFERENCING',
  'REGR_AVGX',
  'REGR_AVGY',
  'REGR_COUNT',
  'REGR_INTERCEPT',
  'REGR_SLOPE',
  'REGR_SXX',
  'REGR_SXY',
  'REGR_SYY',
  'RELEASE',
  'RESET',
  'RESULT',
  'RETURN',
  'RETURNS',
  'REVOKE',
  'RIGHT',
  'ROLLBACK',
  'ROLLUP',
  'ROW',
  'ROWS',
  'ROW_NUMBER',
  'RUNNING',
  'SAVEPOINT',
  'SCOPE',
  'SCROLL',
  'SEARCH',
  'SECOND',
  'SEEK',
  'SELECT',
  'SENSITIVE',
  'SET',
  'SHOW',
  'SIMILAR',
  'SKIP',
  'SMALLINT',
  'SOME',
  'SPECIFIC',
  'SPECIFICTYPE',
  'SQL',
  'SQLEXCEPTION',
  'SQLSTATE',
  'SQLWARNING',
  'SQRT',
  'START',
  'STATIC',
  'STDDEV_POP',
  'STDDEV_SAMP',
  'STREAM',
  'SUBMULTISET',
  'SUBSET',
  'SUBSTRING',
  'SUBSTRING_REGEX',
  'SUCCEEDS',
  'SUM',
  'SYMMETRIC',
  'SYSTEM',
  'SYSTEM_TIME',
  'TABLE',
  'TABLESAMPLE',
  'THEN',
  'TIME',
  'TIMESTAMP',
  'TIMEZONE_HOUR',
  'TIMEZONE_MINUTE',
  'TINYINT',
  'TO',
  'TRAILING',
  'TRANSLATE',
  'TRANSLATE_REGEX',
  'TRANSLATION',
  'TREAT',
  'TRIGGER',
  'TRIM',
  'TRIM_ARRAY',
  'TRUE',
  'TRUNCATE',
  'UESCAPE',
  'UNION',
  'UNIQUE',
  'UNKNOWN',
  'UNNEST',
  'UPDATE',
  'UPPER',
  'UPSERT',
  'USING',
  'VALUE',
  'VALUES',
  'VALUE_OF',
  'VARBINARY',
  'VARCHAR',
  'VARYING',
  'VAR_POP',
  'VAR_SAMP',
  'VERSIONING',
  'WHEN',
  'WHENEVER',
  'WHERE',
  'WIDTH_BUCKET',
  'WINDOW',
  'WITH',
  'WITHIN',
  'WITHOUT',
  'YEAR',
];

export const RESERVED_ALIASES = [
  'CURRENT_CATALOG',
  'CURRENT_DEFAULT_TRANSFORM_GROUP',
  'CURRENT_PATH',
  'CURRENT_ROLE',
  'CURRENT_SCHEMA',
  'CURRENT_USER',
  'SESSION_USER',
  'SYSTEM_USER',
  'USER',
];
