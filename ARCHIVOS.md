# Mapa de archivos

Referencia de qué hace cada archivo del proyecto, para no perderse en el repo. No incluye `node_modules/`, `.next/`, `target/`, `.git/` ni `.idea/` (carpetas generadas, no código del programa).

Convenciones:

- 🆕 = archivo agregado durante el desarrollo actual.
- ✏️ = archivo existente que fue modificado.

---

## Raíz del repo

| Archivo | Qué hace |
|---|---|
| `.gitignore` | Ignora `*.class`, `*.jar`, logs, etc. a nivel de todo el repo |
| `README.md` | Guía de instalación y ejecución del proyecto completo (front + back) |
| `ARCHIVOS.md` | Este archivo: mapa general de la estructura del proyecto |

---

# `aparcar-api-back/` — Backend (Spring Boot)

## Raíz del backend

| Archivo | Qué hace |
|---|---|
| `.env` / `.env.example` | Variables de entorno (credenciales de DB, mail, etc.). `.env` no se sube a git; `.env.example` es la plantilla |
| `.gitignore` | Ignora `target/` y otros archivos generados |
| `.pre-commit-config.yaml` | Hooks que corren antes de cada commit: valida YAML, detecta secretos, limpia espacios en blanco |
| `Makefile` | Comandos `make run`, `make test`, `make build`, `make migrate`, etc. |
| `Taskfile.yml` | Alternativa al Makefile usando Task |
| `README.md` | Instrucciones específicas del backend |
| `docker-compose.yaml` | Define los servicios `db` (PostgreSQL) y `server` (API Spring Boot) |
| `pom.xml` | Dependencias y configuración Maven del backend |

---

## `dockerfiles/`

| Archivo | Qué hace |
|---|---|
| `db.Dockerfile` | Imagen de PostgreSQL usada por Docker |
| `db-start.sh` | Script ejecutado al iniciar el contenedor de base de datos |
| `server.Dockerfile` | Compila el backend con Maven y genera la imagen que ejecuta el `.jar` |

---

## `scripts/`

| Archivo | Qué hace |
|---|---|
| `create-migration.go` | Programa usado por `task migrate` / `make migrate` para generar migraciones Liquibase |

---

# `src/main/java/com/aparcar/api/`

## Raíz

| Archivo | Qué hace |
|---|---|
| `AparcarApiApplication.java` | Punto de entrada (`main`) de la aplicación Spring Boot |

---

## `component/`

Piezas reutilizables e inyectables.

| Archivo | Qué hace |
|---|---|
| `IEmailSender.java` | Contrato para enviar emails |
| `IRevokedUserCache.java` | Contrato para el cache de JWT revocados |
| `OTPCleanup.java` | Tarea programada que elimina códigos OTP vencidos |
| `impl/RevokedUserCache.java` | Implementación del cache de usuarios revocados usando Caffeine |
| `impl/SpringEmailSender.java` | Implementación del envío de emails con `JavaMailSender` |

---

## `config/`

Configuración general de Spring.

| Archivo | Qué hace |
|---|---|
| `ApplicationConstants.java` | Constantes compartidas: perfiles y configuración JWT |
| `AsyncConfig.java` | Configura ejecución de tareas `@Async` |
| `ModelMapperConfig.java` | Configura ModelMapper |
| `SchedulingConfig.java` | Configura tareas `@Scheduled` |
| `WebClientConfig.java` | Configura el bean de `WebClient` |
| `WebConfig.java` | Maneja headers `X-Forwarded-*` |
| `middleware/DevExceptionHandler.java` | Convierte excepciones a respuestas JSON detalladas en desarrollo |
| `middleware/ProdExceptionHandler.java` | Manejo de errores para producción |

---

## `controller/`

Endpoints REST de la aplicación.

| Archivo | Qué hace |
|---|---|
| `AuthController.java` | `/register`, `/login`, `/forgot-password`, `/reset-password` |
| `CocheraController.java` | Gestión de cocheras y consulta de cocheras disponibles |
| `ReservaController.java` | Alta y consulta de reservas |
| `UserController.java` ✏️ | Gestión ADMIN de usuarios: activar, listar inactivos, eliminar, listar todos y editar |
| `VehiculoController.java` | Alta y consulta de vehículos |
| `VisitanteController.java` | Alta y consulta de visitantes |

