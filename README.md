# SGP — Sistema de Gestión de Parqueadero

Sistema web para automatizar el control de ingreso y salida de vehículos en un parqueadero urbano. Desarrollado con arquitectura de tres capas (Three-Tier) desplegado con Docker.

## Arquitectura

```
┌────────────────────────────────────────────────────────────┐
│           FRONTEND — React.js 18 + Bootstrap 5              │
│                      Puerto: 3000                           │
└─────────────────────────────┬──────────────────────────────┘
                              │ HTTP/JSON (Axios)
                              ▼
┌────────────────────────────────────────────────────────────┐
│         BACKEND — Node.js 20 + Express.js 4 + JWT           │
│                      Puerto: 4000                           │
└─────────────────────────────┬──────────────────────────────┘
                              │ TCP/SQL (pg)
                              ▼
┌────────────────────────────────────────────────────────────┐
│              BASE DE DATOS — PostgreSQL 16                   │
│                      Puerto: 5432                           │
└────────────────────────────────────────────────────────────┘
```

## Requisitos previos

- Docker Desktop 20.10+
- Docker Compose (incluido en Docker Desktop)
- Puertos 3000, 4000 y 5432 disponibles

## Inicio rápido

```bash
cd sgp-app
docker-compose up --build
```

Una vez que los tres contenedores estén corriendo:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Interfaz de usuario |
| Backend API | http://localhost:4000/api | API REST |
| Health check | http://localhost:4000/api/health | Estado del servidor |

## Credenciales de acceso

| Usuario | Contraseña | Rol | Acceso |
|---------|-----------|-----|--------|
| admin | admin123 | Administrador | Tarifas, empleados, reportes, clientes, mensualidades, ingreso, salida, ocupación |
| secretaria | secre123 | Secretaria | Ingreso, salida, ocupación, clientes, mensualidades |

## Estructura del proyecto

```
sgp-app/
├── docker-compose.yml              # Orquestación de contenedores
├── db/
│   ├── init.sql                    # DDL: 8 tablas normalizadas a 3FN
│   └── seed.sql                    # Datos iniciales (tipos, tarifas, usuarios)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                # Punto de entrada Express
│       ├── config/db.js            # Pool de conexión PostgreSQL
│       ├── middleware/auth.js      # JWT + control de roles
│       └── routes/
│           ├── auth.js             # POST /api/auth/login
│           ├── ingresos.js         # POST /api/ingresos
│           ├── salidas.js          # POST /api/salidas/:placa
│           ├── vehiculos.js        # GET /api/vehiculos/buscar/:placa
│           ├── tarifas.js          # CRUD /api/tarifas
│           ├── mensualidades.js    # CRUD /api/mensualidades
│           ├── clientes.js         # CRUD /api/clientes
│           ├── empleados.js        # CRUD /api/empleados
│           ├── reportes.js         # GET /api/reportes/recaudacion
│           ├── ocupacion.js        # GET /api/ocupacion
│           └── recibos.js          # GET /api/recibos/:numero
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.js                  # Router principal
        ├── context/AuthContext.js  # Estado de autenticación
        ├── services/api.js         # Cliente HTTP con interceptor JWT
        ├── components/Navbar.js    # Navegación según rol
        └── pages/
            ├── Login.js            # Autenticación
            ├── Dashboard.js        # Panel con indicadores
            ├── Ingreso.js          # Registro de entrada
            ├── Salida.js           # Registro de salida + recibo
            ├── Ocupacion.js        # Monitor tiempo real
            ├── Tarifas.js          # Gestión de tarifas (admin)
            ├── Clientes.js         # Gestión de propietarios
            ├── Empleados.js        # Gestión de personal (admin)
            ├── Mensualidades.js    # Planes mensuales
            └── Reportes.js         # Reportes de recaudación (admin)
```

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Iniciar sesión (retorna JWT) |

### Operaciones de cabina

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/ingresos | Registrar ingreso de vehículo |
| GET | /api/ingresos/activos | Listar vehículos ingresados |
| POST | /api/salidas/:placa | Registrar salida y cobrar |

