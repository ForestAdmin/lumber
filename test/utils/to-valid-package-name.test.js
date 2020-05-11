const toValidPackageName = require('../../utils/to-valid-package-name');

describe('utils > toValidPackageName', () => {
  it('should not convert valid package names', () => {
    expect.assertions(7);

    const names = [
      'some-package',
      'example.com',
      'under_score',
      '123numeric',
      '@npm/thingy',
      '@jane/foo.js',
      '-',
    ];

    names.forEach((name) => {
      expect(toValidPackageName(name)).toStrictEqual(name);
    });
  });

  it('should convert invalid package names to valid package names', () => {
    expect.assertions(6);

    const names = [
      { original: 'with space', expected: 'with-space' },
      { original: '  with many   space   ', expected: 'with-many-space' },
      { original: 'SHOULD BE LOWER CASE', expected: 'should-be-lower-case' },
      { original: '--a¨*£%¨*+/.?:=›Îﬂ---z-', expected: 'a-z' },
      { original: '∆™Ÿª', expected: 'lumber-project' },
      { original: '', expected: 'lumber-project' },
    ];

    names.forEach((name) => {
      expect(toValidPackageName(name.original)).toStrictEqual(name.expected);
    });
  });
});
