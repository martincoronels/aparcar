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
| `TESTS.md` 🆕 | Índice de qué prueba cada archivo de test, front y back, caso por caso |

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
| `VisitanteController.java` ✏️ | Alta y consulta de visitantes, más `GET /me` y `POST /me` 🆕: el propio visitante (logueado) consulta o carga su perfil sin pasar por un admin |

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
| `Visitante.java` ✏️ | Entidad de visitantes; agregado `appUser` (`@OneToOne` opcional hacia `AppUser`) para el login propio del visitante |
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
| `IUserService.java` / `impl/UserService.java` ✏️ | Gestión administrativa de usuarios: listar, editar, activar y eliminar. Al eliminar, desvincula primero el visitante propio de la cuenta (si tiene uno) antes de borrarla |
| `IVehiculoService.java` / `impl/VehiculoService.java` | Gestión de vehículos |
| `IVisitanteService.java` / `impl/VisitanteService.java` ✏️ | Gestión de visitantes, más `obtenerPropio(email)` / `crearPropio(email, dto)` 🆕: el visitante carga sus propios datos vinculados a su cuenta |

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
| `003-visitante-app-user.yaml` 🆕 | Agrega `visitantes.app_user_id` (único, sin FK física a propósito — ver nota abajo) para que un visitante pueda vincularse a su propia cuenta de login |

### Por qué `003` no tiene foreign key física hacia `app_users`

`app_users` no la crea Liquibase — la crea Hibernate con `ddl-auto: update`, que corre **después** de Liquibase. Una FK en `003` hacia esa tabla se rompe en cualquier base nueva (los tests con H2, o el primer `docker compose up` de otra persona) porque `app_users` todavía no existe cuando corre esta migración. Se detectó al escribir los tests: pasaba en la Postgres de desarrollo (porque esa tabla ya existía de arranques anteriores) pero fallaba siempre en H2. La relación la valida JPA (`@OneToOne` en `Visitante.java`), no la base.

---

# `src/test/java/com/aparcar/api/`

Convención de esta sección: 🆕 = clase de test agregada al sumar cobertura de login/roles/dashboards. El resto ya existía.

