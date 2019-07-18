import { sqlParserFactory } from './parser/druidsql';
import { toString } from './druidsqltostring';

const parser = sqlParserFactory([
  'COUNT',
  'SUM',
  'MIN',
  'MAX',
  'AVG',
  'APPROX_COUNT_DISTINCT',
  'APPROX_COUNT_DISTINCT_DS_HLL',
  'APPROX_COUNT_DISTINCT_DS_THETA',
  'APPROX_QUANTILE',
  'APPROX_QUANTILE_DS',
  'APPROX_QUANTILE_FIXED_BUCKETS',
  'BLOOM_FILTER',
  'ABS',
  'CEIL',
  'EXP',
  'FLOOR',
  'LN',
  'LOG10',
  'POWER',
  'SQRT',
  'TRUNCATE',
  'TRUNC',
  'ROUND',
  'MOD',
  'SIN',
  'COS',
  'TAN',
  'COT',
  'ASIN',
  'ACOS',
  'ATAN',
  'ATAN2',
  'DEGREES',
  'RADIANS',
  'CONCAT',
  'TEXTCAT',
  'STRING_FORMAT',
  'LENGTH',
  'CHAR_LENGTH',
  'CHARARACTER_LENGTH',
  'STRLEN',
  'LOOKUP',
  'LOWER',
  'PARSE_LONG',
  'POSITION',
  'REGEXP_EXTRACT',
  'REPLACE',
  'STRPOS',
  'SUBSTRING',
  'RIGHT',
  'LEFT',
  'SUBSTR',
  'TRIM',
  'BTRIM',
  'LTRIM',
  'RTRIM',
  'UPPER',
  'REVERSE',
  'REPEAT',
  'LPAD',
  'RPAD',
  'CURRENT_TIMESTAMP',
  'CURRENT_DATE',
  'DATE_TRUNC',
  'TIME_FLOOR',
  'TIME_SHIFT',
  'TIME_EXTRACT',
  'TIME_PARSE',
  'TIME_FORMAT',
  'MILLIS_TO_TIMESTAMP',
  'TIMESTAMP_TO_MILIS',
  'EXTRACT',
  'FLOOR',
  'CEIL',
  'TIMESTAMPADD',
  'timestamp_expr',
  'CAST',
  'NULLIF',
  'COALESCE',
  'BLOOM_FILTER_TEST',
]);

describe('Expression Tests', () => {
  it('parsers a basic math expression', () => {
    expect(parser(`1 + 1`)).toMatchSnapshot();
  });

  it('parsers an expression with all operators', () => {
    expect(parser(`1 + 1 / 1 * 1 - 1`)).toMatchSnapshot();
  });

  it('parsers an expression with brackets', () => {
    expect(
      parser(`
    2 * (3 + 4)
    `),
    ).toMatchSnapshot();
  });

  it('parsers an expression with string values', () => {
    expect(parser('\'column\' = "value"')).toMatchSnapshot();
  });
});

describe('Druid Query Tests', () => {
  it('parsers the defaul data sources query', () => {
    expect(
      parser(
        'SELECT\n' +
          '  datasource,\n' +
          '  COUNT(*) AS num_segments,\n' +
          '  SUM(is_available) AS num_available_segments,\n' +
          '  SUM("size") AS size,\n' +
          '  SUM("num_rows") AS num_rows\n' +
          'FROM sys.segments\n' +
          'GROUP BY 1',
      ),
    ).toMatchSnapshot();
  });

  it('parsers segments query', () => {
    expect(
      parser(
        'SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
          'FROM sys.segments\n' +
          'ORDER BY "start" DESC\n' +
          'LIMIT 50',
      ),
    ).toMatchSnapshot();
  });

  it('parsers task query', () => {
    expect(
      parser(
        'SELECT\n' +
          '  "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",\n' +
          '  CASE WHEN "status" = \'RUNNING\' THEN "runner_status" ELSE "status" END AS "status",\n' +
          '  (\n' +
          '    CASE WHEN "status" = \'RUNNING\' THEN\n' +
          "     (CASE \"runner_status\" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)\n" +
          '    ELSE 1\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.tasks\n' +
          'ORDER BY "rank" DESC, "created_time" DESC',
      ),
    ).toMatchSnapshot();
  });

  it('parsers servers query', () => {
    expect(
      parser(
        'SELECT\n' +
          '  "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",\n' +
          '  (\n' +
          '    CASE "server_type"\n' +
          "    WHEN 'coordinator' THEN 7\n" +
          "    WHEN 'overlord' THEN 6\n" +
          "    WHEN 'router' THEN 5\n" +
          "    WHEN 'broker' THEN 4\n" +
          "    WHEN 'historical' THEN 3\n" +
          "    WHEN 'middle_manager' THEN 2\n" +
          "    WHEN 'peon' THEN 1\n" +
          '    ELSE 0\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.servers\n' +
          'ORDER BY "rank" DESC, "server" DESC',
      ),
    ).toMatchSnapshot();
  });
});

