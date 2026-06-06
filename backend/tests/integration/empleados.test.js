require('../setup');
const { tokenAdmin, tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-07: Gestión de empleados (solo administrador)', () => {
  beforeEach(() => dbMock.reset());

  test('CP-07.1 — Registrar empleado como admin (contraseña hasheada con bcrypt)', async () => {
    dbMock.pushResult([]); // usuario no existe
    dbMock.pushResult([
      { id_empleado: 3, nombre: 'Pedro', apellido: 'Gómez', usuario: 'pgomez', rol: 'secretaria', activo: true },
    ]);

    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({
        nombre: 'Pedro',
        apellido: 'Gómez',
        numero_documento: '3030303030',
        cargo: 'Operador',
        usuario: 'pgomez',
        contrasena: 'temp123',
        rol: 'secretaria',
      });

    expect(res.status).toBe(201);
    // CP-14.1 — Inspeccionamos los argumentos del INSERT para verificar que la contraseña va hasheada
    const insertCall = dbMock.calls.find((c) => /INSERT INTO empleado/i.test(c.text));
    expect(insertCall).toBeDefined();
    const hashAlmacenado = insertCall.params[5];
    expect(hashAlmacenado).toMatch(/^\$2[ab]\$10\$/); // bcrypt 10 rounds
    expect(hashAlmacenado).not.toBe('temp123');
  });

  test('CP-07.2 — Secretaria no puede registrar empleados', async () => {
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', `Bearer ${tokenSecretaria()}`)
      .send({
        nombre: 'X',
        apellido: 'Y',
        numero_documento: '0',
        cargo: 'C',
        usuario: 'u',
        contrasena: 'p',
        rol: 'secretaria',
      });
    expect(res.status).toBe(403);
  });

  test('CP-07.3 — Desactivar empleado conserva sus registros (RB-08)', async () => {
    dbMock.pushResult([{ id_empleado: 2, nombre: 'María', apellido: 'López', activo: false }]);

    const res = await request(app)
      .put('/api/empleados/2/desactivar')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(200);
    expect(res.body.empleado.activo).toBe(false);
    expect(res.body.mensaje).toBe('Empleado desactivado');
  });

  test('Crear empleado con rol inválido → 400', async () => {
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({
        nombre: 'X',
        apellido: 'Y',
        numero_documento: '1',
        cargo: 'C',
        usuario: 'u',
        contrasena: 'p',
        rol: 'super-admin',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Rol debe ser/);
  });

  test('Crear empleado con usuario duplicado → 409', async () => {
    dbMock.pushResult([{ id_empleado: 2, usuario: 'mlopez' }]);
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({
        nombre: 'X',
        apellido: 'Y',
        numero_documento: '1',
        cargo: 'C',
        usuario: 'mlopez',
        contrasena: 'p',
        rol: 'secretaria',
      });
    expect(res.status).toBe(409);
  });

  test('Listar empleados como admin', async () => {
    dbMock.pushResult([
      { id_empleado: 1, usuario: 'admin', rol: 'administrador' },
      { id_empleado: 2, usuario: 'secretaria', rol: 'secretaria' },
    ]);
    const res = await request(app)
      .get('/api/empleados')
      .set('Authorization', `Bearer ${tokenAdmin()}`);
    expect(res.body).toHaveLength(2);
  });
});
