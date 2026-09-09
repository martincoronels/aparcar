<div align="center">

# 🅿️ AparcAR

### Nadie debería dar vueltas buscando dónde estacionar.

![Sprint](https://img.shields.io/badge/Sprint-1_MVP-8b5cf6?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-Java_%2F_Spring_Boot-6db33f?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-Next.js_%2F_React-000000?style=flat-square)
![Status](https://img.shields.io/badge/Estado-En_desarrollo-orange?style=flat-square)

</div>

---

## El problema

Oficinas, universidades, sanatorios y organizadores de eventos administran sus cocheras a ojo: planillas sueltas, un guardia anotando patentes a mano, visitantes que llegan sin saber si van a tener lugar. El resultado es siempre el mismo — **sobreocupación, demoras en el acceso y cero control real de quién entra al predio.**

## Qué es AparcAR

**AparcAR** es la plataforma que un establecimiento usa para poner orden en su estacionamiento: cada visitante con su vehículo, su reserva y su cochera asignada — sin superposiciones, sin sorpresas en la barrera.

- 🔐 **Acceso controlado** para el personal interno del establecimiento
- 🧍 **Registro de visitantes** y sus vehículos (patente y tipo)
- 🅿️ **Cocheras clasificadas** por número, sector y tipo (auto, moto, accesible, carga)
- 📅 **Reservas por fecha**, con asignación de una cochera compatible
- 🚫 **Cero sobreocupación** — el sistema jamás asigna dos reservas al mismo lugar

## Cómo está armado

Este repositorio contiene las dos mitades del proyecto:

| Carpeta | Qué encontrás ahí |
|---|---|
| [`aparcar-api/`](./aparcar-api) | Backend — Java, Spring Boot, PostgreSQL |
| [`aparcar-front/`](./aparcar-front) | Frontend — Next.js, React |

Cada una tiene su propio README con las instrucciones técnicas para levantar el proyecto localmente.

## Estado actual

🚧 **Sprint 1 — primer MVP en desarrollo.** El foco de esta etapa: login de usuarios internos, ABM de cocheras, registro de visitantes y sus vehículos, y creación de reservas.

## Equipo

Proyecto desarrollado para **UCAio**, la software factory de la UCA — cátedra de Proyecto Integral de Desarrollo.

| Integrante | A cargo de |
|---|---|
| Mateo | ABM de Cocheras |
| Tincho | Login y ABM de Usuarios |
| Denti | Visitantes, Vehículos, Reservas y Base de Datos |

