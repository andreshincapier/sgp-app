# Pruebas E2E del frontend — Cypress

Esta carpeta contiene la suite de pruebas end-to-end (E2E) del frontend del **Sistema de Gestión de Parqueadero (SGP)**. Cubre los flujos críticos de la operación de cabina y administración, validados directamente sobre la aplicación corriendo en `http://localhost:3000`.

## Resumen

| Indicador | Valor |
|-----------|-------|
| Total de specs | **5** archivos |
| Escenarios E2E | **~12** |
| Casos de prueba cubiertos | CP-01, CP-02, CP-03, CP-04, CP-05, CP-08, CP-09 |
| Versión de Cypress | 13.17 |
| Requiere Docker | **Sí** — frontend, backend y base de datos deben estar corriendo |
| Tiempo de ejecución | ~30–60 s en modo headless |

## Prerrequisitos

1. **Docker Desktop** corriendo (24+ recomendado).
2. Puertos `3000`, `4000` y `5432` libres en la máquina.
3. **Node.js 20** o superior con npm 10+ (para ejecutar Cypress localmente).
4. En Linux, navegador disponible (Chrome/Chromium/Firefox/Edge) o las dependencias del Electron embebido en Cypress.

## Paso 1 — Levantar el sistema

Antes de ejecutar Cypress, el sistema completo (frontend + backend + base de datos) debe estar corriendo con datos del seed:

```bash
cd sgp-app
docker-compose up -d --build
```

Verificar que los 3 contenedores estén `Up`:

```bash
docker ps
# CONTAINER         STATUS         PORTS
# sgp-frontend      Up             0.0.0.0:3000->3000/tcp
# sgp-backend       Up             0.0.0.0:4000->4000/tcp
# sgp-db            Up (healthy)   0.0.0.0:5432->5432/tcp
```

Verificar que el frontend responde:

```bash
curl http://localhost:3000 | head -5     # debe retornar HTML
curl http://localhost:4000/api/health    # debe retornar {"status":"ok",...}
```

## Paso 2 — Instalar Cypress

```bash
cd sgp-app/frontend
npm install
```

Esto descarga Cypress 13.x (~250 MB) en `node_modules/cypress` la primera vez. En Mac los siguientes `npm install` reutilizan la caché global (`~/Library/Caches/Cypress/`).

Verificar la instalación:

```bash
npx cypress --version
# Cypress package version: 13.17.0
# Cypress binary version: 13.17.0
```

## Paso 3 — Ejecutar las pruebas

### Modo interactivo (recomendado para desarrollo)

Abre la GUI de Cypress, donde puedes seleccionar los specs uno a uno y ver la ejecución en vivo:

```bash
npm run cy:open
```

1. Selecciona "E2E Testing".
2. Elige el navegador (Chrome o Electron).
3. Click en cualquier `.cy.js` para correrlo.
4. Cypress recarga automáticamente al modificar el spec.

### Modo headless (recomendado para CI / verificación rápida)

Ejecuta los 5 specs en secuencia sin interfaz gráfica:

```bash
npm run cy:run
```

Salida esperada:

```
Running:  01-login.cy.js
  ✓ CP-01.1 — Inicio de sesión exitoso como administrador
  ✓ CP-01.2 — Inicio de sesión como secretaria oculta opciones de admin
  ✓ CP-01.3 — Login fallido con contraseña incorrecta
  ✓ CP-01.4 — Login fallido con usuario inexistente
  ✓ CP-01.5 — Acceso a ruta protegida sin sesión redirige al login
  5 passing (Xs)

Running:  02-ingreso-salida.cy.js
  ...
```

### Modo full pipeline (arranca dev server + corre specs)

Si prefieres no usar Docker para el frontend y correr el dev server de React en local mientras la base de datos y el backend siguen en Docker:

```bash
# En una terminal — solo backend + db
cd sgp-app
docker-compose up -d sgp-db sgp-backend

# En otra terminal — dev server + Cypress en serie
cd sgp-app/frontend
npm run test:e2e
```

`npm run test:e2e` usa `start-server-and-test` para arrancar `npm start` (dev server en :3000), esperar a que responda, ejecutar Cypress y matar el proceso al terminar.

## Specs disponibles

| Spec | Casos de prueba (Entrega 4) | Flujos validados |
|------|-----------------------------|------------------|
| `01-login.cy.js` | CP-01.1 a CP-01.5 | Login admin (ve menú completo), secretaria (no ve Tarifas/Empleados/Reportes), credenciales inválidas, usuario inexistente, redirect sin sesión (RB-09) |
| `02-ingreso-salida.cy.js` | CP-02.1, CP-02.2, CP-03.1, CP-03.6, CP-04.1 | Flujo cabina ABC123 (ingreso → salida → recibo con todos los campos), RB-01 (vehículo ya activo), RB-04 con MEN001 (mensualidad vigente cobra $0) |
| `03-ocupacion.cy.js` | CP-09.1 | Página `/ocupacion` en tiempo real, indicadores del Dashboard |
| `04-control-acceso.cy.js` | CP-05.2, CP-08.2 | RBAC: secretaria recibe 403 al consultar reportes, admin sí ve menú completo (RB-06) |
| `05-tarifas.cy.js` | CP-05.4 | Verifica las 6 tarifas iniciales del seed (bicicleta a camión) |

## Comandos custom de Cypress

`cypress/support/commands.js` define utilidades reutilizables:

