// Lógica pura de cálculo de cobro — testeable de forma unitaria sin DB.
// Implementa las reglas de negocio RB-02 (mínimo 1 hora) y RB-03 (redondeo hacia arriba).

function calcularHorasCobradas(horasTranscurridas) {
  if (typeof horasTranscurridas !== 'number' || Number.isNaN(horasTranscurridas) || horasTranscurridas < 0) {
    throw new Error('horasTranscurridas debe ser un número >= 0');
  }
  // RB-02: mínimo 1 hora · RB-03: fracciones se cobran como hora completa
  return Math.max(1, Math.ceil(horasTranscurridas));
}

function calcularValorTotal({ horasTranscurridas, valorHora, mensualidadVigente }) {
  // RB-04: con mensualidad vigente no se cobra
  if (mensualidadVigente) {
    return { horasCobradas: calcularHorasCobradas(horasTranscurridas), valorTotal: 0, esMensualidad: true };
  }
  if (typeof valorHora !== 'number' || valorHora < 0) {
    throw new Error('valorHora debe ser un número >= 0');
  }
  const horasCobradas = calcularHorasCobradas(horasTranscurridas);
  return { horasCobradas, valorTotal: horasCobradas * valorHora, esMensualidad: false };
}

function mensualidadEstaVigente({ fechaInicio, fechaFin, fechaActual, activa }) {
  if (!activa) return false;
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const hoy = new Date(fechaActual);
  // RB-05: la mensualidad vence al final del último día (fecha_fin >= hoy)
  return inicio <= hoy && hoy <= fin;
}

module.exports = {
  calcularHorasCobradas,
  calcularValorTotal,
  mensualidadEstaVigente,
};