### Vehículos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/vehiculos/buscar/:placa | Buscar por placa (parcial) |
| GET | /api/vehiculos/historial/:placa | Historial de estadías |
| GET | /api/vehiculos/tipos | Listar tipos de vehículo |
| POST | /api/vehiculos | Registrar vehículo |

### Tarifas (solo administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/tarifas | Listar tarifas activas |
| POST | /api/tarifas | Crear tarifa |
| PUT | /api/tarifas/:id | Modificar tarifa |
| DELETE | /api/tarifas/:id | Desactivar tarifa |

### Clientes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/clientes | Listar/buscar clientes |
| GET | /api/clientes/:id | Detalle con vehículos |
| POST | /api/clientes | Registrar cliente |
| PUT | /api/clientes/:id | Actualizar datos |

### Empleados (solo administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/empleados | Listar empleados |
| POST | /api/empleados | Registrar empleado |
| PUT | /api/empleados/:id/desactivar | Desactivar cuenta |
| PUT | /api/empleados/:id/rol | Cambiar rol |

### Mensualidades

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/mensualidades | Listar activas |
| POST | /api/mensualidades | Crear plan mensual |
| PUT | /api/mensualidades/:id/anular | Anular mensualidad |

### Reportes (solo administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/reportes/recaudacion?fecha_inicio&fecha_fin | Reporte por rango |
| GET | /api/reportes/diario/:fecha | Reporte de un día |

### Ocupación

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/ocupacion | Estado actual del parqueadero |

### Recibos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/recibos/:numero | Consultar recibo |
| PUT | /api/recibos/:id/imprimir | Marcar como impreso |

## Base de datos

8 tablas normalizadas a tercera forma normal (3FN):

| Tabla | Descripción |
|-------|-------------|
| tipo_vehiculo | Categorías: bicicleta, motocicleta, automóvil, camioneta, bus/buseta, camión |
| propietario | Datos de los dueños de vehículos |
| vehiculo | Vehículos con placa única, vinculados a propietario y tipo |
| empleado | Personal del parqueadero con credenciales y rol |
| tarifa | Valor por hora según tipo de vehículo, con historial |
| mensualidad | Planes mensuales vinculados a vehículo y propietario |
| registro_estadia | Registros de ingreso/salida con cálculo de cobro |
| recibo | Comprobantes con número secuencial |

## Reglas de negocio implementadas

| ID | Regla | Implementación |
|----|-------|---------------|
| RB-01 | Un vehículo no puede tener dos ingresos activos | Consulta de ingreso activo antes de registrar |
| RB-02 | Cobro mínimo de 1 hora | `Math.max(1, Math.ceil(horas))` |
| RB-03 | Fracciones se cobran como hora completa | `Math.ceil()` redondea hacia arriba |
| RB-04 | Mensualidad vigente = cobro $0 | Verificación de tabla mensualidad por fecha |
| RB-05 | Mensualidad vence a las 23:59 del último día | Comparación `fecha_fin >= CURRENT_DATE` |
| RB-06 | Solo admin modifica tarifas | Middleware `soloAdmin` |
| RB-07 | Recibo con campos obligatorios | placa, tipo, hora entrada/salida, horas, tarifa, total |
| RB-08 | No se eliminan registros históricos | Solo desactivación, nunca DELETE |
| RB-09 | Solo opera con sesión activa | Middleware `verificarToken` en todas las rutas |
| RB-10 | Tarifas diferenciadas por tipo | FK a tipo_vehiculo en tabla tarifa |

## Tecnologías

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime backend | Node.js | 20 LTS |
| Framework API | Express.js | 4.18 |
| UI Library | React.js | 18.2 |
| CSS Framework | Bootstrap | 5.3 |
| Base de datos | PostgreSQL | 16 |
| Autenticación | jsonwebtoken | 9.x |
| Hash contraseñas | bcrypt | 5.x |
| HTTP Client | Axios | 1.6 |
| Contenedores | Docker + Compose | 24+ / 2.x |
| Hot reload | Nodemon | 3.x |

