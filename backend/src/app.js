const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const vehiculoRoutes = require('./routes/vehiculos');
const ingresoRoutes = require('./routes/ingresos');
const salidaRoutes = require('./routes/salidas');
const tarifaRoutes = require('./routes/tarifas');
const clienteRoutes = require('./routes/clientes');
const empleadoRoutes = require('./routes/empleados');
const mensualidadRoutes = require('./routes/mensualidades');
const reporteRoutes = require('./routes/reportes');
const ocupacionRoutes = require('./routes/ocupacion');
const reciboRoutes = require('./routes/recibos');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/ingresos', ingresoRoutes);
app.use('/api/salidas', salidaRoutes);
app.use('/api/tarifas', tarifaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/mensualidades', mensualidadRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/ocupacion', ocupacionRoutes);
app.use('/api/recibos', reciboRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