| Archivo | Qué hace |
|---|---|
| `AparcarApiApplicationTests.java` | Comprueba que el contexto Spring pueda iniciar |
| `component/OTPCleanupTests.java` | Tests de limpieza de OTP |
| `component/RevokedUserCacheTests.java` | Tests del cache de JWT revocados |
| `component/SpringEmailSenderTests.java` | Tests del envío de emails |
| `config/IntegrationTests.java` | Configuración reusable para tests de integración (MockMvc + Spring completo) |
| `config/SynchronousAsyncConfig.java` | Ejecuta tareas async de forma síncrona durante tests |
| `config/UnitTests.java` | Configuración reusable de Mockito |
| `config/WebClientTestConfig.java` | Configuración de WebClient para tests |
| `filters/JWTGeneratorFilterTests.java` 🆕 | **Caja blanca.** Prueba el filtro que arma el JWT directamente (mocks, sin Spring): genera `Authorization: Bearer ...` con email/authorities correctos solo si hay autenticación, y solo en `/login` |
| `filters/RateLimitFilterTests.java` 🆕 | **Caja blanca.** Prueba el limitador de intentos directamente: deja pasar las primeras 5 requests por IP y bloquea (429) la 6ta; IPs distintas tienen buckets independientes |
| `integration/AuthControllerTests.java` ✏️ | Tests de `/register`, `/login`, `/forgot-password`, `/reset-password`. Actualicé `registerValidatesInput` y `registerCreatesInactiveUser` porque `/register` pasó a requerir rol ADMIN (antes eran públicos y quedaron rotos por ese cambio); agregué los casos 401 (anónimo) y 403 (rol USER) |
| `integration/CocheraControllerTests.java` | **Caja negra.** CRUD completo de `/api/v1/cocheras`: seguridad (401/403), validaciones, alta/edición/borrado y `/disponibles` de punta a punta |
| `integration/DashboardAccessSecurityTests.java` 🆕 | **Caja negra.** Matriz de qué rol puede pegarle a qué endpoint: `/api/v1/visitantes`, `/vehiculos` y `/reservas` exigen solo estar autenticado (los usan ambos dashboards, sin importar el rol), `/api/v1/usuarios` exige ADMIN, `/api/v1/cocheras/disponibles` es público |
| `integration/LoginFlowTests.java` 🆕 | **Caja negra**, contra un servidor real embebido (no MockMvc — ver el porqué en el comentario de la clase). Login real con HTTP Basic: verifica el JWT devuelto (email, authorities), 401 con email inexistente, y que en dev/test cualquier contraseña autentica |
| `integration/ReservaControllerTests.java` 🆕 | **Caja negra.** Reglas de negocio de `/api/v1/reservas` contra DB real (no mocks): vehículo que no pertenece al visitante, incompatibilidad de tipos, doble reserva del mismo día, cochera ACCESIBLE acepta cualquier vehículo |
| `integration/UserControllerTests.java` ✏️ | Tests de `/users/**` y `/api/v1/usuarios/**`. Agregué los casos de `PUT /api/v1/usuarios/{id}` (actualiza campos, 404 si no existe, 401 anónimo) |
| `integration/VehiculoControllerTests.java` 🆕 | **Caja negra.** `/api/v1/vehiculos`: formato de patente, normalización a mayúsculas, patente/visitante duplicado o inexistente, filtro por `visitanteId` |
| `integration/VisitanteControllerTests.java` 🆕 | **Caja negra.** `/api/v1/visitantes`, con foco en `/me` (el visitante carga su propio perfil): 404 sin perfil, alta, documento duplicado, cuenta que ya tiene un perfil cargado |
| `security/AppUserDetailsServiceTests.java` 🆕 | **Caja blanca.** El puente AppUser → UserDetails: mapea authorities correctamente, lanza `UsernameNotFoundException` si el email no existe |
| `security/authenticationProvider/DevAuthenticationProviderTests.java` 🆕 | **Caja blanca.** Documenta el comportamiento a propósito "inseguro" de dev: autentica sin validar la contraseña, siempre que el email exista |
| `security/authenticationProvider/ProdAuthenticationProviderTests.java` 🆕 | **Caja blanca.** El que sí valida contraseña (perfil prod real): rechaza con `BadCredentialsException` tanto si la contraseña no matchea como si el usuario no existe (para no filtrar cuáles emails están registrados) |
| `service/AuthServiceTests.java` | Tests unitarios de `AuthService` |
| `service/CocheraServiceTests.java` | Tests de cocheras, incluye la cancelación automática de reservas al deshabilitar una cochera |
| `service/ReservaServiceTests.java` | Tests unitarios de reservas (con mocks): mismas reglas que `ReservaControllerTests` pero aisladas del repositorio |
| `service/UserServiceTests.java` ✏️ | Tests de gestión de usuarios. Agregué los casos de `deleteUser`: desvincula el visitante propio antes de borrar la cuenta (evita romper la FK `fk_visitante_app_user`), y no hace nada si no hay ninguno vinculado |
| `service/VehiculoServiceTests.java` | Tests de vehículos |
| `service/VisitanteServiceTests.java` ✏️ | Tests de visitantes. Agregué los casos de `obtenerPropio`/`crearPropio` (el flujo de `/me`): 404 sin perfil, cuenta que ya tiene uno, documento duplicado, alta correcta vinculada a la cuenta |

## Sobre `LoginFlowTests` y el bug de `getServletPath()` en MockMvc

Escribiendo estos tests encontré algo importante para quien toque `RateLimitFilter`, `JWTValidationFilter` o `JWTGeneratorFilter`: los tres deciden si aplicarse mirando `request.getServletPath()`. En el dispatch simulado de MockMvc ese valor **no coincide** con el de un despliegue real (queda vacío), así que esos filtros nunca se activan bajo MockMvc — silencioso, sin error, simplemente no hacen nada. Por eso `LoginFlowTests` corre contra un servidor embebido real (`@SpringBootTest(webEnvironment = RANDOM_PORT)` + `RestTemplate`) en vez de `MockMvc`: es la única forma de que estos tres filtros se ejecuten de verdad durante el test.

No es un bug de producción — contra la app real (Docker) ya confirmamos a mano que el JWT y el rate limiting funcionan bien — es una limitación del entorno de test que vale la pena tener en cuenta antes de confiar en un test de estos tres filtros hecho con MockMvc.

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
| `package.json` / `package-lock.json` ✏️ | Dependencias. Agregados `npm test` (`vitest run`) y `npm run test:watch` (`vitest`) |
| `postcss.config.mjs` | Configuración Tailwind CSS 4 |
| `vitest.config.mjs` 🆕 | Configuración de Vitest: entorno `jsdom`, alias `@/`, y el archivo de setup de `test/` |

---

# `app/` — páginas y contenido

