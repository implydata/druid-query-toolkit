import { sqlParserFactory } from './parser/druidsql';
import { FUNCTIONS } from './test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('Playground', () => {
  it('basic', () => {
    expect(
      parser(
        'SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
          'FROM sys.segments\n' +
          'ORDER BY "start" DESC\n' +
          'LIMIT 25',
      ).toString(),
    ).toEqual({});
  });
  it('basic', () => {
    expect(
      parser(
        'SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
          'FROM sys.segments\n' +
          'ORDER BY "start" DESC\n' +
          'LIMIT 25',
      ),
    ).toEqual({});
  });
});

// describe('Playground', () => {
//   it('basic', () => {
//     expect(
//       parser(`SELECT CASE WHEN "status" = 'RUNNING' THEN "runner_status" ELSE "status" END AS "status"
// FROM Customers`),
//     ).toEqual({});
//   });
// });
//
// describe('Playground', () => {
//   it('basic', () => {
//     expect(
//       parser(`SELECT CASE WHEN "status" = 'RUNNING' THEN "runner_status" ELSE "status" END AS "status"
// FROM Customers`).toString(),
//     ).toEqual({});
//   });
// });
