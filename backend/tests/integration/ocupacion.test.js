require('../setup');
const { tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-09: Monitor de ocupación en tiempo real (GET /api/ocupacion)', () => {
  beforeEach(() => dbMock.reset());

  test('CP-09.1 — Ocupación normal (45/100) sin alerta', async () => {
    dbMock.pushResult([{ ocupados: '45' }]);
    dbMock.pushResult([
      { tipo_vehiculo: 'automóvil', cantidad: '30' },
      { tipo_vehiculo: 'motocicleta', cantidad: '15' },
    ]);

    const res = await request(app)
      .get('/api/ocupacion')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      capacidad_total: 100,
      ocupados: 45,
      disponibles: 55,
      porcentaje_ocupacion: 45,
      alerta: null,
    });
    expect(res.body.por_tipo_vehiculo).toHaveLength(2);
  });

  test('CP-09.2 — Alta ocupación 90% genera alerta', async () => {
    dbMock.pushResult([{ ocupados: '90' }]);
    dbMock.pushResult([{ tipo_vehiculo: 'automóvil', cantidad: '90' }]);

    const res = await request(app)
      .get('/api/ocupacion')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.body.porcentaje_ocupacion).toBe(90);
    expect(res.body.alerta).toBe('Alta ocupación: solo 10 espacios disponibles');
  });

  test('CP-09.3 — Parqueadero LLENO (100/100)', async () => {
    dbMock.pushResult([{ ocupados: '100' }]);
    dbMock.pushResult([]);

    const res = await request(app)
      .get('/api/ocupacion')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.body.disponibles).toBe(0);
    expect(res.body.alerta).toBe('Parqueadero LLENO — 0 espacios disponibles');
  });

  test('Sin token → 401', async () => {
    const res = await request(app).get('/api/ocupacion');
    expect(res.status).toBe(401);
  });
});