### Endpoints de gestión de usuarios

Actualmente la administración de usuarios utiliza:

```text
POST   /register
GET    /api/v1/usuarios
PUT    /api/v1/usuarios/{id}
POST   /users/activate
GET    /users/inactive
DELETE /users
```

`POST /register`, `GET /api/v1/usuarios`, `PUT /api/v1/usuarios/{id}` y los endpoints `/users/**` están protegidos para rol `ADMIN`.

---

## `dto/`

Objetos usados para entrada y salida de información de la API.

### Generales

| Archivo | Qué hace |
|---|---|
| `ErrorResponseDto.java` | Formato estándar de errores (`code`, `message`, `details`) |

### `dto/auth/`

| Archivo | Qué hace |
|---|---|
| `RegisteredUserDto.java` | Respuesta devuelta al crear un usuario |
| `RegistrationDto.java` | Body de `POST /register`: nombre, email, password y teléfono |
| `ResetPasswordDto.java` | Body para cambiar contraseña mediante OTP |
| `UserEmailDto.java` | Body genérico `{ email }`, utilizado para activar/eliminar usuarios |
| `UpdateUserDto.java` 🆕 | Body para editar nombre, teléfono y authorities de un usuario |
| `UserResponseDto.java` 🆕 | Respuesta administrativa de usuario: id, nombre, email, teléfono, authorities y estado; no expone password |

### `dto/email/`

| Archivo | Qué hace |
|---|---|
| `PlainEmailData.java` | Datos internos utilizados para enviar un email |

### `dto/reserva/`

| Archivo | Qué hace |
|---|---|
| `VisitanteRequestDto.java` | Datos recibidos para crear un visitante |
| `VisitanteResponseDto.java` | Datos devueltos de un visitante |
| `VehiculoRequestDto.java` | Datos recibidos para crear un vehículo |
| `VehiculoResponseDto.java` | Datos devueltos de un vehículo |
| `CocheraRequestDto.java` | Datos recibidos para crear una cochera |
| `CocheraResponseDto.java` | Datos devueltos de una cochera |
| `ReservaRequestDto.java` | Datos necesarios para crear una reserva |
| `ReservaResponseDto.java` | Respuesta completa de una reserva |

---

## `entity/`

Entidades JPA que representan los datos persistidos.

### `entity/auth/`

| Archivo | Qué hace |
|---|---|
| `AppAuthority.java` | Enum de roles internos: `USER` y `ADMIN` |
| `AppUser.java` | Entidad de los usuarios internos que pueden iniciar sesión |
| `InactiveUsersDto.java` | Wrapper con emails de usuarios inactivos |
| `OneTimePassword.java` | Entidad de códigos OTP para recuperación de contraseña |

### `entity/reserva/`

| Archivo | Qué hace |
|---|---|
| `Visitante.java` | Entidad de visitantes |
| `Vehiculo.java` | Entidad de vehículos asociados a visitantes |
| `VehiculoTipo.java` | Enum `AUTO`, `MOTO`, `CARGA` |
| `Cochera.java` | Entidad de cocheras |
| `CocheraTipo.java` | Enum `AUTO`, `MOTO`, `ACCESIBLE`, `CARGA` |
| `CocheraEstado.java` | Estado operativo de una cochera |
| `Reserva.java` | Entidad de reservas |
| `ReservaEstado.java` | Enum `CONFIRMADA`, `CANCELADA` |

---

## `events/`

Listeners utilizados principalmente para logging de Spring Security.

| Archivo | Qué hace |
|---|---|
| `AuthenticationEventsListener.java` | Registra logins exitosos y fallidos |
| `AuthorizationEventsListener.java` | Registra intentos de acceso rechazados |

---

## `exception/`

Excepciones propias del backend.

| Archivo | Qué hace |
|---|---|
| `NotFoundException.java` | Recurso solicitado inexistente → HTTP 404 |
| `OTPException.java` | Error relacionado con OTP |
| `OTPExceptionReason.java` | Motivos posibles de error de OTP |
| `ValidationException.java` | Error de validación o regla de negocio → HTTP 400 |

---

## `filters/`

Filtros HTTP ejecutados durante los requests.

