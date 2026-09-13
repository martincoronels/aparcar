# Índice de tests

Qué prueba cada archivo de test del proyecto, caso por caso. Ver `ARCHIVOS.md` para qué hace cada archivo de código en general.

---

# Backend (`aparcar-api-back/src/test/java/com/aparcar/api/`)

## `AparcarApiApplicationTests.java`

```
contextLoads
```

## `component/OTPCleanupTests.java`

```
"otpCleanup deletes all expired OTPs"
```

## `component/RevokedUserCacheTests.java`

```
"RevokedUserCache revokes and checks revoked users"
"RevokedUserCache rejects nulls"
```

## `component/SpringEmailSenderTests.java`

```
"sendPlainTextEmail should send email successfully"
"sendPlainTextEmail should throw RuntimeException on error"
```

## `filters/JWTGeneratorFilterTests.java`

```
"shouldNotFilter devuelve false solo para /login"
"doFilterInternal no agrega header Authorization si no hay autenticación"
"doFilterInternal genera un JWT con email y authorities cuando hay autenticación"
"El JWT expira 8 horas después de emitido"
```

## `filters/RateLimitFilterTests.java`

```
"shouldNotFilter deja pasar rutas que no son login/register/forgot-password"
"shouldNotFilter aplica rate limit a login, register y forgot-password"
"permite las primeras 5 requests de una misma IP"
"la 6ta request de la misma IP en la ventana recibe 429 y no llega al resto de la cadena"
"dos IPs distintas tienen buckets independientes"
```

## `integration/AuthControllerTests.java`

```
"/register validates input"
"/register creates inactive user"
"/login returns username"
"/forgot-password sends OTP"
"/reset-password resets password with valid OTP"
```

## `integration/CocheraControllerTests.java`

```
"[Caja negra] endpoints de gestión devuelven 401 para usuarios anónimos"
"[Caja negra] /disponibles es publico incluso para anonimos"
"[Caja negra] endpoints de gestión devuelven 403 para USER sin rol ADMIN"
"[Caja negra] POST /api/v1/cocheras devuelve 400 si falta el numero"
"[Caja negra] POST /api/v1/cocheras devuelve 201 y crea la cochera con datos validos"
"[Caja negra] POST /api/v1/cocheras devuelve 400 si el numero ya existe"
"[Caja negra] GET /api/v1/cocheras devuelve todas las cocheras"
"[Caja negra] GET /api/v1/cocheras/{id} devuelve 404 si no existe"
"[Caja negra] GET /api/v1/cocheras/{id} devuelve 200 con la cochera cuando existe"
"[Caja negra] PUT /api/v1/cocheras/{id} devuelve 404 si no existe"
"[Caja negra] PUT /api/v1/cocheras/{id} devuelve 200 y actualiza los datos"
"[Caja negra] PUT /api/v1/cocheras/{id} devuelve 400 si el nuevo numero ya esta en uso"
"[Caja negra] DELETE /api/v1/cocheras/{id} devuelve 404 si no existe"
"[Caja negra] DELETE /api/v1/cocheras/{id} devuelve 204 cuando no tiene reservas"
"[Caja negra] DELETE /api/v1/cocheras/{id} devuelve 400 si tiene reservas asociadas"
"[Caja negra] /disponibles excluye cocheras deshabilitadas"
"[Caja negra] /disponibles filtra por tipoVehiculo compatible"
```

## `integration/DashboardAccessSecurityTests.java`

```
"GET /api/v1/visitantes, /vehiculos y /reservas devuelven 401 para anónimos"
"GET /api/v1/visitantes, /vehiculos y /reservas devuelven 200 para rol USER (los necesita dashboard-user)"
"GET /api/v1/visitantes, /vehiculos y /reservas devuelven 200 para rol ADMIN (los necesita dashboard-admin)"
"GET /api/v1/cocheras/disponibles es público"
"GET /api/v1/usuarios devuelve 401 para anónimos"
"GET /api/v1/usuarios devuelve 403 para rol USER (esta pantalla es solo de ADMIN)"
"GET /api/v1/usuarios devuelve 200 para rol ADMIN"
```

## `integration/LoginFlowTests.java`

```
"login con credenciales válidas devuelve 200 y un JWT con el email y las authorities del usuario"
"login con un usuario que solo tiene rol USER devuelve un JWT con una sola authority"
"login con email inexistente devuelve 401 sin JWT"
"en el perfil de test/dev, cualquier contraseña autentica si el email existe"
```

## `integration/ReservaControllerTests.java`

