# Pruebas del backend — Jest + Supertest

Esta carpeta contiene la suite de pruebas automatizadas del backend del **Sistema de Gestión de Parqueadero (SGP)**. Cubre los casos de prueba CP-01 a CP-15 definidos en la Entrega 4 del documento de arquitectura del software.

## Resumen

| Indicador | Valor |
|-----------|-------|
| Total de pruebas | **89** (22 unitarias + 67 de integración) |
| Suites | **14** archivos |
| Cobertura de líneas | **82.55%** (umbral exigido: ≥ 80% — RNF-07) |
| Cobertura de branches | **85.82%** |
| Tiempo de ejecución | ~1.3 s |
| Requiere Docker | **No** — usa un mock del pool de PostgreSQL |
| Requiere base de datos | **No** |

## Prerrequisitos

- Node.js 20 LTS o superior (`node -v` → `v20.x` o `v22.x`).
- npm 10 o superior (incluido con Node 20).
- Sin necesidad de Docker, base de datos ni el frontend corriendo.

## Instalación

```bash
cd sgp-app/backend
npm install
```

Esto descarga las dependencias declaradas en `package.json`, incluyendo `jest@29` y `supertest@7` como devDependencies.

## Ejecución de pruebas

### Suite completa

```bash
npm test
```

Salida esperada:

```
Test Suites: 14 passed, 14 total
Tests:       89 passed, 89 total
Snapshots:   0 total
Time:        ~1.3 s
```

### Solo pruebas unitarias

Las pruebas unitarias validan la lógica pura del servicio de cobro (`src/services/cobro.js`) sin levantar Express ni acceder a la base de datos.

```bash
npm run test:unit
```

22 pruebas que cubren:

- **RB-02** (cobro mínimo de 1 hora) — 3 escenarios.
- **RB-03** (redondeo hacia arriba) — 4 escenarios.
- **RB-10** (tarifas diferenciadas) — 6 escenarios con todos los tipos de vehículo.
- **RB-04** (mensualidad vigente cobra $0) — 1 escenario.
- **RB-05** (vigencia por fecha) — 5 escenarios incluyendo casos límite.
- Validaciones de entrada — 3 escenarios.

### Solo pruebas de integración

Las pruebas de integración levantan la aplicación Express completa (`src/app.js`), simulan peticiones HTTP con Supertest y validan códigos de estado, payloads y headers.

```bash
npm run test:integration
```

67 pruebas distribuidas en 12 archivos:

| Archivo | Tests | Cubre |
|---------|------:|-------|
| `tests/integration/auth.test.js` | 6 | CP-01 — login admin/secretaria, contraseña incorrecta, usuario inexistente, cuenta desactivada |
| `tests/integration/health.test.js` | 1 | CP-15.2 — health check del backend |
| `tests/integration/ingresos.test.js` | 5 | CP-02 — ingreso, RB-01 (vehículo ya activo), token requerido |
| `tests/integration/salidas.test.js` | 8 | CP-03 / CP-04 — cobro estándar, redondeo, mínimo, mensualidad vigente, sin tarifa |
| `tests/integration/ocupacion.test.js` | 4 | CP-09 — ocupación normal, alerta 90%, parqueadero lleno |
| `tests/integration/tarifas.test.js` | 5 | CP-05 — RBAC admin/secretaria, duplicado, listado del seed |
| `tests/integration/clientes.test.js` | 5 | CP-06 — alta, documento duplicado, búsqueda |
| `tests/integration/empleados.test.js` | 6 | CP-07 / CP-14.1 — registro con bcrypt 10 rounds, RBAC, desactivar |
| `tests/integration/reportes.test.js` | 3 | CP-08 — reporte por rango, RBAC, sin parámetros |
| `tests/integration/mensualidades.test.js` | 5 | CP-04 — alta, duplicado, anular |
| `tests/integration/seguridad.test.js` | 6 | CP-14 — SQLi, JWT manipulado, JWT expirado, RBAC |
| `tests/integration/vehiculos.test.js` | 9 | CP-10 / CP-11 — búsqueda por placa, historial filtrado |
| `tests/integration/recibos.test.js` | 4 | CP-12 — consulta, marcar como impreso |

### Reporte de cobertura

```bash
npm run test:coverage
```

Genera el reporte detallado por archivo y verifica los umbrales mínimos exigidos por el RNF-07:

| Métrica | Umbral | Actual |
|---------|-------:|-------:|
| Statements | ≥ 80% | **82.43%** |
| Branches | ≥ 60% | **85.82%** |
| Functions | ≥ 70% | **78.94%** |
| Lines | ≥ 80% | **82.55%** |

Cobertura por módulo crítico:

| Módulo | Lines | Branches |
|--------|------:|---------:|
| `services/cobro.js` | 93.33% | 93.33% |
| `middleware/auth.js` | 100% | 87.50% |
| `routes/auth.js` | 96.00% | 91.66% |
| `routes/salidas.js` | 94.28% | 90.00% |
| `routes/ocupacion.js` | 95.00% | 100% |
| `routes/vehiculos.js` | 90.69% | 100% |
| `routes/recibos.js` | 89.47% | 100% |
| `routes/mensualidades.js` | 86.20% | 90.90% |

El reporte completo se genera en `coverage/lcov-report/index.html` (excluido de Git por `.gitignore`). Para verlo en el navegador:

```bash
open coverage/lcov-report/index.html        # macOS
xdg-open coverage/lcov-report/index.html    # Linux
start coverage/lcov-report/index.html       # Windows
```