describe('Stringify Expression Tests', () => {
  it('parsers a basic math expression to string', () => {
    expect(toString(parser(`1 + 1`))).toMatchSnapshot();
  });

  it('parsers an expression with all operators to string', () => {
    expect(toString(parser(`1 + 1 / 1 * 1 - 1`))).toMatchSnapshot();
  });

  it('parsers an expression with brackets to string', () => {
    expect(
      toString(
        parser(`
    2 * (3 + 4)
    `),
      ),
    ).toMatchSnapshot();
  });

  it('parsers an expression with string values to string', () => {
    expect(toString(parser('\'column\' = "value"'))).toMatchSnapshot();
  });
});

describe('Druid Query Tests', () => {
  it('parsers the default data sources query to string', () => {
    expect(
      toString(
        parser(
          'SELECT\n' +
            '  datasource,\n' +
            '  COUNT(*) AS num_segments,\n' +
            '  SUM(is_available) AS num_available_segments,\n' +
            '  SUM("size") AS size,\n' +
            '  SUM("num_rows") AS num_rows\n' +
            'FROM sys.segments\n' +
            'GROUP BY 1',
        ),
      ),
    ).toMatchSnapshot();
  });

  it('parsers segments query to string', () => {
    expect(
      toString(
        parser(
          'SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
            'FROM sys.segments\n' +
            'ORDER BY "start" DESC\n' +
            'LIMIT 50',
        ),
      ),
    ).toMatchSnapshot();
  });

  it('parsers task query to string', () => {
    expect(
      toString(
        parser(
          'SELECT\n' +
            '  "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",\n' +
            '  CASE WHEN "status" = \'RUNNING\' THEN "runner_status" ELSE "status" END AS "status",\n' +
            '  (\n' +
            '    CASE WHEN "status" = \'RUNNING\' THEN\n' +
            "     (CASE \"runner_status\" WHEN 'RUNNING' THEN 4 WHEN 'PENDING' THEN 3 ELSE 2 END)\n" +
            '    ELSE 1\n' +
            '    END\n' +
            '  ) AS "rank"\n' +
            'FROM sys.tasks\n' +
            'ORDER BY "rank" DESC, "created_time" DESC',
        ),
      ),
    ).toMatchSnapshot();
  });

  it('parsers servers query to string', () => {
    expect(
      parser(
        'SELECT\n' +
          '  "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",\n' +
          '  (\n' +
          '    CASE "server_type"\n' +
          "    WHEN 'coordinator' THEN 7\n" +
          "    WHEN 'overlord' THEN 6\n" +
          "    WHEN 'router' THEN 5\n" +
          "    WHEN 'broker' THEN 4\n" +
          "    WHEN 'historical' THEN 3\n" +
          "    WHEN 'middle_manager' THEN 2\n" +
          "    WHEN 'peon' THEN 1\n" +
          '    ELSE 0\n' +
          '    END\n' +
          '  ) AS "rank"\n' +
          'FROM sys.servers\n' +
          'ORDER BY "rank" DESC, "server" DESC',
      ),
    ).toMatchSnapshot();
  });
});