```
"[Caja negra] endpoints de reservas devuelven 401 para anonimos"
"[Caja negra] POST /api/v1/reservas devuelve 400 si falta la fecha"
"[Caja negra] POST /api/v1/reservas devuelve 400 si la fecha es anterior a hoy"
"[Caja negra] POST /api/v1/reservas devuelve 404 si el visitante no existe"
"[Caja negra] POST /api/v1/reservas devuelve 404 si la cochera no existe"
"[Caja negra] POST /api/v1/reservas devuelve 400 si el vehiculo no pertenece al visitante indicado"
"[Caja negra] POST /api/v1/reservas devuelve 400 si el tipo de cochera no es compatible"
"[Caja negra] POST /api/v1/reservas devuelve 400 si la cochera ya tiene una reserva confirmada ese dia"
"[Caja negra] POST /api/v1/reservas devuelve 201 y queda CONFIRMADA cuando todo es valido"
"[Caja negra] POST /api/v1/reservas permite reservar una cochera ACCESIBLE con cualquier tipo de vehiculo"
"[Caja negra] GET /api/v1/reservas/{id} devuelve 404 si no existe"
"[Caja negra] GET /api/v1/reservas devuelve todas las reservas cargadas"
```

## `integration/UserControllerTests.java`

```
"/users/** should return 401 Unauthorized for anonymous users"
"/users/** should return 403 Forbidden for regular users"
"/users/activate returns 400 Bad Request for invalid email"
"/users/activate returns 200 OK for valid email"
"/users/inactive returns 200 OK with a set of inactive users"
"DELETE /users returns 400 Bad Request for caller email equal to deleted email"
"DELETE /users returns 200 OK for valid email"
"PUT /api/v1/usuarios/{id} actualiza nombre, telefono y authorities"
"PUT /api/v1/usuarios/{id} devuelve 404 si el usuario no existe"
"PUT /api/v1/usuarios/{id} devuelve 401 para anonimos"
```

## `integration/VehiculoControllerTests.java`

```
"[Caja negra] endpoints de vehiculos devuelven 401 para anonimos"
"[Caja negra] POST /api/v1/vehiculos devuelve 400 si la patente tiene formato invalido"
"[Caja negra] POST /api/v1/vehiculos devuelve 404 si el visitante no existe"
"[Caja negra] POST /api/v1/vehiculos devuelve 201 y normaliza la patente a mayusculas"
"[Caja negra] POST /api/v1/vehiculos devuelve 400 si la patente ya existe"
"[Caja negra] GET /api/v1/vehiculos sin filtro devuelve todos los vehiculos"
"[Caja negra] GET /api/v1/vehiculos?visitanteId filtra solo los de ese visitante"
"[Caja negra] GET /api/v1/vehiculos/{id} devuelve 404 si no existe"
"[Caja negra] GET /api/v1/vehiculos/{id} devuelve 200 con el vehiculo cuando existe"
```

## `integration/VisitanteControllerTests.java`

```
"[Caja negra] endpoints de visitantes devuelven 401 para anonimos"
"[Caja negra] POST /api/v1/visitantes devuelve 400 si falta el nombre"
"[Caja negra] POST /api/v1/visitantes devuelve 201 con datos validos"
"[Caja negra] POST /api/v1/visitantes devuelve 400 si el documento ya existe"
"[Caja negra] GET /api/v1/visitantes/{id} devuelve 404 si no existe"
"[Caja negra] GET /api/v1/visitantes/me devuelve 404 si la cuenta todavia no cargo su perfil"
"[Caja negra] GET /api/v1/visitantes/me devuelve el perfil vinculado a la cuenta autenticada"
"[Caja negra] POST /api/v1/visitantes/me crea el perfil vinculado a la cuenta autenticada"
"[Caja negra] POST /api/v1/visitantes/me devuelve 400 si la cuenta ya tiene un perfil cargado"
"[Caja negra] POST /api/v1/visitantes/me devuelve 400 si el documento ya esta en uso por otro visitante"
```

## `security/AppUserDetailsServiceTests.java`

```
"loadUserByUsername mapea las authorities del AppUser a GrantedAuthority"
"loadUserByUsername lanza UsernameNotFoundException si el email no existe"
```

## `security/authenticationProvider/DevAuthenticationProviderTests.java`

```
"autentica exitosamente sin importar la contraseña, si el usuario existe"
"propaga UsernameNotFoundException si el email no existe"
"supports() solo acepta UsernamePasswordAuthenticationToken"
```

## `security/authenticationProvider/ProdAuthenticationProviderTests.java`

```
"autentica exitosamente cuando la contraseña matchea el hash"
"rechaza con BadCredentialsException cuando la contraseña no matchea"
"rechaza con BadCredentialsException (no UsernameNotFoundException) cuando el email no existe"
```

## `service/AuthServiceTests.java`

```
"register throws ValidationException when email already registered"
"register successfully creates a new user"
"createAndSendOTP throws NotFoundException when user not found"
"createAndSendOTP successfully creates and sends OTP"
"resetPassword throws NotFoundException when user not found"
"resetPassword throws OTPException when OTP is invalid"
"resetPassword throws OTPException when OTP is expired"
"resetPassword successfully resets the user's password"
```

