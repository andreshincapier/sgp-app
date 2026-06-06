require('../setup');
const { tokenAdmin, tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-05: Gestión de tarifas (RB-06: solo administrador)', () => {
  beforeEach(() => dbMock.reset());

  test('CP-05.4 — GET /api/tarifas devuelve tarifas activas', async () => {
    dbMock.pushResult([
      { id_tarifa: 1, tipo_vehiculo: 'bicicleta', valor_hora: '500.00' },
      { id_tarifa: 2, tipo_vehiculo: 'motocicleta', valor_hora: '1500.00' },
      { id_tarifa: 3, tipo_vehiculo: 'automóvil', valor_hora: '3000.00' },
    ]);

    const res = await request(app)
      .get('/api/tarifas')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].tipo_vehiculo).toBe('bicicleta');
  });

  test('CP-05.1 — Modificar tarifa como administrador', async () => {
    dbMock.pushResult([{ id_tarifa: 3, id_tipo_vehiculo: 3, valor_hora: '3000.00' }]); // SELECT actual
    dbMock.pushResult([]); // UPDATE desactivar
    dbMock.pushResult([{ id_tarifa: 7, id_tipo_vehiculo: 3, valor_hora: '3500.00', activa: true }]);

    const res = await request(app)
      .put('/api/tarifas/3')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ valor_hora: 3500 });

    expect(res.status).toBe(200);
    expect(res.body.tarifa.valor_hora).toBe('3500.00');
  });

  test('CP-05.2 — Secretaria no puede modificar tarifas (RB-06)', async () => {
    const res = await request(app)
      .put('/api/tarifas/3')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({ valor_hora: 3500 });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('No tiene permisos para realizar esta acción');
  });

  test('CP-05.3 — Crear tarifa duplicada → 409', async () => {
    dbMock.pushResult([{ id_tarifa: 2, id_tipo_vehiculo: 2, valor_hora: '1500.00' }]);

    const res = await request(app)
      .post('/api/tarifas')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ id_tipo_vehiculo: 2, valor_hora: 1700 });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Ya existe una tarifa activa/);
  });

  test('Crear tarifa sin campos requeridos → 400', async () => {
    const res = await request(app)
      .post('/api/tarifas')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
