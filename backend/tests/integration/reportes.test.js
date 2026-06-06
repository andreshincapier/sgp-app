require('../setup');
const { tokenAdmin, tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-08: Reportes administrativos', () => {
  beforeEach(() => dbMock.reset());

  test('CP-08.1 — Reporte por rango de fechas como administrador', async () => {
    dbMock.pushResult([
      {
        total_operaciones: '25',
        total_recaudado: '300000',
        operaciones_mensualidad: '5',
        operaciones_cobro: '20',
      },
    ]);
    dbMock.pushResult([
      { tipo_vehiculo: 'automóvil', cantidad: '15', recaudado: '180000' },
      { tipo_vehiculo: 'motocicleta', cantidad: '5', recaudado: '20000' },
    ]);
    dbMock.pushResult([{ total_activas: '3', valor_total: '450000' }]);

    const res = await request(app)
      .get('/api/reportes/recaudacion?fecha_inicio=2026-05-01&fecha_fin=2026-05-31')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(200);
    expect(res.body.resumen.total_operaciones).toBe('25');
    expect(res.body.por_tipo_vehiculo).toHaveLength(2);
    expect(res.body.mensualidades.total_activas).toBe('3');
    expect(res.body.periodo.fecha_inicio).toBe('2026-05-01');
  });

  test('CP-08.2 — Secretaria no puede ver reportes (RB-06)', async () => {
    const res = await request(app)
      .get('/api/reportes/recaudacion?fecha_inicio=2026-05-01&fecha_fin=2026-05-31')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);
    expect(res.status).toBe(403);
  });

  test('CP-08.3 — Reporte sin parámetros → 400', async () => {
    const res = await request(app)
      .get('/api/reportes/recaudacion')
      .set('Authorization', `Bearer ${tokenAdmin()}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Debe especificar fecha_inicio y fecha_fin/);
  });
});
