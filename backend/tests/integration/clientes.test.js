require('../setup');
const { tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-06: Gestión de clientes', () => {
  beforeEach(() => dbMock.reset());

  test('CP-06.1 — Registrar cliente nuevo', async () => {
    dbMock.pushResult([]); // no existe documento
    dbMock.pushResult([
      { id_propietario: 5, nombre: 'Pedro', apellido: 'Ramírez', numero_documento: '5555555555' },
    ]);

    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({
        nombre: 'Pedro',
        apellido: 'Ramírez',
        tipo_documento: 'CC',
        numero_documento: '5555555555',
        telefono: '3001112233',
        correo: 'pedro@email.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.cliente.id_propietario).toBe(5);
  });

  test('CP-06.2 — Documento duplicado → 409', async () => {
    dbMock.pushResult([{ id_propietario: 1, numero_documento: '1234567890' }]);

    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({
        nombre: 'Otro',
        apellido: 'Pérez',
        tipo_documento: 'CC',
        numero_documento: '1234567890',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Ya existe un cliente con este número de documento');
  });

  test('CP-06.3 — Búsqueda por nombre devuelve coincidencias', async () => {
    dbMock.pushResult([{ id_propietario: 1, nombre: 'Juan', apellido: 'Pérez' }]);

    const res = await request(app)
      .get('/api/clientes?buscar=Juan')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body[0].nombre).toBe('Juan');
  });

  test('Listar todos los clientes (sin búsqueda)', async () => {
    dbMock.pushResult([
      { id_propietario: 1, nombre: 'Juan' },
      { id_propietario: 2, nombre: 'Ana' },
    ]);
    const res = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);
    expect(res.body).toHaveLength(2);
  });

  test('Registrar cliente con campos faltantes → 400', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({ nombre: 'Solo nombre' });
    expect(res.status).toBe(400);
  });
});
