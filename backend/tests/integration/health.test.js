require('../setup');
jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);

const request = require('supertest');
const app = require('../../src/app');

describe('CP-15.2: Health check del backend', () => {
  test('GET /api/health → 200 con status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
