// Singleton mock del pool de pg. Las pruebas importan `pool` (mediante jest.mock)
// y controlan las respuestas con pushResult/pushError. reset() debe llamarse en beforeEach.

const queue = [];
const calls = [];

const pool = {
  query: jest.fn((text, params) => {
    calls.push({ text, params });
    const next = queue.shift();
    if (!next) {
      return Promise.reject(
        new Error(`No mock result queued for query: ${String(text).slice(0, 80)}...`)
      );
    }
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  }),
  end: jest.fn(),
};

function pushResult(rows = [], rowCount = rows.length) {
  queue.push({ rows, rowCount });
}

function pushError(err) {
  queue.push(err instanceof Error ? err : new Error(err));
}

function reset() {
  queue.length = 0;
  calls.length = 0;
  pool.query.mockClear();
}

module.exports = { pool, pushResult, pushError, reset, calls };
