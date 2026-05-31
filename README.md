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
