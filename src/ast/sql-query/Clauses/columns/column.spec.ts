import { Column, OrExpression, String } from '../../../index';

describe('single column Tests', () => {
  it('column with no brackets to string', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new String({ chars: 'value', quote: "'", spacing: [[''], ['']] }),
      }),
      alias: null,
      spacing: [['']],
    });
    expect(val.toString()).toMatchSnapshot();
  });
  it('column addparen', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new String({ chars: 'value', quote: "'", spacing: [[''], ['']] }),
      }),
      alias: null,
      spacing: [['']],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val).toMatchSnapshot();
  });
  it('column addparen to string', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new String({ chars: 'value', quote: "'", spacing: [[''], ['']] }),
      }),
      alias: null,
      spacing: [['']],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val.toString()).toMatchSnapshot();
  });
  it('column getBasicValue with bracket', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new String({ chars: 'value', quote: "'", spacing: [[''], ['']] }),
      }),
      alias: null,
      spacing: [['']],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val.getBasicValue()).toMatchSnapshot();
  });
  it('column getAlias', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new String({ chars: 'value', quote: "'", spacing: [[''], ['']] }),
      }),
      alias: null,
      spacing: [['']],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val.getBasicValue()).toMatchSnapshot();
  });
});
