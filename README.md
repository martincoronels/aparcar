# aparcar

Sistema web para la gestión y reserva de estacionamientos — Proyecto Integral de Desarrollo.

El proyecto tiene dos partes independientes en este mismo repo:
- **`aparcar-api-back`**: backend (Spring Boot + Postgres)
- **`aparcar-front`**: frontend (Next.js)

Esta guía asume que **no tenés nada instalado todavía**. Seguila en orden.

---

## 0. Instalar lo necesario (una sola vez por máquina)

| Herramienta | Para qué | Descarga |
|---|---|---|
| **Git** | Clonar el repo | https://git-scm.com/downloads |
| **Docker Desktop** | Levantar el backend + la base de datos sin instalar Java/Maven/Postgres a mano | https://www.docker.com/products/docker-desktop |
| **Node.js 20 LTS** (incluye npm) | Correr el frontend | https://nodejs.org |

Después de instalar Docker Desktop, **abrilo y dejalo corriendo** (tiene que estar la ballenita activa en la barra de tareas / menu bar) antes de seguir. Sin eso, los comandos `docker` van a fallar.

Verificá que todo quedó instalado:
```bash
git --version
docker --version
node --version
npm --version
```

---

## 1. Clonar el repo

```bash
git clone https://github.com/martincoronels/aparcar.git
cd aparcar
```

---

## 2. Backend — build + run

> No hace falta instalar Java ni Maven: todo el "build" pasa **dentro** del contenedor de Docker.

```bash
cd aparcar-api-back
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```
**Mac / Linux:**
```bash
cp .env.example .env
```

Ese archivo `.env` no está en el repo (por seguridad, nunca se sube), pero `.env.example` ya trae valores por defecto que funcionan entre sí para desarrollo local — no hace falta editarlo.

Ahora el build + arranque, todo en un comando:
```bash
docker compose up --build
```

**Qué hace exactamente:**
- `docker compose up` levanta dos servicios definidos en `docker-compose.yaml`: `db` (Postgres) y `server` (el backend).
- `--build` es **el build**: le dice a Docker que compile la imagen del backend desde cero usando `dockerfiles/server.Dockerfile`, que por dentro corre `mvn clean install` con una versión de Maven que ya viene incluida en la imagen. Es fundamental pasarlo siempre que el código cambió (si no, Docker podría reusar una imagen vieja en caché).
- El servicio `server` espera automáticamente a que `db` esté sano antes de arrancar (chequeo de salud incluido), así que no hay que preocuparse por el orden.

**Qué vas a ver en pantalla:** primero mucho log de la build (descarga de dependencias, compilación), después el banner de Spring Boot, y termina con algo como:
```
Started AparcarApiApplication in X.XXX seconds
```
La terminal se queda mostrando logs — **es lo esperado**, significa que el servidor sigue corriendo. No la cierres.

**Verificación:** abrí **http://localhost:8080/docs** en el navegador. Si carga Swagger con la lista de endpoints, el backend está funcionando.

---

## 3. Frontend — build + run

Abrí **otra terminal nueva** (dejá la del backend corriendo) y desde la raíz del repo:

```bash
cd aparcar-front
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```
**Mac / Linux:**
```bash
cp .env.example .env
```

Este `.env` define `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`, la URL donde el frontend espera encontrar al backend. Si el backend corre en otro puerto o máquina, hay que editarlo.

Instalar dependencias (solo hace falta la primera vez, o cuando cambia `package.json`):
```bash
npm install
```

**Para desarrollo día a día** (recarga automática al guardar cambios):
```bash
npm run dev
```

**Para probar el build de producción** (lo que realmente se despliega, sin hot-reload):
```bash
npm run build
npm start
```

**Qué vas a ver en pantalla** (con `npm run dev`):
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
✓ Ready in XXXms
```

**Verificación:** abrí **http://localhost:3000**. Deberías caer en la app (te redirige a `/login` si no estás autenticado).

---

## 4. Orden de arranque

1. Docker Desktop abierto y corriendo.
2. Backend (`docker compose up --build` en `aparcar-api-back`) — esperar a ver `Started AparcarApiApplication`.
3. Frontend (`npm run dev` en `aparcar-front`) en otra terminal.

El frontend necesita al backend corriendo para funcionar (login, listar visitantes, crear reservas, etc.) — sin el backend arriba, vas a ver errores de red al usar los formularios.

---

## 5. Monitoreo — cómo saber si algo anda mal

| Dónde | Señal de problema | Causa probable |
|---|---|---|
| Backend | `Connection refused` / `Communications link failure` en los logs | La base de datos todavía no estaba lista, o Docker Desktop no está corriendo |
| Backend | `BUILD FAILURE` durante `docker compose up --build` | Error real de compilación — copiar el log completo para diagnosticarlo |
| Backend | `port is already allocated` | Ya hay algo usando el puerto 8080 o 5433 en tu máquina; cerralo o cambiá el puerto en `docker-compose.yaml` |
| Frontend | La página carga pero los formularios tiran error al enviar | El backend no está corriendo, o `NEXT_PUBLIC_API_BASE_URL` en `.env` no apunta a donde está el backend |
| Frontend | `npm install` falla | Versión de Node muy vieja — confirmá `node --version` (necesitás 20+) |

---

## 6. Apagar todo

En cada terminal, en este orden:
1. Frontend: `Ctrl+C`
2. Backend: `Ctrl+C`, y opcionalmente `docker compose down` (desde `aparcar-api-back`) para liberar los contenedores por completo.

---

## 7. Correr los tests (backend)

Los tests corren contra una base en memoria (H2): no necesitan `db` ni `server` levantados. Como la imagen final del backend no incluye Maven (solo el `.jar` ya compilado), para correr los tests sin instalar Maven en tu máquina usá un contenedor temporal con la imagen de Maven, montando el código fuente:

**Windows (PowerShell), desde `aparcar-api-back`:**
```powershell
docker run --rm -v "${PWD}:/app" -w /app maven:3.9.9-eclipse-temurin-21-alpine mvn test
```

**Mac / Linux, desde `aparcar-api-back`:**
```bash
docker run --rm -v "$(pwd):/app" -w /app maven:3.9.9-eclipse-temurin-21-alpine mvn test
```

Si preferís instalar Maven local (por ejemplo para usar `mvn spring-boot:run` en vez de Docker), después podés correr directamente `mvn test`.
