require('../setup');
const { tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-10 / CP-11: Búsqueda y registro de vehículos', () => {
  beforeEach(() => dbMock.reset());

  test('CP-10.1 — Búsqueda exitosa por placa', async () => {
    dbMock.pushResult([
      {
        id_vehiculo: 1,
        placa: 'ABC123',
        tipo_vehiculo: 'automóvil',
        propietario: 'Juan Pérez',
        hora_entrada: null,
      },
    ]);

    const res = await request(app)
      .get('/api/vehiculos/buscar/ABC123')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body[0].placa).toBe('ABC123');
  });

  test('CP-10.3 — Búsqueda sin resultados → 404', async () => {
    dbMock.pushResult([]);

    const res = await request(app)
      .get('/api/vehiculos/buscar/ZZZ999')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('No se encontraron resultados');
  });

  test('CP-11.1 — Historial con registros ordenados', async () => {
    dbMock.pushResult([
      {
        id_registro: 10,
        placa: 'ABC123',
        fecha_entrada: '2026-05-20',
        fecha_salida: '2026-05-20',
        valor_total: '9000',
      },
      {
        id_registro: 9,
        placa: 'ABC123',
        fecha_entrada: '2026-05-15',
        fecha_salida: '2026-05-15',
        valor_total: '6000',
      },
    ]);

    const res = await request(app)
      .get('/api/vehiculos/historial/ABC123')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.registros).toHaveLength(2);
  });

  test('CP-11.2 — Historial filtrado por rango de fechas', async () => {
    dbMock.pushResult([{ id_registro: 5, placa: 'ABC123', fecha_entrada: '2026-03-15' }]);

    const res = await request(app)
      .get('/api/vehiculos/historial/ABC123?fecha_inicio=2026-03-01&fecha_fin=2026-03-31')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    // Verifica que se pasaron los parámetros de filtro
    const queryCall = dbMock.calls[0];
    expect(queryCall.params).toContain('2026-03-01');
    expect(queryCall.params).toContain('2026-03-31');
  });

  test('CP-11.3 — Vehículo sin historial', async () => {
    dbMock.pushResult([]);

    const res = await request(app)
      .get('/api/vehiculos/historial/NEW001')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/no tiene registros de estadía/);
    expect(res.body.registros).toEqual([]);
  });

  test('Registrar vehículo nuevo', async () => {
    dbMock.pushResult([]); // placa no existe
    dbMock.pushResult([
      {
        id_vehiculo: 5,
        placa: 'NEW123',
        id_tipo_vehiculo: 3,
        id_propietario: 1,
      },
    ]);

    const res = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({
        placa: 'new123',
        id_tipo_vehiculo: 3,
        id_propietario: 1,
        modelo: 'Aveo',
        color: 'blanco',
        anio: 2023,
      });

    expect(res.status).toBe(201);
    expect(res.body.vehiculo.placa).toBe('NEW123');
  });

  test('Registrar vehículo con placa duplicada → 409', async () => {
    dbMock.pushResult([{ id_vehiculo: 1, placa: 'ABC123' }]);

    const res = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({ placa: 'ABC123', id_tipo_vehiculo: 3, id_propietario: 1 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Ya existe un vehículo con esta placa');
  });

  test('Registrar vehículo sin campos requeridos → 400', async () => {
    const res = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({ placa: 'ABC123' });
    expect(res.status).toBe(400);
  });

  test('Listar tipos de vehículo activos', async () => {
    dbMock.pushResult([
      { id_tipo_vehiculo: 1, nombre: 'bicicleta' },
      { id_tipo_vehiculo: 3, nombre: 'automóvil' },
    ]);

    const res = await request(app)
      .get('/api/vehiculos/tipos')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
