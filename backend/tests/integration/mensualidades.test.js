require('../setup');
const { tokenAdmin } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-04 (mensualidades): CRUD de planes mensuales', () => {
  beforeEach(() => dbMock.reset());

  test('CP-04.3 — Crear mensualidad nueva', async () => {
    dbMock.pushResult([]); // no existe activa
    dbMock.pushResult([
      {
        id_mensualidad: 10,
        id_vehiculo: 1,
        id_propietario: 1,
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-30',
        valor_pagado: '150000',
        activa: true,
      },
    ]);

    const res = await request(app)
      .post('/api/mensualidades')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({
        id_vehiculo: 1,
        id_propietario: 1,
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-30',
        valor_pagado: 150000,
      });

    expect(res.status).toBe(201);
    expect(res.body.mensualidad.id_mensualidad).toBe(10);
  });

  test('CP-04.4 — Crear mensualidad para vehículo con plan vigente → 409', async () => {
    dbMock.pushResult([
      {
        id_mensualidad: 1,
        fecha_fin: '2026-06-30',
      },
    ]);

    const res = await request(app)
      .post('/api/mensualidades')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({
        id_vehiculo: 3,
        id_propietario: 1,
        fecha_inicio: '2026-06-15',
        fecha_fin: '2026-07-15',
        valor_pagado: 150000,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya tiene una mensualidad vigente/);
  });

  test('Anular mensualidad', async () => {
    dbMock.pushResult([{ id_mensualidad: 1, activa: false }]);

    const res = await request(app)
      .put('/api/mensualidades/1/anular')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(200);
    expect(res.body.mensualidad.activa).toBe(false);
  });

  test('Listar mensualidades activas', async () => {
    dbMock.pushResult([
      { id_mensualidad: 1, placa: 'MEN001', propietario: 'Juan Pérez', fecha_fin: '2026-12-31' },
    ]);

    const res = await request(app)
      .get('/api/mensualidades')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].placa).toBe('MEN001');
  });

  test('Crear mensualidad sin campos → 400', async () => {
    const res = await request(app)
      .post('/api/mensualidades')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ id_vehiculo: 1 });
    expect(res.status).toBe(400);
  });
});