| Archivo | Qué hace |
|---|---|
| `ApiVersionFilter.java` | Agrega el header `X-Api-Version` |
| `JWTGeneratorFilter.java` | Genera el JWT luego de un login exitoso |
| `JWTValidationFilter.java` ✏️ | Valida JWT y carga la autenticación; `/register` ahora también procesa JWT porque requiere ADMIN |
| `RateLimitFilter.java` | Limita intentos sobre endpoints sensibles |
| `StripPortFromXffFilter.java` | Normaliza la IP proveniente de headers proxy |

---

## `repository/`

Acceso a datos usando Spring Data JPA.

| Archivo | Qué hace |
|---|---|
| `AppUserRepository.java` ✏️ | Acceso a `AppUser`; utiliza `UUID` como tipo de ID y permite buscar usuarios por email |
| `CocheraRepository.java` | Acceso a cocheras |
| `OneTimePasswordRepository.java` | Acceso a códigos OTP |
| `ReservaRepository.java` | Acceso a reservas y consultas relacionadas con disponibilidad |
| `VehiculoRepository.java` | Acceso a vehículos |
| `VisitanteRepository.java` | Acceso a visitantes |

---

## `security/`

Autenticación y autorización.

| Archivo | Qué hace |
|---|---|
| `AppUserDetailsService.java` | Carga un `AppUser` por email para Spring Security |
| `CustomBasicAuthenticationEntryPoint.java` | Respuesta devuelta cuando una ruta requiere autenticación |
| `authenticationProvider/DevAuthenticationProvider.java` | Autenticación de desarrollo |
| `authenticationProvider/ProdAuthenticationProvider.java` | Autenticación de producción con validación de password |
| `securityConfig/DevSecurityConfig.java` ✏️ | Configuración de seguridad de desarrollo; administración y alta de usuarios requieren `ADMIN` |
| `securityConfig/ProdSecurityConfig.java` ✏️ | Configuración equivalente para producción/test |

### Seguridad de usuarios

Los endpoints:

```text
/users/**
/api/v1/usuarios/**
/register
```

requieren:

```text
authority = ADMIN
```

El login continúa disponible para usuarios autenticables mediante HTTP Basic y genera un JWT que contiene las authorities del usuario.

---

## `service/` + `service/impl/`

Lógica de negocio.

| Archivo | Qué hace |
|---|---|
| `IAuthService.java` / `impl/AuthService.java` | Registro, login y recuperación de contraseña |
| `ICocheraService.java` / `impl/CocheraService.java` | Gestión y disponibilidad de cocheras |
| `IReservaService.java` / `impl/ReservaService.java` | Lógica de reservas y validación de compatibilidad/disponibilidad |
| `IUserService.java` / `impl/UserService.java` ✏️ | Gestión administrativa de usuarios: listar, editar, activar y eliminar |
| `IVehiculoService.java` / `impl/VehiculoService.java` | Gestión de vehículos |
| `IVisitanteService.java` / `impl/VisitanteService.java` | Gestión de visitantes |

### Comportamiento actual de alta de usuario

`AuthService.register()` crea los nuevos usuarios con:

```text
authority: USER
isActive: false
```

Un administrador puede posteriormente modificar sus authorities, activarlos o eliminarlos desde la gestión de usuarios.

---

# `src/main/resources/`

## Configuración

| Archivo | Qué hace |
|---|---|
| `application.yml` | Configuración base de Spring |
| `application-dev.yml` | Configuración específica de desarrollo; utiliza `ddl-auto: update` |
| `application-prod.yml` | Configuración para producción |
| `application-test.yml` | Configuración de tests con H2 |
| `banner.txt` | Arte ASCII mostrado al iniciar AparcAR |

## `db/changelog/`

| Archivo | Qué hace |
|---|---|
| `db.changelog-master.yaml` | Lista de migraciones Liquibase |
| `001-initial-schema.yaml` | Migración inicial actualmente vacía |
| `002-visitantes-vehiculos-cocheras-reservas.yaml` | Crea tablas de visitantes, vehículos, cocheras y reservas |

---

# `src/test/java/com/aparcar/api/`

Tests existentes.

