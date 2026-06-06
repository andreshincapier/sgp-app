const {
  calcularHorasCobradas,
  calcularValorTotal,
  mensualidadEstaVigente,
} = require('../../src/services/cobro');

describe('Servicio de cobro — Reglas de negocio (CP-03)', () => {
  describe('RB-02: Cobro mínimo de 1 hora', () => {
    test('CP-03.3 — estadía de 10 minutos cobra 1 hora', () => {
      expect(calcularHorasCobradas(10 / 60)).toBe(1);
    });

    test('estadía de 0 minutos cobra 1 hora', () => {
      expect(calcularHorasCobradas(0)).toBe(1);
    });

    test('estadía de 59 minutos cobra 1 hora', () => {
      expect(calcularHorasCobradas(59 / 60)).toBe(1);
    });
  });

  describe('RB-03: Fracciones de hora se cobran como hora completa', () => {
    test('CP-03.2 — 2 horas 15 minutos cobra 3 horas', () => {
      expect(calcularHorasCobradas(2 + 15 / 60)).toBe(3);
    });

    test('1 hora 1 minuto cobra 2 horas', () => {
      expect(calcularHorasCobradas(1 + 1 / 60)).toBe(2);
    });

    test('CP-03.1 — 3 horas exactas cobran 3 horas', () => {
      expect(calcularHorasCobradas(3)).toBe(3);
    });

    test('5 horas exactas cobran 5 horas', () => {
      expect(calcularHorasCobradas(5)).toBe(5);
    });
  });

  describe('Validaciones de entrada', () => {
    test('rechaza string', () => {
      expect(() => calcularHorasCobradas('3')).toThrow();
    });

    test('rechaza valor negativo', () => {
      expect(() => calcularHorasCobradas(-1)).toThrow();
    });

    test('rechaza NaN', () => {
      expect(() => calcularHorasCobradas(NaN)).toThrow();
    });
  });

  describe('calcularValorTotal — RB-10 tarifas diferenciadas', () => {
    test('CP-03.1 — automóvil 3 horas × $3000 = $9000', () => {
      const resultado = calcularValorTotal({
        horasTranscurridas: 3,
        valorHora: 3000,
        mensualidadVigente: false,
      });
      expect(resultado).toEqual({ horasCobradas: 3, valorTotal: 9000, esMensualidad: false });
    });

    test('CP-03.3 — moto 10 minutos × $1500 = $1500 (cobro mínimo)', () => {
      const resultado = calcularValorTotal({
        horasTranscurridas: 10 / 60,
        valorHora: 1500,
        mensualidadVigente: false,
      });
      expect(resultado.valorTotal).toBe(1500);
    });

    test('CP-03.4 — camión 4 horas × $8000 = $32000', () => {
      const resultado = calcularValorTotal({
        horasTranscurridas: 4,
        valorHora: 8000,
        mensualidadVigente: false,
      });
      expect(resultado.valorTotal).toBe(32000);
    });

    test('bicicleta 1 hora × $500 = $500', () => {
      expect(
        calcularValorTotal({ horasTranscurridas: 1, valorHora: 500, mensualidadVigente: false })
          .valorTotal
      ).toBe(500);
    });

    test('camioneta 2h 30min × $4000 = $12000 (redondeo a 3h)', () => {
      expect(
        calcularValorTotal({ horasTranscurridas: 2.5, valorHora: 4000, mensualidadVigente: false })
          .valorTotal
      ).toBe(12000);
    });

    test('bus 5 horas × $10000 = $50000', () => {
      expect(
        calcularValorTotal({ horasTranscurridas: 5, valorHora: 10000, mensualidadVigente: false })
          .valorTotal
      ).toBe(50000);
    });
  });

  describe('RB-04: Mensualidad vigente cobra $0', () => {
    test('CP-04.1 — mensualidad vigente fuerza valor_total=0 sin importar horas/tarifa', () => {
      const resultado = calcularValorTotal({
        horasTranscurridas: 8,
        valorHora: 3000,
        mensualidadVigente: true,
      });
      expect(resultado.valorTotal).toBe(0);
      expect(resultado.esMensualidad).toBe(true);
      expect(resultado.horasCobradas).toBe(8);
    });
  });

  describe('mensualidadEstaVigente — RB-05', () => {
    test('mensualidad activa con fecha actual dentro del rango → vigente', () => {
      expect(
        mensualidadEstaVigente({
          fechaInicio: '2026-05-01',
          fechaFin: '2026-05-31',
          fechaActual: '2026-05-15',
          activa: true,
        })
      ).toBe(true);
    });

    test('CP-04.2 — fecha actual posterior a fecha_fin → no vigente', () => {
      expect(
        mensualidadEstaVigente({
          fechaInicio: '2026-04-01',
          fechaFin: '2026-04-30',
          fechaActual: '2026-05-15',
          activa: true,
        })
      ).toBe(false);
    });

    test('mensualidad inactiva (anulada) → no vigente aunque la fecha esté en rango', () => {
      expect(
        mensualidadEstaVigente({
          fechaInicio: '2026-05-01',
          fechaFin: '2026-05-31',
          fechaActual: '2026-05-15',
          activa: false,
        })
      ).toBe(false);
    });

    test('límite inferior — fecha actual = fecha_inicio → vigente', () => {
      expect(
        mensualidadEstaVigente({
          fechaInicio: '2026-05-01',
          fechaFin: '2026-05-31',
          fechaActual: '2026-05-01',
          activa: true,
        })
      ).toBe(true);
    });

    test('límite superior — fecha actual = fecha_fin → vigente', () => {
      expect(
        mensualidadEstaVigente({
          fechaInicio: '2026-05-01',
          fechaFin: '2026-05-31',
          fechaActual: '2026-05-31',
          activa: true,
        })
      ).toBe(true);
    });
  });
});