## `service/CocheraServiceTests.java`

```
"crear lanza ValidationException si ya existe una cochera con ese numero"
"crear guarda la cochera cuando el numero no esta repetido"
"obtenerPorId lanza NotFoundException si no existe"
"obtenerPorId devuelve la cochera cuando existe"
"editar lanza NotFoundException si no existe"
"editar lanza ValidationException si el nuevo numero ya esta en uso por otra cochera"
"editar permite guardar sin chequear duplicados si el numero no cambia"
"eliminar lanza NotFoundException si no existe"
"eliminar lanza ValidationException si la cochera tiene reservas asociadas"
"eliminar borra la cochera cuando no tiene reservas asociadas"
"listarDisponibles excluye cocheras con una reserva confirmada en esa fecha"
"listarDisponibles filtra por tipo exacto de vehiculo cuando se indica"
"listarDisponibles incluye cocheras ACCESIBLE sin importar el tipo de vehiculo"
"editar cancela las reservas CONFIRMADA de la cochera al pasarla a DESHABILITADA"
```

## `service/ReservaServiceTests.java`

```
"crear lanza NotFoundException si el visitante no existe"
"crear lanza ValidationException si el vehiculo no pertenece al visitante"
"crear lanza ValidationException si el tipo de cochera no es compatible con el vehiculo"
"crear permite una cochera ACCESIBLE para cualquier tipo de vehiculo"
"crear lanza ValidationException si la cochera ya tiene una reserva confirmada ese dia"
"crear guarda la reserva como CONFIRMADA cuando todas las validaciones pasan"
```

## `service/UserServiceTests.java`

```
"activateUser throws NotFoundException when user not found"
"activateUser activates user successfully"
"getInactiveUsers returns set of inactive user emails"
"deleteUser throws RuntimeException when caller email is null"
"deleteUser throws NotFoundException when user not found"
"deleteUser throws ValidationException when user tries to delete themselves"
deleteUserDeletesUserSuccessfully
"deleteUser desvincula el visitante propio antes de borrar la cuenta, para no violar la FK"
"deleteUser no toca visitantes cuando la cuenta no tiene ninguno vinculado"
```

## `service/VehiculoServiceTests.java`

```
"crear lanza NotFoundException si el visitante no existe"
"crear lanza ValidationException si ya existe un vehiculo con esa patente"
"crear normaliza la patente a mayusculas antes de guardar"
"obtenerPorId lanza NotFoundException si el vehiculo no existe"
"listarPorVisitante devuelve solo los vehiculos de ese visitante"
```

## `service/VisitanteServiceTests.java`

```
"crear lanza ValidationException si ya existe un visitante con el mismo documento"
"crear guarda el visitante cuando el documento no esta repetido"
"obtenerPorId lanza NotFoundException si el visitante no existe"
"obtenerPorId devuelve el visitante cuando existe"
"listar devuelve todos los visitantes"
"obtenerPropio lanza NotFoundException si la cuenta no tiene un visitante vinculado"
"obtenerPropio devuelve el visitante vinculado a la cuenta autenticada"
"crearPropio lanza ValidationException si la cuenta ya tiene un visitante cargado"
"crearPropio lanza ValidationException si el documento ya esta en uso por otro visitante"
"crearPropio crea el visitante vinculado a la cuenta autenticada"
```

---

# Frontend (`aparcar-front/test/`)

## `api.test.jsx`

```
"setea el baseURL usando getEnv"
"agrega el Bearer token de la cookie JWT cuando no hay Authorization explicito"
"no agrega Authorization si no hay cookie JWT"
"NO pisa un Authorization ya seteado a mano (ej. Basic Auth de /login), aunque haya una cookie JWT vieja"
"ante un 401, borra la cookie JWT y redirige a /login"
"ante un error que no es 401, no toca la cookie ni redirige"
```

## `login/page.test.jsx`

```
"muestra los campos de email y contraseña y el boton de ingresar"
"muestra errores de validacion y no llama a la API si el email esta vacio"
"muestra error de validacion si la contraseña tiene menos de 6 caracteres"
"envia el login con Basic Auth (email:password en base64) y no como body JSON"
"con rol ADMIN en el JWT, redirige a /dashboard-admin"
"con solo rol USER en el JWT, redirige a /dashboard-user"
"si la respuesta no trae header Authorization, muestra error y no redirige"
"ante un 401 del backend, muestra 'Email o contraseña incorrectos.'"
"ante otro error del backend, muestra el mensaje que devuelve el servidor"
```

## `store/authStore.test.js`