| Archivo | Qué hace |
|---|---|
| `AparcarApiApplicationTests.java` | Comprueba que el contexto Spring pueda iniciar |
| `component/OTPCleanupTests.java` | Tests de limpieza de OTP |
| `component/RevokedUserCacheTests.java` | Tests del cache de JWT revocados |
| `component/SpringEmailSenderTests.java` | Tests del envío de emails |
| `config/IntegrationTests.java` | Configuración reusable para tests de integración |
| `config/SynchronousAsyncConfig.java` | Ejecuta tareas async de forma síncrona durante tests |
| `config/UnitTests.java` | Configuración reusable de Mockito |
| `config/WebClientTestConfig.java` | Configuración de WebClient para tests |
| `integration/AuthControllerTests.java` | Tests de endpoints de autenticación |
| `integration/UserControllerTests.java` | Tests de endpoints administrativos de usuarios |
| `service/AuthServiceTests.java` | Tests unitarios de `AuthService` |
| `service/CocheraServiceTests.java` | Tests de cocheras |
| `service/ReservaServiceTests.java` | Tests de reservas |
| `service/UserServiceTests.java` | Tests unitarios de gestión de usuarios |
| `service/VehiculoServiceTests.java` | Tests de vehículos |
| `service/VisitanteServiceTests.java` | Tests de visitantes |

---

# `aparcar-front/` — Frontend (Next.js)

## Raíz del frontend

| Archivo | Qué hace |
|---|---|
| `.dockerignore` | Archivos que no se copian al construir la imagen |
| `.env` / `.env.example` | Configura `NEXT_PUBLIC_API_BASE_URL` |
| `.gitignore` | Ignora `node_modules/`, `.next/` y otros generados |
| `.pre-commit-config.yaml` | Ejecuta validaciones antes de commits |
| `Dockerfile` | Construcción y ejecución del frontend con Docker |
| `README.md` | Documentación del frontend |
| `Taskfile.yml` | Comandos de desarrollo/build |
| `docker-compose.yml` | Levanta el frontend en el puerto 3000 |
| `eslint.config.mjs` | Configuración ESLint |
| `jsconfig.json` | Define alias `@/` |
| `kickstart.md` | Guía de instalación |
| `next.config.mjs` | Configuración de Next.js |
| `package.json` / `package-lock.json` | Dependencias |
| `postcss.config.mjs` | Configuración Tailwind CSS 4 |

---

# `app/` — páginas y contenido

| Archivo / carpeta | Qué hace |
|---|---|
| `api.jsx` | Instancia Axios compartida; configura base URL e inyecta JWT en requests autenticados |
| `favicon.ico` | Ícono de la aplicación |
| `globals.css` | Estilos globales y Tailwind |
| `layout.js` | Layout global y `<Toaster />` de Sonner |
| `page.js` | Página inicial con acceso al login |
| `login/page.jsx` ✏️ | Login del personal interno; genera sesión y redirige según rol a `dashboard-admin` o `dashboard-user` |
| `recover-password/page.jsx` | Solicitud de OTP |
| `reset-password/page.jsx` | Cambio de contraseña mediante OTP |
| `unauthorized/page.jsx` | Página mostrada cuando el usuario no tiene permisos |

---

## `app/dashboard-admin/`

Sección para usuarios con rol `ADMIN`.

| Archivo | Qué hace |
|---|---|
| `page.jsx` 🆕 | Entrada del dashboard ADMIN, protegida con `requireAuth(["ADMIN"])` |
| `VisitantesContent.jsx` 🆕 | Contenido de visitantes reutilizado dentro del dashboard administrativo |

### `app/dashboard-admin/usuarios/`

Módulo de gestión de usuarios internos.

| Archivo | Qué hace |
|---|---|
| `page.jsx` 🆕 | Ruta `/dashboard-admin/usuarios`; valida server-side que el usuario tenga authority `ADMIN` |
| `UserManagement.jsx` 🆕 | Interfaz interactiva para listar, crear, editar, asignar roles, activar y eliminar usuarios |

`UserManagement.jsx` reutiliza:

- `app/api.jsx` para todas las llamadas HTTP;
- `react-hook-form` para formularios;
- `zod` para validaciones;
- `sonner` para notificaciones;
- los endpoints ya existentes de activación y eliminación;
- los nuevos endpoints de listado y edición.

No implementa lógica propia de autenticación ni acceso directo a PostgreSQL.

---

## `app/dashboard-user/`

Sección destinada a usuarios internos con rol `USER`.