## Comandos útiles

```bash
# Iniciar en modo detached
docker-compose up --build -d

# Ver logs de un servicio
docker logs sgp-backend
docker logs sgp-frontend
docker logs sgp-db

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (borra datos de BD)
docker-compose down -v

# Reconstruir solo el backend
docker-compose up --build sgp-backend

# Acceder a la base de datos
docker exec -it sgp-db psql -U sgp_user -d sgp_db
```

## Pruebas automatizadas

El proyecto incluye una suite completa de pruebas automatizadas que valida los casos de prueba CP-01 a CP-15 definidos en la Entrega 4 del documento de arquitectura.

### Pruebas backend — Jest + Supertest

89 pruebas (22 unitarias + 67 de integración). No requieren Docker ni base de datos: usan un mock del pool de PostgreSQL en `tests/helpers/mockDb.js`.

```bash
cd backend
npm install
npm test                  # Ejecuta todas las pruebas
npm run test:unit         # Solo unitarias (servicio de cobro)
npm run test:integration  # Solo integración (endpoints REST)
npm run test:coverage     # Genera reporte de cobertura
```

**Cobertura actual** (umbral mínimo configurado: 80% statements/lines):

| Módulo | Statements | Branches | Functions | Lines |
|--------|-----------:|---------:|----------:|------:|
| **Global** | 82.43% | 85.82% | 78.94% | 82.55% |
| services/cobro.js | 93.75% | 93.33% | 100% | 93.33% |
| middleware/auth.js | 100% | 87.5% | 100% | 100% |
| routes/auth.js | 96.15% | 91.66% | 100% | 96% |
| routes/salidas.js | 94.28% | 90% | 100% | 94.28% |
| routes/ocupacion.js | 95% | 100% | 100% | 95% |
| routes/vehiculos.js | 90.69% | 100% | 100% | 90.69% |
| routes/recibos.js | 89.47% | 100% | 100% | 89.47% |
| routes/mensualidades.js | 86.20% | 90.90% | 100% | 86.20% |

**Suites de prueba:**

| Archivo | Tests | Casos de prueba (Entrega 4) |
|---------|------:|------------------------------|
| `tests/unit/cobro.test.js` | 22 | CP-03 (RB-02, RB-03, RB-10), CP-04 (RB-04, RB-05) |
| `tests/integration/auth.test.js` | 6 | CP-01.1 a CP-01.4, CP-07.4 |
| `tests/integration/health.test.js` | 1 | CP-15.2 |
| `tests/integration/ingresos.test.js` | 5 | CP-02.1 a CP-02.4 (RB-01) |
| `tests/integration/salidas.test.js` | 8 | CP-03.1 a CP-03.6, CP-04.1 |
| `tests/integration/ocupacion.test.js` | 4 | CP-09.1 a CP-09.3 |
| `tests/integration/tarifas.test.js` | 5 | CP-05.1 a CP-05.4 (RB-06, RB-10) |
| `tests/integration/clientes.test.js` | 5 | CP-06.1 a CP-06.3 |
| `tests/integration/empleados.test.js` | 6 | CP-07.1 a CP-07.4, CP-14.1 |
| `tests/integration/reportes.test.js` | 3 | CP-08.1 a CP-08.3 |
| `tests/integration/mensualidades.test.js` | 5 | CP-04.3, CP-04.4 |
| `tests/integration/seguridad.test.js` | 6 | CP-14.2 a CP-14.5 (RNF-03, RB-09) |
| `tests/integration/vehiculos.test.js` | 9 | CP-10.1, CP-10.3, CP-11.1 a CP-11.3 |
| `tests/integration/recibos.test.js` | 4 | CP-12.2, CP-12.3 (RB-07) |

### Pruebas E2E — Cypress

12 escenarios end-to-end ejecutados sobre el sistema desplegado con Docker. Requieren la aplicación corriendo en `http://localhost:3000`.