| Comando | Descripción |
|---------|-------------|
| `cy.loginViaApi(usuario, contrasena)` | Login vía POST `/api/auth/login` y persistencia del JWT en localStorage. Más rápido que el login por UI. |
| `cy.loginAdmin()` | Atajo: `cy.loginViaApi('admin', 'admin123')` |
| `cy.loginSecretaria()` | Atajo: `cy.loginViaApi('secretaria', 'secre123')` |
| `cy.registrarIngreso(placa)` | POST `/api/ingresos` para crear precondición en pruebas de salida |
| `cy.logout()` | Limpia el localStorage |

Ejemplo de uso:

```javascript
beforeEach(() => {
  cy.loginAdmin();
  cy.visit('/dashboard');
});
```

## Configuración

`cypress.config.js` define:

- `baseUrl: 'http://localhost:3000'` — punto de entrada al frontend.
- `specPattern: 'cypress/e2e/**/*.cy.{js,jsx}'` — patrón de descubrimiento de specs.
- `viewportWidth: 1280, viewportHeight: 800` — resolución del navegador simulado.
- `defaultCommandTimeout: 8000` — los comandos esperan hasta 8 s antes de fallar.
- `video: false` — no graba video (más rápido en CI).
- `screenshotOnRunFailure: true` — captura screenshot al fallar.
- Variables de entorno con credenciales del seed (`adminUser`, `adminPass`, `secretariaUser`, `secretariaPass`, `apiUrl`).

## Datos de prueba (seed)

Las pruebas dependen de los datos cargados por `db/seed.sql`:

| Vehículo | Tipo | Propietario | Mensualidad |
|----------|------|-------------|-------------|
| `ABC123` | automóvil | Juan Pérez | No |
| `XYZ789` | motocicleta | Ana Martínez | No |
| `MEN001` | automóvil | Juan Pérez | **Sí — activa hasta 2026-05-31** |

Empleados:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | administrador |
| `secretaria` | `secre123` | secretaria |

Tarifas iniciales: bicicleta $500, motocicleta $1.500, automóvil $3.000, camioneta $4.000, bus/buseta $10.000, camión $8.000.

> **Nota sobre el estado entre corridas:** Cypress no resetea la base de datos entre specs. Si una prueba registra un ingreso y otra la corre, el segundo intento puede recibir 409 (RB-01). Los specs están diseñados para tolerarlo (ver `02-ingreso-salida.cy.js`). Para empezar desde cero, recrea la base:
>
> ```bash
> cd sgp-app
> docker-compose down -v        # elimina volumen pgdata
> docker-compose up -d --build   # vuelve a sembrar
> ```

## Estructura

```
frontend/
├── cypress.config.js           # Configuración global
└── cypress/
    ├── e2e/
    │   ├── 01-login.cy.js
    │   ├── 02-ingreso-salida.cy.js
    │   ├── 03-ocupacion.cy.js
    │   ├── 04-control-acceso.cy.js
    │   └── 05-tarifas.cy.js
    ├── support/
    │   ├── e2e.js              # Bootstrap (importa commands.js)
    │   └── commands.js         # Comandos custom
    ├── fixtures/
    │   └── example.json
    └── .gitignore              # Excluye screenshots/videos/downloads
```

## Artefactos al fallar

Cuando un test falla, Cypress genera:

- `cypress/screenshots/<spec>/<nombre-test>.png` — captura de pantalla del momento del fallo.
- `cypress/videos/<spec>.mp4` — solo si `video: true` en `cypress.config.js`.

Estas carpetas están en `.gitignore` y no se versionan.

## Depuración

### Ver más detalle

```bash
DEBUG=cypress:* npm run cy:run
```

### Correr un solo spec

```bash
npx cypress run --spec cypress/e2e/02-ingreso-salida.cy.js
```

### Correr en un navegador específico

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

### Pausar la ejecución y abrir DevTools

En modo interactivo (`cy:open`), agrega temporalmente:

```javascript
cy.pause();        // Pausa hasta que clickees "Resume"
cy.debug();        // Imprime info en la consola
```

## Integración continua

Ejemplo de pipeline en GitHub Actions:

```yaml
# .github/workflows/e2e.yml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Levantar SGP con Docker
        run: |
          cd sgp-app
          docker-compose up -d --build
          # Esperar a que el backend esté listo
          timeout 60 sh -c 'until curl -f http://localhost:4000/api/health; do sleep 2; done'
      - name: Cypress E2E
        uses: cypress-io/github-action@v6
        with:
          working-directory: sgp-app/frontend
          install: true
          command: npm run cy:run
```

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| `connect ECONNREFUSED 127.0.0.1:3000` | Frontend no está corriendo | `docker-compose up -d sgp-frontend` |
| `connect ECONNREFUSED 127.0.0.1:4000` | Backend caído | `docker logs sgp-backend` y revisar errores |
| `Credenciales inválidas` en `loginAdmin()` | Seed no se cargó | `docker-compose down -v && docker-compose up -d --build` |
| `409 - El vehículo ya se encuentra registrado` en CP-02.1 | Estado residual de corrida anterior | Recrear el volumen: `docker-compose down -v` |
| Cypress se cuelga al abrir | Falta dependencia gráfica en Linux | `apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb` |
| Test falla por timeout | El backend está lento o saturado | Aumentar `defaultCommandTimeout` en `cypress.config.js` |
