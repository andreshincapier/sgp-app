require('../setup');
const { tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-12: Recibo y reimpresión', () => {
  beforeEach(() => dbMock.reset());

  test('CP-12.2 — Consultar recibo por número', async () => {
    dbMock.pushResult([
      {
        id_recibo: 1,
        numero_recibo: 'R-00001',
        placa: 'ABC123',
        tipo_vehiculo: 'automóvil',
        valor_hora: '3000.00',
        horas_cobradas: 3,
        valor_total: 9000,
        es_mensualidad: false,
        propietario: 'Juan Pérez',
        impreso: false,
        fecha_emision: '2026-06-06T11:00:00Z',
      },
    ]);

    const res = await request(app)
      .get('/api/recibos/R-00001')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body.numero_recibo).toBe('R-00001');
    // RB-07: contiene todos los campos obligatorios
    expect(res.body).toHaveProperty('placa');
    expect(res.body).toHaveProperty('tipo_vehiculo');
    expect(res.body).toHaveProperty('horas_cobradas');
    expect(res.body).toHaveProperty('valor_total');
    expect(res.body).toHaveProperty('valor_hora');
    expect(res.body).toHaveProperty('fecha_emision');
  });

  test('CP-12.2b — Recibo inexistente → 404', async () => {
    dbMock.pushResult([]);

    const res = await request(app)
      .get('/api/recibos/R-99999')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Recibo no encontrado');
  });

  test('CP-12.3 — Marcar recibo como impreso', async () => {
    dbMock.pushResult([{ id_recibo: 1, impreso: true, numero_recibo: 'R-00001' }]);

    const res = await request(app)
      .put('/api/recibos/1/imprimir')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body.recibo.impreso).toBe(true);
    expect(res.body.mensaje).toBe('Recibo impreso correctamente');
  });

  test('Marcar recibo inexistente como impreso → 404', async () => {
    dbMock.pushResult([]);

    const res = await request(app)
      .put('/api/recibos/9999/imprimir')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(404);
  });
});