```bash
# 1. Levantar el sistema completo (en otra terminal)
docker-compose up --build -d

# 2. Instalar Cypress y ejecutar los specs
cd frontend
npm install
npm run cy:open    # Modo interactivo (abre la UI de Cypress)
npm run cy:run     # Modo headless (CI / línea de comandos)
```

**Specs E2E** en `frontend/cypress/e2e/`:

| Spec | Casos de prueba (Entrega 4) | Flujos validados |
|------|-----------------------------|------------------|
| `01-login.cy.js` | CP-01.1 a CP-01.5 | Login admin/secretaria, credenciales inválidas, redirect sin sesión |
| `02-ingreso-salida.cy.js` | CP-02.1, CP-02.2, CP-03.1, CP-03.6, CP-04.1 | Flujo cabina ABC123 (ingreso → salida → recibo), RB-01, RB-04 con MEN001 |
| `03-ocupacion.cy.js` | CP-09.1 | Monitor en tiempo real, indicadores del Dashboard |
| `04-control-acceso.cy.js` | CP-05.2, CP-08.2 | RBAC: secretaria sin acceso a Tarifas/Empleados/Reportes |
| `05-tarifas.cy.js` | CP-05.4 | 6 tarifas iniciales del seed (bicicleta a camión) |

**Comandos custom de Cypress** (`frontend/cypress/support/commands.js`):

- `cy.loginViaApi(usuario, contrasena)` — login vía POST y persistencia del JWT.
- `cy.loginAdmin()` / `cy.loginSecretaria()` — atajos con credenciales del seed.
- `cy.registrarIngreso(placa)` — crea un ingreso vía API como precondición.
- `cy.logout()` — limpia el localStorage.

### Mapeo a casos de prueba de la Entrega 4

| Caso | Herramienta | Ubicación |
|------|-------------|-----------|
| CP-01 Autenticación | Supertest + Cypress | `auth.test.js` + `01-login.cy.js` |
| CP-02 Ingreso | Supertest + Cypress | `ingresos.test.js` + `02-ingreso-salida.cy.js` |
| CP-03 Cálculo de cobro | Jest unit + Supertest + Cypress | `cobro.test.js` + `salidas.test.js` + `02-ingreso-salida.cy.js` |
| CP-04 Mensualidad | Jest unit + Supertest + Cypress | `cobro.test.js` + `mensualidades.test.js` + `02-ingreso-salida.cy.js` |
| CP-05 Tarifas | Supertest + Cypress | `tarifas.test.js` + `04-control-acceso.cy.js` + `05-tarifas.cy.js` |
| CP-06 Clientes | Supertest | `clientes.test.js` |
| CP-07 Empleados | Supertest | `empleados.test.js` |
| CP-08 Reportes | Supertest + Cypress | `reportes.test.js` + `04-control-acceso.cy.js` |
| CP-09 Ocupación | Supertest + Cypress | `ocupacion.test.js` + `03-ocupacion.cy.js` |
| CP-10 Búsqueda vehículo | Supertest | `vehiculos.test.js` |
| CP-11 Historial | Supertest | `vehiculos.test.js` |
| CP-12 Recibo | Supertest | `recibos.test.js` |
| CP-13 Rendimiento | JMeter (manual, externo) | Reporte JMeter del sprint 3 |
| CP-14 Seguridad | Supertest + OWASP ZAP (manual) | `seguridad.test.js` + reporte ZAP |
| CP-15 Despliegue | Supertest + manual | `health.test.js` + checklist de smoke |

### Refactor para testabilidad

Para que Supertest pueda probar la API sin levantar el servidor real:

- `src/app.js` — Express app sin `listen()`, importable desde tests.
- `src/index.js` — Bootstrap mínimo: `require('./app')` + `app.listen(PORT)`.
- `src/services/cobro.js` — Lógica pura del cálculo de cobro (RB-02, RB-03, RB-04, RB-05) extraída para pruebas unitarias sin DB.

