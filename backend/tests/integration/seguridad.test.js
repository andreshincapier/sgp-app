require('../setup');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

describe('CP-14: Pruebas de seguridad (RNF-03, RB-09)', () => {
  beforeEach(() => dbMock.reset());

  test('CP-14.2 — Inyección SQL en login no compromete autenticación', async () => {
    // El backend usa pg con parámetros $1 — el "or 1=1" se trata como literal
    dbMock.pushResult([]); // no encuentra usuario "admin' OR '1'='1"

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: "admin' OR '1'='1", contrasena: 'cualquiera' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
    // Verificamos que la consulta fue parametrizada (no concatenada)
    const loginCall = dbMock.calls[0];
    expect(loginCall.text).toMatch(/\$1/); // usa placeholders
    expect(loginCall.params[0]).toBe("admin' OR '1'='1");
  });

  test('CP-14.3 — Token JWT con firma alterada → 401', async () => {
    const tokenManipulado = jwt.sign({ id: 1, rol: 'administrador' }, 'OTRO_SECRET');

    const res = await request(app)
      .get('/api/ocupacion')
      .set('Authorization', `Bearer ${tokenManipulado}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Sesión expirada/);
  });

  test('CP-14.4 — Token JWT expirado → 401', async () => {
    const tokenExpirado = jwt.sign(
      { id: 1, usuario: 'admin', rol: 'administrador' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/ocupacion')
      .set('Authorization', `Bearer ${tokenExpirado}`);

    expect(res.status).toBe(401);
  });

  test('CP-14.5 — Acceso a endpoint admin con rol secretaria → 403', async () => {
    const res = await request(app)
      .get('/api/reportes/recaudacion?fecha_inicio=2026-05-01&fecha_fin=2026-05-31')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('No tiene permisos para realizar esta acción');
  });

  test('Header Authorization mal formado → 401', async () => {
    const res = await request(app)
      .get('/api/ocupacion')
      .set('Authorization', 'Token abc.def.ghi'); // no usa "Bearer"

    expect(res.status).toBe(401);
  });

  test('Sin header Authorization → 401', async () => {
    const res = await request(app).get('/api/ocupacion');
    expect(res.status).toBe(401);
  });
});
