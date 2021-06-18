const wrapQuotes = require('../../../handlerbars/helpers/wrap-quotes')

describe('wrap-quotes', () => {
  it('should not wrap', () => {
    expect(wrapQuotes('notSpecialName')).toBe('notSpecialName');
    expect(wrapQuotes('notSpecialName12')).toBe('notSpecialName12');
    expect(wrapQuotes('_notSpecialName12')).toBe('_notSpecialName12');
  });
  describe('should wrap', () => {
    expect(wrapQuotes('special Name')).toBe('\'special Name\'');
    expect(wrapQuotes(' Name')).toBe('\' Name\'');
    expect(wrapQuotes('special-name')).toBe('\'special-name\'');
    expect(wrapQuotes('@specialname')).toBe('\'@specialname\'');
    expect(wrapQuotes('1234')).toBe('\'1234\'');
  })
});