## Estructura de la suite

```
backend/
├── src/
│   ├── app.js                  # Express app sin listener (importable desde tests)
│   ├── index.js                # Bootstrap: require('./app') + app.listen()
│   ├── config/db.js            # Pool de PostgreSQL (se mockea en pruebas)
│   ├── middleware/auth.js      # JWT + control de roles
│   ├── routes/                 # 11 archivos de endpoints REST
│   └── services/cobro.js       # Lógica pura de RB-02, RB-03, RB-04, RB-05
└── tests/
    ├── setup.js                # Fija JWT_SECRET y silencia console.error
    ├── helpers/
    │   ├── mockDb.js           # Singleton mock del pool de pg
    │   └── auth.js             # Tokens JWT precargados (admin, secretaria)
    ├── unit/
    │   └── cobro.test.js       # 22 pruebas unitarias del servicio de cobro
    └── integration/            # 12 archivos × 67 pruebas con Supertest
```

## Cómo funcionan las pruebas (sin DB real)

### Mock del pool de PostgreSQL

Las pruebas de integración no necesitan PostgreSQL: cada suite reemplaza el módulo `src/config/db.js` por un mock singleton (`tests/helpers/mockDb.js`):

```javascript
jest.mock('../../src/config/db', () => require('../helpers/mockDb').pool);
const dbMock = require('../helpers/mockDb');
```

El mock expone:

- `pushResult(rows)` — encola la respuesta del próximo `pool.query()`.
- `pushError(err)` — encola un error a lanzar.
- `reset()` — limpia la cola entre pruebas (se llama en `beforeEach`).
- `calls` — array con todas las queries ejecutadas (`{ text, params }`) para inspeccionar lo que la ruta intentó hacer.

Ejemplo de prueba:

```javascript
test('CP-02.2 — Vehículo ya activo retorna 409 (RB-01)', async () => {
  dbMock.pushResult([{ id_vehiculo: 1, placa: 'ABC123' }]);     // 1ª query: SELECT vehiculo
  dbMock.pushResult([{ id_registro: 99 }]);                     // 2ª query: SELECT registro_estadia activo

  const res = await request(app)
    .post('/api/ingresos')
    .set('Authorization', `Bearer ${tokenSecretaria()}`)
    .send({ placa: 'ABC123' });

  expect(res.status).toBe(409);
  expect(res.body.error).toBe('El vehículo ya se encuentra registrado como ingresado');
});
```

### Tokens JWT en pruebas

`tests/helpers/auth.js` emite tokens válidos firmados con el `JWT_SECRET` de pruebas (configurado en `tests/setup.js`):

```javascript
const { tokenAdmin, tokenSecretaria } = require('../helpers/auth');

// En cualquier prueba:
.set('Authorization', `Bearer ${tokenAdmin()}`)
.set('Authorization', `Bearer ${tokenSecretaria()}`)
```

## Depuración

Si una prueba falla y necesitas ver los `console.error` que el setup silencia:

```bash
DEBUG_TESTS=true npm test
```

Para correr una sola suite:

```bash
npx jest tests/integration/salidas.test.js
```

Para correr una sola prueba por nombre:

```bash
npx jest -t "CP-03.1"
```

Para modo watch (re-ejecuta al cambiar archivos):

```bash
npx jest --watch
```

## Mapeo a casos de prueba de la Entrega 4

| Caso de prueba | RF / RNF / RB | Suite | # tests |
|----------------|---------------|-------|--------:|
| CP-01 Autenticación | RF-10, RB-09 | `auth.test.js` | 6 |
| CP-02 Ingreso | RF-01, RB-01 | `ingresos.test.js` | 5 |
| CP-03 Cálculo de cobro | RF-02, RB-02, RB-03, RB-10 | `cobro.test.js` + `salidas.test.js` | 22 + 8 |
| CP-04 Mensualidad | RF-05, RB-04, RB-05 | `cobro.test.js` + `mensualidades.test.js` | 5 + 5 |
| CP-05 Tarifas | RF-04, RB-06, RB-10 | `tarifas.test.js` | 5 |
| CP-06 Clientes | RF-06 | `clientes.test.js` | 5 |
| CP-07 Empleados | RF-08, RB-08 | `empleados.test.js` | 6 |
| CP-08 Reportes | RF-09, RB-06 | `reportes.test.js` | 3 |
| CP-09 Ocupación | RF-13 | `ocupacion.test.js` | 4 |
| CP-10 Búsqueda vehículo | RF-11 | `vehiculos.test.js` | 3 |
| CP-11 Historial | RF-12 | `vehiculos.test.js` | 3 |
| CP-12 Recibo | RF-03, RB-07 | `recibos.test.js` | 4 |
| CP-14 Seguridad | RNF-03, RB-09 | `seguridad.test.js` + `empleados.test.js` (CP-14.1) | 7 |
| CP-15 Despliegue | — | `health.test.js` | 1 |

CP-13 (rendimiento) se ejecuta con Apache JMeter como prueba externa, fuera de Jest.

## Integración continua

Para correr las pruebas en un pipeline (GitHub Actions, GitLab CI, Jenkins):

```yaml
# Ejemplo .github/workflows/test.yml
- name: Backend tests
  run: |
    cd sgp-app/backend
    npm ci
    npm run test:coverage
```

El comando `npm run test:coverage` falla con código de salida ≠ 0 si la cobertura cae por debajo de los umbrales configurados, lo que detiene el pipeline automáticamente.
