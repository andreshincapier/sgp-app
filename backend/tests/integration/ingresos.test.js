require('../setup');
const { tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-02: Registro de ingreso de vehículo', () => {
  beforeEach(() => dbMock.reset());

  test('CP-02.1 — Ingreso exitoso de vehículo registrado', async () => {
    // 1ª query: SELECT vehiculo WHERE placa='ABC123' → existe
    dbMock.pushResult([{ id_vehiculo: 1, placa: 'ABC123' }]);
    // 2ª query: SELECT registro_estadia activo → no hay
    dbMock.pushResult([]);
    // 3ª query: INSERT registro_estadia
    dbMock.pushResult([{ id_registro: 100, id_vehiculo: 1, id_empleado_entrada: 2 }]);

    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({ placa: 'abc123' });

    expect(res.status).toBe(201);
    expect(res.body.mensaje).toBe('Ingreso registrado exitosamente');
    expect(res.body.registro.id_registro).toBe(100);
    expect(res.body.vehiculo.placa).toBe('ABC123');
  });

  test('CP-02.2 — Vehículo ya activo (RB-01) → 409', async () => {
    dbMock.pushResult([{ id_vehiculo: 1, placa: 'ABC123' }]);
    dbMock.pushResult([
      { id_registro: 99, id_vehiculo: 1, fecha_entrada: '2026-06-06', hora_entrada: '08:00' },
    ]);

    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({ placa: 'ABC123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('El vehículo ya se encuentra registrado como ingresado');
    expect(res.body.ingreso_activo).toBeDefined();
  });

  test('CP-02.3 — Vehículo nuevo sin tipo/propietario → 400 con requiere_registro', async () => {
    dbMock.pushResult([]); // placa no existe

    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({ placa: 'NEW999' });

    expect(res.status).toBe(400);
    expect(res.body.requiere_registro).toBe(true);
  });

  test('CP-02.4 — Sin token → 401', async () => {
    const res = await request(app).post('/api/ingresos').send({ placa: 'ABC123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Sesión expirada/);
  });

  test('payload sin placa → 400', async () => {
    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