| Archivo | Qué hace |
|---|---|
| `page.jsx` 🆕 | Entrada del dashboard USER, protegida con `requireAuth(["USER"])` |
| `ReservasContent.jsx` 🆕 | Contenido relacionado con reservas |

---

## `public/`

| Archivo | Qué hace |
|---|---|
| `Logo.jpeg` 🆕 | Logo de AparcAR utilizado actualmente en la pantalla de login |

---

# `components/`

| Archivo | Qué hace |
|---|---|
| `ProtectedRoute.jsx` | Wrapper client-side para proteger rutas según autenticación/rol |

Las pantallas nuevas basadas en Server Components utilizan preferentemente `requireAuth()` desde `utils/serverAuth.js`.

---

# `scripts/`

| Archivo | Qué hace |
|---|---|
| `entrypoint.sh` | Inyecta variables `NEXT_PUBLIC_*` cuando el frontend corre en Docker |
| `entrypoint_local.sh` | Variante para desarrollo local |

---

# `store/`

| Archivo | Qué hace |
|---|---|
| `authStore.js` | Estado global de autenticación con Zustand; guarda JWT y expone funciones de sesión |

---

# `utils/`

| Archivo | Qué hace |
|---|---|
| `env.js` | Resuelve variables públicas tanto en desarrollo como en Docker |
| `serverAuth.js` | Protección server-side mediante `requireAuth(allowedRoles)` |

Ejemplo:

```javascript
await requireAuth(["ADMIN"]);
```

Si el JWT no existe, redirige al login. Si existe pero no contiene alguno de los roles requeridos, redirige a `/unauthorized`.

---

# Flujo de autenticación actual

## Login

```text
/login
   ↓
HTTP Basic Auth
   ↓
Backend Spring Security
   ↓
JWT con email + authorities
   ↓
Frontend guarda JWT
   ↓
   ├── ADMIN → /dashboard-admin
   └── USER  → /dashboard-user
```

---

## Gestión de usuarios ADMIN

```text
/dashboard-admin/usuarios
          ↓
requireAuth(["ADMIN"])
          ↓
UserManagement.jsx
          ↓
app/api.jsx
          ↓
Spring Boot API
          ↓
PostgreSQL
```

Funciones disponibles:

```text
Listar usuarios
Crear usuario
Editar nombre
Editar teléfono
Editar authorities
Activar usuario
Eliminar usuario
```

Los usuarios nuevos se crean inicialmente como:

```text
USER
INACTIVO
```

y luego pueden ser gestionados por un administrador.

---

# Tablas que existen actualmente en PostgreSQL

| Tabla | Origen | Columnas principales | Entidad |
|---|---|---|---|
| `visitantes` | Liquibase | `id`, `nombre`, `documento`, `telefono`, `email` | `Visitante.java` |
| `vehiculos` | Liquibase | `id`, `patente`, `tipo`, `visitante_id` | `Vehiculo.java` |
| `cocheras` | Liquibase | `id`, `numero`, `sector`, `tipo`, `estado` | `Cochera.java` |
| `reservas` | Liquibase | `id`, `fecha`, `visitante_id`, `vehiculo_id`, `cochera_id`, `estado`, `fecha_creacion` | `Reserva.java` |
| `app_users` | Hibernate (`ddl-auto: update`) | `id`, `nombre`, `email`, `password`, `telefono`, `is_active` | `AppUser.java` |
| `app_user_authorities` | Hibernate (`ddl-auto: update`) | `user_id`, `authority` | `AppUser.authorities` |
| `otp_codes` | Hibernate (`ddl-auto: update`) | `id`, `token`, `user_id`, `expires_at`, `used` | `OneTimePassword.java` |
| `databasechangelog` / `databasechangeloglock` | Liquibase | Internas de Liquibase | — |

---

# Sobre `db/changelog/001-initial-schema.yaml`

La migración `001-initial-schema.yaml` continúa vacía.

Actualmente las tablas relacionadas con autenticación:

```text
app_users
app_user_authorities
otp_codes
```

se crean/actualizan automáticamente en desarrollo mediante:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

configurado en `application-dev.yml`.

Las entidades de autenticación todavía no cuentan con una migración Liquibase propia.

En el futuro, si el equipo decide unificar todo el esquema bajo Liquibase, se deberá generar una migración correspondiente antes de retirar `ddl-auto: update`.