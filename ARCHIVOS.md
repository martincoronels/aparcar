# Mapa de archivos

Referencia de qué hace cada archivo del proyecto, para no perderse en el repo. No incluye `node_modules/`, `.next/`, `target/`, `.git/` ni `.idea/` (carpetas generadas, no código del programa).

Convenciones:
- 🆕 = archivo creado durante el sprint de Visitantes/Vehículos/Cocheras/Reservas
- ✏️ = archivo que ya existía y fue modificado en ese mismo sprint

---

## Raíz del repo

| Archivo | Qué hace |
|---|---|
| `.gitignore` | Ignora `*.class`, `*.jar`, logs, etc. a nivel de todo el repo |
| `README.md` | Guía de instalación y ejecución del proyecto completo (front + back) |
| `ARCHIVOS.md` 🆕 | Este archivo |

---

## `aparcar-api-back/` — Backend (Spring Boot)

### Raíz del backend

| Archivo | Qué hace |
|---|---|
| `.env` / `.env.example` | Variables de entorno (credenciales de DB, mail, etc.). `.env` no se sube a git; `.env.example` es la plantilla |
| `.gitignore` 🆕 | Ignora `target/` (carpeta de compilación de Maven) |
| `.pre-commit-config.yaml` | Hooks que corren antes de cada commit: valida YAML, detecta secretos (gitleaks), limpia espacios en blanco |
| `Makefile` | Comandos `make run` / `make test` / `make build` / `make migrate` / `make cover` / `make profile` (alternativa a Task) |
| `Taskfile.yml` | Los mismos comandos que el Makefile pero para la herramienta [Task](https://taskfile.dev/) |
| `README.md` | Instrucciones específicas del backend (Quick Start, variables de entorno, migraciones) |
| `docker-compose.yaml` | Define los servicios `db` (Postgres) y `server` (esta API) para levantar todo con Docker |
| `pom.xml` | Dependencias y configuración de Maven (Spring Boot 4, Postgres, Liquibase, JWT, Lombok, ModelMapper, etc.) |

### `dockerfiles/`

| Archivo | Qué hace |
|---|---|
| `db.Dockerfile` | Imagen de Postgres, copia el script de init de la base |
| `db-start.sh` | Script que corre al iniciar el contenedor de Postgres (solo loguea el nombre de la DB) |
| `server.Dockerfile` | Build multi-stage: compila el backend con Maven en una imagen, y copia solo el `.jar` final a una imagen liviana de Java |

### `scripts/`

| Archivo | Qué hace |
|---|---|
| `create-migration.go` | El programa detrás de `task migrate` / `make migrate`: compara las entidades de Java contra la base real y genera el YAML de Liquibase automáticamente |

### `src/main/java/com/aparcar/api/` — código fuente

**Raíz**
| Archivo | Qué hace |
|---|---|
| `AparcarApiApplication.java` | Punto de entrada (`main`) de toda la aplicación Spring Boot |

**`component/`** — piezas reusables inyectables
| Archivo | Qué hace |
|---|---|
| `IEmailSender.java` | Contrato para enviar emails |
| `IRevokedUserCache.java` | Contrato para el cache de tokens revocados (logout/borrado de usuario) |
| `OTPCleanup.java` | Tarea programada (corre cada hora) que borra códigos OTP vencidos |
| `impl/RevokedUserCache.java` | Implementación del cache de revocados usando Caffeine (en memoria) |
| `impl/SpringEmailSender.java` | Implementación real del envío de emails vía `JavaMailSender` |

**`config/`** — configuración general de Spring
| Archivo | Qué hace |
|---|---|
| `ApplicationConstants.java` | Constantes compartidas: nombres de perfiles (`dev`/`prod`/`test`), claves de JWT |
| `AsyncConfig.java` | Configura el pool de hilos para tareas `@Async` (ej: notificaciones) |
| `ModelMapperConfig.java` | Registra el bean de ModelMapper (mapeo automático entidad↔DTO) |
| `SchedulingConfig.java` | Configura el scheduler para tareas `@Scheduled` (como `OTPCleanup`) |
| `WebClientConfig.java` | Bean de `WebClient` para llamadas HTTP salientes |
| `WebConfig.java` | Filtro para manejar headers `X-Forwarded-*` (útil detrás de un proxy) |
| `middleware/DevExceptionHandler.java` | Traductor de excepciones → JSON de error, **solo en dev** (devuelve detalles completos del error) |
| `middleware/ProdExceptionHandler.java` | Igual que el anterior pero para prod (mensajes genéricos, no filtra detalles internos) |

**`controller/`** — endpoints REST
| Archivo | Qué hace |
|---|---|
| `AuthController.java` | `/register`, `/login`, `/forgot-password`, `/reset-password` |
| `CocheraController.java` 🆕 | `POST /api/v1/cocheras`, `GET /api/v1/cocheras`, `GET /api/v1/cocheras/disponibles` |
| `ReservaController.java` 🆕 | `POST /api/v1/reservas`, `GET /api/v1/reservas`, `GET /api/v1/reservas/{id}` |
| `UserController.java` | `/users/activate`, `/users/inactive`, `DELETE /users` (gestión admin de usuarios) |
| `VehiculoController.java` 🆕 | `POST /api/v1/vehiculos`, `GET /api/v1/vehiculos` (con filtro `?visitanteId=`), `GET /api/v1/vehiculos/{id}` |
| `VisitanteController.java` 🆕 | `POST /api/v1/visitantes`, `GET /api/v1/visitantes`, `GET /api/v1/visitantes/{id}` |

**`dto/`** — objetos de entrada/salida de la API
| Archivo | Qué hace |
|---|---|
| `ErrorResponseDto.java` | Formato estándar de respuesta de error (`code`, `message`, `details`) |
| `auth/RegisteredUserDto.java` | Respuesta al registrarse |
| `auth/RegistrationDto.java` | Body de `POST /register` |
| `auth/ResetPasswordDto.java` | Body de `POST /reset-password` |
| `auth/UserEmailDto.java` | Body genérico `{ email }` (activar/borrar usuario) |
| `email/PlainEmailData.java` | Estructura interna para armar un email (asunto, cuerpo, destinatarios) |
| `reserva/VisitanteRequestDto.java` 🆕 | Body para crear un visitante |
| `reserva/VisitanteResponseDto.java` 🆕 | Respuesta con los datos de un visitante |
| `reserva/VehiculoRequestDto.java` 🆕 | Body para crear un vehículo (valida formato de patente) |
| `reserva/VehiculoResponseDto.java` 🆕 | Respuesta con los datos de un vehículo |
| `reserva/CocheraRequestDto.java` 🆕 | Body para crear una cochera |
| `reserva/CocheraResponseDto.java` 🆕 | Respuesta con los datos de una cochera |
| `reserva/ReservaRequestDto.java` 🆕 | Body para crear una reserva (`visitanteId`, `vehiculoId`, `cocheraId`, `fecha`) |
| `reserva/ReservaResponseDto.java` 🆕 | Respuesta con la reserva completa (visitante/vehículo/cochera anidados) |

**`entity/`** — clases `@Entity` (mapean 1 a 1 con tablas)
| Archivo | Qué hace |
|---|---|
| `auth/AppAuthority.java` | Enum de roles: `USER`, `ADMIN` |
| `auth/AppUser.java` | Tabla `app_users` — el usuario interno que se loguea |
| `auth/InactiveUsersDto.java` | Wrapper de la lista de emails inactivos (pese al nombre "Dto", vive en `entity/auth`) |
| `auth/OneTimePassword.java` | Tabla `otp_codes` — códigos de recuperación de contraseña |
| `reserva/Visitante.java` 🆕 | Tabla `visitantes` |
| `reserva/Vehiculo.java` 🆕 | Tabla `vehiculos`, relacionado a un `Visitante` |
| `reserva/VehiculoTipo.java` 🆕 | Enum `AUTO`, `MOTO`, `CARGA` |
| `reserva/Cochera.java` 🆕 | Tabla `cocheras` (esta entidad no existía; la creé yo para el sprint) |
| `reserva/CocheraTipo.java` 🆕 | Enum `AUTO`, `MOTO`, `ACCESIBLE`, `CARGA` |
| `reserva/CocheraEstado.java` 🆕 | Enum `HABILITADA`, `DESHABILITADA` (estado operativo, no de disponibilidad por fecha) |
| `reserva/Reserva.java` 🆕 | Tabla `reservas`, relacionada a `Visitante` + `Vehiculo` + `Cochera` |
| `reserva/ReservaEstado.java` 🆕 | Enum `CONFIRMADA`, `CANCELADA` |

**`events/`** — listeners de eventos de Spring Security (solo logging)
| Archivo | Qué hace |
|---|---|
| `AuthenticationEventsListener.java` | Loguea logins exitosos/fallidos |
| `AuthorizationEventsListener.java` | Loguea intentos de acceso denegados |

**`exception/`** — errores de negocio
| Archivo | Qué hace |
|---|---|
| `NotFoundException.java` | "Esto que buscás no existe" → HTTP 404 |
| `OTPException.java` | Error específico de códigos OTP inválidos/vencidos |
| `OTPExceptionReason.java` | Enum con los mensajes de `OTPException` |
| `ValidationException.java` | "Esto que mandaste no es válido" → HTTP 400 (la usan las reglas de negocio de Reserva/Visitante/Vehículo/Cochera) |

**`filters/`** — filtros HTTP de bajo nivel (se ejecutan en cada request)
| Archivo | Qué hace |
|---|---|
| `ApiVersionFilter.java` | Agrega el header `X-Api-Version` a cada respuesta |
| `JWTGeneratorFilter.java` | Genera el JWT después de un login exitoso |
| `JWTValidationFilter.java` | Valida el JWT en cada request y carga el usuario autenticado |
| `RateLimitFilter.java` | Limita intentos por IP en `/login`, `/register`, `/forgot-password` (anti fuerza bruta) |
| `StripPortFromXffFilter.java` | Limpia el puerto de la IP del cliente en headers de proxy |

**`repository/`** — acceso a datos (Spring Data JPA)
| Archivo | Qué hace |
|---|---|
| `AppUserRepository.java` | Consultas sobre `AppUser` |
| `CocheraRepository.java` 🆕 | Consultas sobre `Cochera` (`existsByNumero`, `findByEstado`) |
| `OneTimePasswordRepository.java` | Consultas sobre `OneTimePassword` |
| `ReservaRepository.java` 🆕 | Consultas sobre `Reserva` (chequeo de sobreocupación por fecha) |
| `VehiculoRepository.java` 🆕 | Consultas sobre `Vehiculo` (`existsByPatente`, `findByVisitanteId`) |
| `VisitanteRepository.java` 🆕 | Consultas sobre `Visitante` (`existsByDocumento`) |

**`security/`** — autenticación y autorización
| Archivo | Qué hace |
|---|---|
| `AppUserDetailsService.java` | Le dice a Spring Security cómo cargar un usuario por email |
| `CustomBasicAuthenticationEntryPoint.java` | Qué responder cuando alguien pega a una ruta protegida sin login (JSON 401) |
| `authenticationProvider/DevAuthenticationProvider.java` | Lógica de login en **dev**: no valida la contraseña (comodidad para probar) |
| `authenticationProvider/ProdAuthenticationProvider.java` | Lógica de login en **prod**: sí valida la contraseña contra el hash |
| `securityConfig/DevSecurityConfig.java` ✏️ | Qué rutas requieren login en dev. Le agregué `/api/v1/visitantes/**` |
| `securityConfig/ProdSecurityConfig.java` ✏️ | Lo mismo para prod. Mismo agregado |

**`service/` + `service/impl/`** — lógica de negocio
| Archivo | Qué hace |
|---|---|
| `IAuthService.java` / `impl/AuthService.java` | Registro, login, recuperación de contraseña |
| `ICocheraService.java` / `impl/CocheraService.java` 🆕 | Crear cochera, listar disponibles (filtra por fecha + tipo de vehículo compatible) |
| `IReservaService.java` / `impl/ReservaService.java` 🆕 | **Acá viven las 2 reglas de negocio del sprint**: compatibilidad cochera↔vehículo, y no permitir 2 reservas confirmadas para la misma cochera y fecha |
| `IUserService.java` / `impl/UserService.java` | Activar/desactivar/borrar usuarios (admin) |
| `IVehiculoService.java` / `impl/VehiculoService.java` 🆕 | Crear vehículo (normaliza patente a mayúsculas), listar por visitante |
| `IVisitanteService.java` / `impl/VisitanteService.java` 🆕 | Crear visitante (valida documento único), listar |

### `src/main/resources/` — configuración

| Archivo | Qué hace |
|---|---|
| `application.yml` | Configuración base (nombre de la app, JPA, mail, Swagger en `/docs`) |
| `application-dev.yml` ✏️ | Overrides para desarrollo. Le agregué `ddl-auto: update` (ver sección de abajo) |
| `application-prod.yml` | Overrides para producción |
| `application-test.yml` | Usa H2 en memoria en vez de Postgres, para que los tests no necesiten Docker |
| `banner.txt` | El arte ASCII "AparcAR" que se ve al arrancar |
| `db/changelog/db.changelog-master.yaml` ✏️ | Lista maestra de migraciones de Liquibase. Le agregué el `include` de la 002 |
| `db/changelog/001-initial-schema.yaml` | **Está vacío** — migración original que nunca se completó (ver sección de `migrate`) |
| `db/changelog/002-visitantes-vehiculos-cocheras-reservas.yaml` 🆕 | Crea las tablas `visitantes`, `vehiculos`, `cocheras`, `reservas` + datos de ejemplo de cocheras |

### `src/test/java/com/aparcar/api/` — tests

| Archivo | Qué hace |
|---|---|
| `AparcarApiApplicationTests.java` | Test mínimo: que el contexto de Spring levante sin errores |
| `component/OTPCleanupTests.java` | Tests del borrado automático de OTPs vencidos |
| `component/RevokedUserCacheTests.java` | Tests del cache de tokens revocados |
| `component/SpringEmailSenderTests.java` | Tests del envío de emails |
| `config/IntegrationTests.java` | Anotación reusable: levanta el contexto completo de Spring + MockMvc, perfil `test` |
| `config/SynchronousAsyncConfig.java` | Para tests: hace que las tareas `@Async` corran sincrónicamente (más fácil de testear) |
| `config/UnitTests.java` | Anotación reusable: habilita Mockito, perfil `test` (sin levantar Spring completo) |
| `config/WebClientTestConfig.java` | Mockea las respuestas del `WebClient` en tests |
| `integration/AuthControllerTests.java` | Tests end-to-end de `/register`, `/login`, `/forgot-password`, `/reset-password` |
| `integration/UserControllerTests.java` | Tests end-to-end de los endpoints de administración de usuarios |
| `service/AuthServiceTests.java` | Tests unitarios de `AuthService` |
| `service/CocheraServiceTests.java` 🆕 | Tests de alta de cochera y de `listarDisponibles` (filtros por fecha/tipo/compatibilidad) |
| `service/ReservaServiceTests.java` 🆕 | Tests de las 2 reglas de negocio de reservas |
| `service/UserServiceTests.java` | Tests unitarios de `UserService` |
| `service/VehiculoServiceTests.java` 🆕 | Tests de alta de vehículo (patente duplicada, normalización a mayúsculas) |
| `service/VisitanteServiceTests.java` 🆕 | Tests de alta de visitante (documento duplicado) |

---

## `aparcar-front/` — Frontend (Next.js)

### Raíz del frontend

| Archivo | Qué hace |
|---|---|
| `.dockerignore` | Qué no copiar al buildear la imagen Docker (`node_modules`, `.next`, `.git`, `.env`) |
| `.env` / `.env.example` | Define `NEXT_PUBLIC_API_BASE_URL` (dónde está el backend) |
| `.gitignore` 🆕 | Ignora `node_modules/`, `.next/` (no existía, así que Git iba a trackear esas carpetas) |
| `.pre-commit-config.yaml` | Corre el linter de Next.js antes de cada commit |
| `Dockerfile` | Build multi-stage: compila con `npm run build` y corre la versión standalone con Node |
| `README.md` | Punto de entrada de la documentación del front, apunta a `kickstart.md` |
| `Taskfile.yml` | Comandos `task dev` / `task build` / `task start` / `task lint` |
| `docker-compose.yml` | Levanta el frontend ya buildeado en un contenedor (puerto 3000) |
| `eslint.config.mjs` | Reglas del linter (usa el preset de Next.js) |
| `jsconfig.json` | Define el alias `@/` → raíz del proyecto (para imports tipo `@/components/...`) |
| `kickstart.md` | Guía detallada de instalación paso a paso (prerrequisitos, `task setup`, etc.) |
| `next.config.mjs` | Configuración de Next.js — build en modo `standalone` (para Docker) |
| `package.json` / `package-lock.json` | Dependencias del proyecto (React, Next, react-hook-form, zod, zustand, sonner, axios) |
| `postcss.config.mjs` | Habilita el plugin de Tailwind CSS 4 |

### `app/` — páginas (routing de Next.js)

| Archivo | Qué hace |
|---|---|
| `api.jsx` | Instancia de axios compartida: agrega el JWT automáticamente a cada request, y desloguea si la API responde 401 |
| `favicon.ico` | Ícono de la pestaña del navegador |
| `globals.css` | Estilos globales + configuración de Tailwind |
| `layout.js` | Layout raíz: fuentes, metadata, y el `<Toaster />` de notificaciones (sonner) |
| `page.js` | Página de inicio (`/`) — redirige a `/admin` si ya estás logueado, si no muestra botón "Iniciar sesión" |
| `admin/page.jsx` | Dashboard, **solo accesible para rol ADMIN** (usa `requireAuth` del lado del servidor) |
| `admin/reservas/page.jsx` 🆕 | Crear una reserva (elige visitante → vehículo → cochera disponible) + listado de reservas |
| `admin/visitantes/page.jsx` 🆕 | Formulario para cargar un visitante + su vehículo |
| `login/page.jsx` | Pantalla de login (HTTP Basic → recibe el JWT en la respuesta) |
| `recover-password/page.jsx` | Pedido de código OTP por email |
| `reset-password/page.jsx` | Ingreso del código OTP + nueva contraseña |
| `unauthorized/page.jsx` | Pantalla de "no tenés permiso" cuando el rol no alcanza |

### `components/`

| Archivo | Qué hace |
|---|---|
| `ProtectedRoute.jsx` | Wrapper del lado del cliente: redirige a `/login` si no hay sesión, o a `/unauthorized` si falta el rol. Lo usan `admin/visitantes` y `admin/reservas` |

### `scripts/`

| Archivo | Qué hace |
|---|---|
| `entrypoint.sh` | Se ejecuta al arrancar el contenedor Docker: vuelca las variables `NEXT_PUBLIC_*` del entorno a `public/env-config.js` (para poder cambiarlas sin rebuildear la imagen) |
| `entrypoint_local.sh` | Misma idea pero leyendo desde el archivo `.env` en vez de variables de entorno del contenedor |

### `store/`

| Archivo | Qué hace |
|---|---|
| `authStore.js` | Estado global de sesión (Zustand): guarda el JWT en una cookie, decodifica el usuario/roles, expone `login`/`logout`/`checkAuth` |

### `utils/`

| Archivo | Qué hace |
|---|---|
| `env.js` ✏️ | Lee variables de entorno, priorizando `window.__ENV` (inyectadas en runtime por Docker) sobre las `NEXT_PUBLIC_*`. Tenía un bug: leía `process.env[key]` de forma dinámica, y Next.js solo puede inlinear esas variables cuando la referencia es literal — por eso el login pegaba a `:3000` en vez de `:8080`. Lo arreglé listando las variables una sola vez en un objeto literal (`PUBLIC_ENV`) |
| `serverAuth.js` | Equivalente a `ProtectedRoute` pero para Server Components — `requireAuth(roles)`, usado en `admin/page.jsx` |

---

## Tablas que existen hoy en la base de datos

Esto es lo que hay **ahora mismo** en tu Postgres local (`docker exec aparcar-api-back-db-1 psql -U admin -d aparcar_db -c "\dt"`), no lo que dicen los YAML de Liquibase — importa la diferencia porque, como se explica abajo, algunas tablas no vienen de una migración.

| Tabla | Origen | Columnas | De qué entidad sale |
|---|---|---|---|
| `visitantes` | Liquibase (`002-...yaml`) | `id` (uuid, PK), `nombre`, `documento`, `telefono`, `email` | `Visitante.java` |
| `vehiculos` | Liquibase (`002-...yaml`) | `id` (uuid, PK), `patente`, `tipo`, `visitante_id` (FK → visitantes) | `Vehiculo.java` |
| `cocheras` | Liquibase (`002-...yaml`) | `id` (uuid, PK), `numero`, `sector`, `tipo`, `estado` | `Cochera.java` |
| `reservas` | Liquibase (`002-...yaml`) | `id` (uuid, PK), `fecha`, `visitante_id` (FK), `vehiculo_id` (FK), `cochera_id` (FK), `estado`, `fecha_creacion` | `Reserva.java` |
| `app_users` | **Hibernate** (`ddl-auto: update`), sin migración | `id` (uuid, PK), `nombre`, `email`, `password`, `telefono`, `is_active` | `AppUser.java` |
| `app_user_authorities` | **Hibernate** (`ddl-auto: update`), sin migración | `user_id` (uuid, FK → app_users), `authority` | El campo `authorities` de `AppUser.java` (ver más abajo) |
| `otp_codes` | **Hibernate** (`ddl-auto: update`), sin migración | `id` (bigint, PK), `token`, `user_id` (FK → app_users), `expires_at`, `used` | `OneTimePassword.java` |
| `databasechangelog` / `databasechangeloglock` | Liquibase | — | No son datos de la app: es el registro interno de Liquibase (qué migraciones ya corrieron, y un lock para que no corran dos a la vez) |

---

## Sobre `db/changelog/001-initial-schema.yaml` y el "migrate"

Este archivo está **vacío** desde el `Initial commit`. Es la migración que debería haber creado las tablas de autenticación (`app_users`, `otp_codes`, etc.) y nunca se completó — no tiene que ver con mi sprint, ya estaba así. Por eso tuve que agregar `ddl-auto: update` en `application-dev.yml`: para que Hibernate cree esas tablas solo en desarrollo, mientras nadie escriba la migración real con `task migrate`.

Si en algún momento quieren dejarlo prolijo (no es urgente), el flujo sería: alguien con Go instalado corre `task migrate name=initial-auth-schema` contra una base ya poblada por Hibernate, eso genera el YAML con el estado real de esas tablas, y recién ahí se podría sacar el `ddl-auto: update` y volver todo a `validate` también en dev.