```
"setAuth decodifica las authorities del JWT (string separado por comas) a un array de roles"
"setAuth guarda el token en una cookie JWT"
"setAuth con un solo rol devuelve un array de un elemento (no un string suelto)"
"setAuth con un token invalido deja isAuthenticated en false y no revienta"
"logout borra la cookie JWT y limpia el estado"
"checkAuth restaura la sesion desde la cookie si el token todavia no expiro"
"checkAuth cierra la sesion si el token de la cookie ya expiro"
"checkAuth sin cookie deja la sesion como no autenticada pero hidratada"
```

## `utils/env.test.js`

```
"devuelve el valor de window.__ENV cuando está presente (runtime)"
"ignora window.__ENV si la clave pedida no está definida ahí"
"no revienta si window.__ENV no existe"
```

## `dashboard-admin/EstadoCocherasGrid.test.jsx`

```
"muestra el estado de carga mientras llegan los datos"
"muestra el mensaje de vacio cuando no hay cocheras cargadas"
"agrupa las cocheras por tipo y solo muestra columnas con al menos una"
"marca como ocupada una cochera habilitada que no aparece en /disponibles"
"una cochera DESHABILITADA se muestra como tal y no cuenta como ocupada"
"si falla la carga, muestra un toast de error"
```

## `dashboard-admin/VisitantesContent.test.jsx`

```
"muestra errores si se envia el formulario vacio"
"rechaza una patente con formato invalido"
"crea el visitante y despues el vehiculo con el visitanteId devuelto"
"si falla la creacion del visitante (ej. documento duplicado), no intenta crear el vehiculo"
"si falla la creacion del vehiculo (ej. patente duplicada), muestra el error del backend"
```

## `dashboard-admin/cocheras/CocherasManagement.test.jsx`

```
"carga y lista las cocheras existentes"
"filtra por sector"
"filtra por tipo"
"crea una cochera nueva y refresca la lista"
"muestra errores de validacion si falta numero o sector"
"al editar, precarga el formulario con los datos de la fila elegida"
"al deshabilitar una cochera antes HABILITADA, pide confirmacion; si se cancela, no llama a PUT"
"al deshabilitar y confirmar, llama a PUT con el nuevo estado"
"eliminar pide confirmacion, y si se cancela no llama a DELETE"
"eliminar, si se confirma, llama a DELETE y refresca la lista"
```

## `dashboard-admin/usuarios/UserManagement.test.jsx`

```
"carga y lista los usuarios existentes"
"un usuario inactivo muestra el badge Inactivo y el boton Activar"
"un usuario activo no muestra el boton Activar"
"activar un usuario llama a POST /users/activate con su email"
"muestra errores de validacion al crear un usuario con datos invalidos"
"crea un usuario con datos validos"
"al editar, precarga nombre, telefono y los roles marcados"
"editar sin ningun rol marcado muestra el error de validacion"
"guarda los cambios de edicion con PUT /api/v1/usuarios/{id}"
"eliminar pide confirmacion y llama a DELETE /users con el email"
"eliminar cancelado no llama a DELETE"
```

## `dashboard-user/ReservasContent.test.jsx`

```
"muestra el mensaje de vacio cuando no hay reservas cargadas"
"lista las reservas existentes con su estado"
"al escribir una patente registrada, muestra el nombre del visitante y el tipo de vehiculo"
"al escribir una patente que no existe, avisa que no se encontro ningun vehiculo"
"la cochera queda deshabilitada hasta encontrar un vehiculo por patente"
"al resolver un vehiculo (con fecha ya cargada por defecto), pide las cocheras disponibles de ese tipo"
"el foco en el campo de patente vuelve a pedir vehiculos y visitantes"
"confirmar la reserva envia el visitanteId/vehiculoId resueltos por patente, junto con cochera y fecha"
"el boton de confirmar reserva esta deshabilitado hasta elegir una cochera"
```

## `dashboard-user/MiPerfilContent.test.jsx`

```
"muestra el estado de carga inicialmente"
"si la cuenta todavia no tiene perfil (404), muestra el formulario de autoregistro"
"si ya tiene perfil, muestra sus datos y sus vehiculos"
"si ya tiene perfil pero ningun vehiculo, avisa que todavia no cargo ninguno"
"un error que no es 404 al cargar el perfil muestra un toast de error"
"muestra errores de validacion al enviar el formulario de autoregistro vacio"
"crea el perfil propio y pasa a mostrar la vista de datos guardados"
"si falla la creacion del perfil (ej. cuenta ya tiene uno), muestra el error del backend"
"agregar un vehiculo con patente invalida muestra el error de formato"
"agrega un vehiculo propio y refresca la lista"
```

---

# Totales

| | Archivos | Tests |
|---|---|---|
| Backend | 23 | 149 |
| Frontend | 10 | 77 |
| **Total** | **33** | **226** |

Correr todo:

```bash
# Backend
cd aparcar-api-back && mvn test

# Frontend
cd aparcar-front && npm test
```
