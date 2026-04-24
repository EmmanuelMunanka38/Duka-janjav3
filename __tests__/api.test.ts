// API integration tests are skipped in CI/local unit runs.

describe.skip('API integration tests (skipped)', () => {
  test('placeholder', () => {
    expect(true).toBe(true);
  });
});
