require('../setup');
const { tokenSecretaria } = require('../helpers/auth');

jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');

const request = require('supertest');
const app = require('../../src/app');

function pushIngresoActivo({ horas, placa = 'ABC123', tipo = 'automóvil', idTipo = 3, idVehiculo = 1, idRegistro = 100 } = {}) {
  // 1ª query: ingreso activo + datos vehículo
  dbMock.pushResult([
    {
      id_registro: idRegistro,
      id_vehiculo: idVehiculo,
      placa,
      id_tipo_vehiculo: idTipo,
      tipo_vehiculo: tipo,
      fecha_entrada: '2026-06-06',
      hora_entrada: '08:00:00',
    },
  ]);
  // 2ª query: tiempo transcurrido (en horas)
  dbMock.pushResult([{ horas }]);
}

describe('CP-03 / CP-04: Registro de salida y cobro automático', () => {
  beforeEach(() => dbMock.reset());

  test('CP-03.1 — Cobro estándar 3 horas × $3000 = $9000', async () => {
    pushIngresoActivo({ horas: 3 });
    dbMock.pushResult([]); // sin mensualidad
    dbMock.pushResult([{ id_tarifa: 3, valor_hora: 3000 }]); // tarifa vigente
    dbMock.pushResult([{ id_tarifa: 3 }]); // UPDATE registro con tarifa
    dbMock.pushResult([
      { id_registro: 100, valor_total: 9000, horas_cobradas: 3, hora_salida: '11:00:00', es_mensualidad: false },
    ]);
    dbMock.pushResult([{ nextval: 1 }]); // seq_recibo
    dbMock.pushResult([{ id_recibo: 1, numero_recibo: 'R-00001', id_registro: 100 }]);

    const res = await request(app)
      .post('/api/salidas/ABC123')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body.recibo.horas_cobradas).toBe(3);
    expect(res.body.recibo.valor_total).toBe(9000);
    expect(res.body.recibo.es_mensualidad).toBe(false);
    expect(res.body.recibo.numero_recibo).toBe('R-00001');
  });

  test('CP-03.2 — Redondeo hacia arriba (RB-03): 2h 15min cobra 3h × $3000 = $9000', async () => {
    pushIngresoActivo({ horas: 2.25 });
    dbMock.pushResult([]);
    dbMock.pushResult([{ id_tarifa: 3, valor_hora: 3000 }]);
    dbMock.pushResult([{ id_tarifa: 3 }]);
    dbMock.pushResult([{ valor_total: 9000, horas_cobradas: 3 }]);
    dbMock.pushResult([{ nextval: 2 }]);
    dbMock.pushResult([{ id_recibo: 2, numero_recibo: 'R-00002' }]);

    const res = await request(app)
      .post('/api/salidas/ABC123')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.body.recibo.horas_cobradas).toBe(3);
    expect(res.body.recibo.valor_total).toBe(9000);
  });

  test('CP-03.3 — Cobro mínimo 1 hora (RB-02): 10 minutos en moto cobra $1500', async () => {
    pushIngresoActivo({ horas: 10 / 60, placa: 'XYZ789', tipo: 'motocicleta', idTipo: 2 });
    dbMock.pushResult([]);
    dbMock.pushResult([{ id_tarifa: 2, valor_hora: 1500 }]);
    dbMock.pushResult([{ id_tarifa: 2 }]);
    dbMock.pushResult([{ valor_total: 1500, horas_cobradas: 1 }]);
    dbMock.pushResult([{ nextval: 3 }]);
    dbMock.pushResult([{ id_recibo: 3, numero_recibo: 'R-00003' }]);

    const res = await request(app)
      .post('/api/salidas/XYZ789')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.body.recibo.horas_cobradas).toBe(1);
    expect(res.body.recibo.valor_total).toBe(1500);
  });

  test('CP-03.4 — Camión 4 horas × $8000 = $32000 (RB-10)', async () => {
    pushIngresoActivo({ horas: 4, placa: 'CAM001', tipo: 'camión', idTipo: 6 });
    dbMock.pushResult([]);
    dbMock.pushResult([{ id_tarifa: 6, valor_hora: 8000 }]);
    dbMock.pushResult([{ id_tarifa: 6 }]);
    dbMock.pushResult([{ valor_total: 32000, horas_cobradas: 4 }]);
    dbMock.pushResult([{ nextval: 4 }]);
    dbMock.pushResult([{ id_recibo: 4, numero_recibo: 'R-00004' }]);

    const res = await request(app)
      .post('/api/salidas/CAM001')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.body.recibo.valor_total).toBe(32000);
  });

  test('CP-04.1 — Mensualidad vigente fuerza cobro $0 (RB-04)', async () => {
    pushIngresoActivo({ horas: 8, placa: 'MEN001' });
    // mensualidad vigente
    dbMock.pushResult([{ id_mensualidad: 1, fecha_inicio: '2026-05-01', fecha_fin: '2026-12-31' }]);
    dbMock.pushResult([{ valor_total: 0, horas_cobradas: 8, es_mensualidad: true }]);
    dbMock.pushResult([{ nextval: 5 }]);
    dbMock.pushResult([{ id_recibo: 5, numero_recibo: 'R-00005' }]);

    const res = await request(app)
      .post('/api/salidas/MEN001')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('Cubierto por plan mensual');
    expect(res.body.recibo.valor_total).toBe(0);
    expect(res.body.recibo.es_mensualidad).toBe(true);
  });

  test('CP-03.6 — Salida sin ingreso activo → 404', async () => {
    dbMock.pushResult([]); // no hay ingreso activo

    const res = await request(app)
      .post('/api/salidas/NOA001')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('No se encontró un ingreso activo para esta placa');
  });

  test('Sin tarifa activa para el tipo → 400', async () => {
    pushIngresoActivo({ horas: 2 });
    dbMock.pushResult([]); // sin mensualidad
    dbMock.pushResult([]); // sin tarifa

    const res = await request(app)
      .post('/api/salidas/ABC123')
      .set('Authorization', `Bearer ${tokenSecretaria()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No hay tarifa activa/);
  });

  test('Sin token → 401', async () => {
    const res = await request(app).post('/api/salidas/ABC123');
    expect(res.status).toBe(401);
  });
});