| Archivo / carpeta | Qué hace |
|---|---|
| `api.jsx` ✏️ | Instancia Axios compartida; configura base URL e inyecta JWT en requests autenticados. El interceptor de request **no pisa** un `Authorization` ya seteado a mano (ej. el `Basic` de `/login`) — antes lo pisaba con el `Bearer` de una cookie vieja, causando que el login pidiera el usuario y contraseña dos veces |
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
| `page.jsx` ✏️ | Entrada del dashboard ADMIN, protegida con `requireAuth(["ADMIN"])`. Combina la cuadrícula de cocheras, el alta de visitantes, y botones de navegación hacia `/cocheras` y `/usuarios` |
| `EstadoCocherasGrid.jsx` 🆕 | Cuadrícula visual de ocupación: agrupa las cocheras por tipo (motos, autos, remolques, accesibles) y marca cada una como libre/ocupada/deshabilitada comparando `/api/v1/cocheras` contra `/api/v1/cocheras/disponibles` del día |
| `VisitantesContent.jsx` | Alta de visitante + vehículo hecha por el admin (formulario completo) |

### `app/dashboard-admin/cocheras/`

Módulo de gestión de cocheras.

| Archivo | Qué hace |
|---|---|
| `page.jsx` 🆕 | Ruta `/dashboard-admin/cocheras`; valida server-side rol `ADMIN` |
| `CocherasManagement.jsx` 🆕 | CRUD completo de cocheras: alta, edición (con confirmación al deshabilitar una cochera con reservas), baja (bloqueada si tiene reservas asociadas), y filtros por sector/tipo/estado |

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
| `page.jsx` ✏️ | Entrada del dashboard USER, protegida con `requireAuth(["USER"])`. Combina "Mis datos" y "Nueva reserva" en una sola página |
| `MiPerfilContent.jsx` 🆕 | El propio visitante carga sus datos (nombre, documento, teléfono, email) una sola vez, vinculados a su cuenta (`/api/v1/visitantes/me`), y agrega sus vehículos |
| `ReservasContent.jsx` ✏️ | Alta de reserva por patente: se escribe/elige la patente (autocompletado nativo) y se resuelve automáticamente el visitante y el tipo de vehículo, en vez de elegir visitante→vehículo por separado. Vuelve a pedir la lista de vehículos al hacer foco en el campo (si se cargó uno recién en "Mis datos", arriba, no queda desactualizada) |

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

# `test/` — tests automatizados (frontend)

🆕 Toda la carpeta es nueva: no existía testing en el frontend antes de esta sesión. Usa **Vitest + React Testing Library + jsdom**, más `axios-mock-adapter` para probar los interceptores de `api.jsx` sin red real. Corre con `npm test` (una vez) o `npm run test:watch`.

Convención: `test/` refleja la estructura de `app/`, `store/` y `utils/` (misma idea que `src/test/java/...` reflejando `src/main/java/...` en el backend).

| Archivo | Qué prueba |
|---|---|
| `setup.js` | Carga los matchers de `jest-dom`, limpia el DOM y las cookies después de cada test |
| `api.test.jsx` | Interceptores de `app/api.jsx`: baseURL, inyección del Bearer desde la cookie, **que no pise un Authorization ya seteado a mano** (regresión del bug del login doble), y el manejo de 401 (borra cookie + redirige) |
| `login/page.test.jsx` | `app/login/page.jsx`: validaciones, Basic Auth armado correctamente, redirección según rol (ADMIN vs USER), errores del backend |
| `store/authStore.test.js` | `store/authStore.js`: decodificación de authorities del JWT, cookie, expiración, `logout`/`checkAuth` |
| `utils/env.test.js` | `utils/env.js`: prioridad de `window.__ENV` sobre el valor de build |
| `dashboard-admin/EstadoCocherasGrid.test.jsx` | Agrupación por tipo, cálculo de ocupadas/libres/deshabilitadas, estado de carga y error |
| `dashboard-admin/VisitantesContent.test.jsx` | Alta de visitante + vehículo (dos POST encadenados), validaciones, errores de duplicados |
| `dashboard-admin/cocheras/CocherasManagement.test.jsx` | CRUD completo: filtros, alta, edición (con `window.confirm` al deshabilitar), baja (con confirmación) |
| `dashboard-admin/usuarios/UserManagement.test.jsx` | Alta de usuario, activar, editar roles, eliminar (con confirmación) |
| `dashboard-user/ReservasContent.test.jsx` | Resolución de visitante/vehículo por patente, cochera deshabilitada hasta tener match, **regresión del bug de caché de vehículos al hacer foco**, envío de la reserva |
| `dashboard-user/MiPerfilContent.test.jsx` | Autoregistro del visitante (`/me`), alta de vehículo propio, validaciones y errores del backend |

El detalle de qué casos prueba cada archivo (front y back) está en `TESTS.md`, en la raíz del repo.

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