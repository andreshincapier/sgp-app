require('../setup');
const bcrypt = require('bcrypt');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-01: Autenticación de usuario (POST /api/auth/login)', () => {
  beforeEach(() => dbMock.reset());

  test('CP-01.1 — Login exitoso del administrador retorna token JWT', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    dbMock.pushResult([
      {
        id_empleado: 1,
        usuario: 'admin',
        nombre: 'Carlos',
        apellido: 'García',
        rol: 'administrador',
        activo: true,
        contrasena_hash: hash,
      },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', contrasena: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario).toEqual({
      id: 1,
      nombre: 'Carlos García',
      rol: 'administrador',
    });
  });

  test('CP-01.2 — Login exitoso de la secretaria con rol correcto', async () => {
    const hash = await bcrypt.hash('secre123', 10);
    dbMock.pushResult([
      {
        id_empleado: 2,
        usuario: 'secretaria',
        nombre: 'María',
        apellido: 'López',
        rol: 'secretaria',
        activo: true,
        contrasena_hash: hash,
      },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'secretaria', contrasena: 'secre123' });

    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('secretaria');
  });

  test('CP-01.3 — Contraseña incorrecta retorna 401 con mensaje genérico', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    dbMock.pushResult([
      {
        id_empleado: 1,
        usuario: 'admin',
        contrasena_hash: hash,
        activo: true,
        rol: 'administrador',
        nombre: 'Carlos',
        apellido: 'García',
      },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', contrasena: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
    expect(res.body.token).toBeUndefined();
  });

  test('CP-01.4 — Usuario inexistente retorna mismo mensaje genérico (sin enumeración)', async () => {
    dbMock.pushResult([]); // empleado no encontrado

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'fantasma', contrasena: 'cualquiera' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  test('CP-07.4 — Cuenta desactivada bloquea el login', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    dbMock.pushResult([
      {
        id_empleado: 1,
        usuario: 'admin',
        contrasena_hash: hash,
        activo: false,
        rol: 'administrador',
        nombre: 'Carlos',
        apellido: 'García',
      },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', contrasena: 'admin123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Cuenta desactivada. Contacte al administrador');
  });

  test('payload sin usuario o contraseña → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin' });
    expect(res.status).toBe(400);
  });
});
