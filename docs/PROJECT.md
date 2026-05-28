# Posta — Hub de Gestión PyME

> Fuente de verdad del **qué** y el **por qué**. Para el **cómo** técnico, ver `ARCHITECTURE.md`.
> Para las reglas que el agente de IA debe respetar siempre, ver `/CLAUDE.md`.

---

## 1. Visión

Posta es un SaaS multi-tenant de gestión comercial y financiera para **pequeñas y medianas empresas argentinas sin conocimientos técnicos, contables ni financieros**.

La propuesta de valor es **"complejidad oculta bajo una UX excepcional"**: el backend resuelve la lógica operativa, las integraciones y la normativa fiscal (AFIP); el frontend se presenta como una interfaz limpia, intuitiva y accionable en pocos clics, mobile-first.

El diferencial comercial NO es la cantidad de funcionalidades: es **la experiencia de uso y la eliminación de la fricción de entrada**. Dos cosas tienen prioridad absoluta sobre todo lo demás:

1. **Simplicidad de uso (UX/UI).** Si una decisión técnica complica la experiencia del usuario final, esa decisión está mal.
2. **Onboarding sin fricción (Zero-Friction Onboarding).** El motor de importación de Excel/CSV debe ser infalible. Es lo que vence el "miedo a migrar", que es la barrera #1 de adopción.

## 2. El problema

Las PyMEs argentinas viven con su información operativa fragmentada: planillas de Excel aisladas, anotaciones físicas y sistemas legados (obsoletos, caros, complejos). Los procesos fiscales de AFIP y las métricas financieras básicas les resultan abrumadores porque no son contadores. Y tienen un **miedo paralizante a migrar**: no cambian de sistema por temor a perder su historial de clientes, cuentas corrientes, deudas y stock, o por no saber cómo exportar/importar sus datos.

## 3. La solución

Una plataforma centralizada en la nube que unifica ventas, stock, compras, tesorería y facturación legal bajo flujos extremadamente simplificados, con un **motor de migración universal** (Excel/CSV) accesible tanto en el onboarding como dentro de cada módulo, que guía al usuario paso a paso mapeando sus planillas viejas de forma visual y con validación en tiempo real.

## 4. El usuario

Dueños y empleados de PyMEs argentinas (kioscos, almacenes, gastronómicas, comercios de indumentaria, etc.). Vienen de Excel y de sistemas viejos. Tienen poca paciencia para curvas de aprendizaje. La interfaz tiene que sentirse obvia, confiable y rápida desde el primer minuto.

**Implicancia de diseño:** la jerga contable y fiscal (IVA, CAE, débito/crédito, retenciones) debe quedar **oculta** para el dueño y el vendedor. El contador sí ve el detalle. Nunca se le muestra al dueño un asiento contable: ve transacciones en lenguaje natural.

### Roles del producto

| Rol | Acceso |
|---|---|
| **Dueño** | Acceso total: todos los módulos, finanzas, costos, ganancias, reportes y configuración. |
| **Empleado / Vendedor** | Solo POS (ventas) y visualización de stock. **Bloqueado**: costos, ganancias, finanzas, configuración. |
| **Contador** | Acceso de **solo lectura** para descargas y exportaciones (IVA Ventas/Compras, Excel de movimientos). Ve el detalle fiscal completo. **No** ve costos ni ganancias de productos (solo el dueño). |

El control de acceso por rol no es solo UI: se aplica en el backend a nivel de endpoint y, donde corresponde, condiciona qué columnas/campos se devuelven (un vendedor nunca recibe el costo de un producto en la respuesta de la API).

---

## 5. Alcance: producto vs. roadmap futuro

> **Regla de oro del alcance.** Implementamos el **alcance del producto (sección 5.1)** con estándares de producción desde el día uno. Todo lo de **Roadmap futuro (sección 5.2)** NO se construye ahora, pero la arquitectura debe dejar las "costuras" (interfaces, puntos de extensión) para que sumarlo después no requiera reescribir el núcleo. Cuando una decisión de diseño del producto pueda cerrarle la puerta a un módulo del roadmap, se documenta el trade-off y se elige la opción que mantiene la puerta abierta, siempre que no comprometa la simplicidad de la UX.

### 5.1. Alcance del producto — lo que se construye ahora

**Cimiento SaaS**
- Autenticación y registro seguro.
- Aislamiento de datos multi-tenant estricto (ver `ARCHITECTURE.md` → RLS).
- Roles y permisos básicos (dueño, vendedor, contador).

**Módulo 0 — Onboarding / Motor de Importación Universal (Excel/CSV)** *(diferencial crítico)*
- Carga inicial asistida con drag & drop de Excel/CSV de productos/stock y clientes.
- Mapeador visual: el usuario asocia "sus columnas" con los campos del sistema. El sistema pre-sugiere coincidencias por heurística (ej.: una columna "Detalle" → campo "Nombre del producto").
- Validación con feedback humano: si una fila tiene un error (ej.: precio con letras, CUIT mal formado), se pinta la celda exacta y se corrige in-line, sin rechazar todo el archivo y sin jerga técnica.
- Procesamiento **asíncrono** para archivos pesados (miles de filas) con barra de progreso. El sistema nunca se "cuelga".

**Módulo 1 — Dashboard del dueño**
- Resumen visual: ventas del día/mes, caja disponible, ganancia real (gráficos simples, no abrumadores).
- Alertas de inventario (productos bajo stock mínimo).
- KPIs: producto más vendido, horarios pico.

**Módulo 2 — Ventas y Facturación Simple**
- POS ágil: vender en tres clics (producto → método de pago → comprobante).
- Integración AFIP (WSFEV1): facturas A, B, C y ticket. **Se construye detrás de una interfaz/adaptador desde el inicio; ver decisión D-07.**
- Modo "Remito/Presupuesto" (no fiscal) para vender sin facturar en el momento.
- Clientes y cuentas corrientes (activos): ficha, historial, saldo deudor.
- Registro e historial de ventas.
- Exportación de IVA Ventas a Excel.

**Módulo 3 — Inventario y Stock**
- Gestión de productos: SKU/código de barras, costo, precio, stock mínimo.
- Actualización masiva por Excel (bajar inventario → editar → re-subir).
- Trazabilidad básica de movimientos.

**Módulo 4 — Compras y Proveedores**
- Registro de gastos y compras (para calcular ganancia real).
- Saldos de proveedores (cuentas corrientes pasivas).
- Exportación de IVA Compras a Excel.

**Módulo 5 — Tesorería y Finanzas Básicas**
- Caja chica: apertura/cierre diario, ingresos/egresos en efectivo.
- Flujo de caja: separación visual entre facturación bruta y dinero neto real (restando costo de mercadería e impuestos estimados), en lenguaje claro.

### 5.2. Roadmap futuro — visión, fuera del alcance actual

- **Sincronización e-commerce** (Mercado Libre, Shopify, Tiendanube) con webhooks en tiempo real: descuento de stock, facturación automática, registro de cobro con comisiones.
- **Mercado Pago / integración bancaria**: cobros netos de tasas y retenciones.
- **CRM** de clientes ampliado.
- **Contabilidad expresa**: libro mayor simplificado con asientos automáticos de fondo.
- **Asistente IA fiscal** (chatbot con contexto fiscal local).
- **Copiloto de migración por IA**: el usuario adjunta un Excel desordenado y la IA lo estructura para importar.

**Costuras a dejar previstas en el producto** (detalle técnico en `ARCHITECTURE.md`): los módulos de integración externa (AFIP, y a futuro ML/Shopify/MP) viven detrás de adaptadores con interfaz estable; el dominio de ventas/stock/tesorería no conoce el detalle de cada integración. La sincronización e-commerce y los cobros con pasarela asumen procesamiento asíncrono — la infraestructura de colas del producto (para Excel) es la misma que después sirve a los webhooks.

---

## 6. Decisiones de arquitectura (registro)

> Registro vivo de decisiones. Cada una tiene contexto y justificación para que el agente de IA no las "re-litigue" en cada sesión. El **cómo** detallado está en `ARCHITECTURE.md`.

| ID | Decisión | Justificación corta |
|---|---|---|
| D-01 | **Plataforma: Supabase** (Postgres gestionado + Auth + Storage). | RLS de primera clase (clave para multi-tenant), auth integrada, MCP oficial, deploy rápido. El núcleo es Postgres estándar → migración futura a AWS/Terraform viable. |
| D-02 | **Backend: NestJS** (monolito modular). | Estructura opinada y fuertemente tipada que mantiene a raya al agente; separación real por módulos de dominio; muy bien documentado (la IA alucina menos). |
| D-03 | **Frontend: Next.js + React + TypeScript.** | Mismo lenguaje en todo el stack; mobile-first; ecosistema maduro. |
| D-04 | **TypeScript de punta a punta** en la app; **Python** solo para microservicios de integración. | Reduce fricción del agente; comparte tipos/validaciones entre front y back. |
| D-05 | **Integraciones externas como microservicios** (AFIP primero), pensados para correr en una Lambda y ser consumidos por el monolito vía una interfaz HTTP limpia. | Aísla SOAP/certificados/SDKs externos del núcleo; permite escalar/desplegar la integración por separado; mantiene el monolito limpio. |
| D-06 | **Multi-tenant: discriminador `tenant_id` + Row-Level Security en Postgres**, con RLS forzado. | Defensa en profundidad: aunque la capa de app olvide un filtro, la base no filtra datos de otro tenant. La seguridad es prioritaria en este producto. Ver skill de RLS. |
| D-07 | **AFIP: adaptador con interfaz estable, implementación mock primero, real después.** | El producto puede operar con mock en dev/CI mientras se integra AFIP real en producción; TODO debe quedar listo para enchufar la integración real (certificados, WSAA, WSFEV1, modo "pendiente de facturación" si AFIP se cae) sin tocar el dominio de ventas. |
| D-08 | **Dinero: `NUMERIC` en la base; nunca `float`** en ningún cálculo monetario. Manejo con tipo dedicado en la app. | AFIP exige centavos exactos; los float producen errores de redondeo. Requisito explícito del proyecto. Ver skill de dinero. |
| D-09 | **Procesamiento asíncrono: cola de trabajos (BullMQ + Redis).** | El parser de Excel pesado no puede bloquear la UI; barra de progreso. La misma cola sirve a futuro para webhooks de e-commerce y reintentos de AFIP. |
| D-10 | **Idioma: solo español rioplatense.** Moneda: ARS (miles con punto, decimales con coma). Fechas DD/MM/AAAA. | Producto 100% local. No se invierte en i18n en la v1. |
| D-11 | **Despliegue inicial: PaaS** (Supabase + un PaaS para el monolito). AWS + Terraform queda para una fase posterior de escala. | No vale la pena la complejidad de IaC en cloud crudo para el primer release. La elección de Supabase no bloquea esa migración futura. |
| D-12 | **Proyecto AI-native.** Disciplina de desarrollo impuesta por skills (Superpowers como base + skills de dominio propias), MCPs y reglas en `CLAUDE.md`. TDD obligatorio: ninguna feature se considera hecha sin tests unitarios **y** E2E. | El proyecto se desarrolla mayormente con IA; la calidad depende de que el agente siga lineamientos estrictos y verificables. |
| D-13 | **ORM: Drizzle.** SQL-first, ligero, control directo sobre queries crudas. `db.execute(sql\`SET LOCAL app.tenant_id = ${tenantId}\`)` es idiomático. Sin capa de abstracción que interfiera con RLS. | Prisma es más maduro, pero el control explícito sobre `SET LOCAL` y la ausencia de un query-builder opaco reducen el riesgo de filtraciones accidentales de contexto de tenant. |
| D-14 | **Validación: Zod compartido en `packages/validation`.** Un schema Zod por entidad, reutilizado en NestJS pipes (back) y React Hook Form (front). | Una sola fuente de verdad para las reglas de validación; TypeScript de punta a punta garantiza que un cambio de schema se refleja simultáneamente en ambas capas sin duplicación. |

---

## 7. Notas de robustez (requisitos del mercado argentino)

Estas son condiciones de calidad que el agente debe respetar al implementar:

- **Decimales y moneda.** Por la inflación, los precios cambian seguido y el consumidor no usa centavos, pero AFIP los exige en la factura. Tipos `NUMERIC`/decimal precisos, nunca `float` (ver D-08).
- **Excel asíncrono.** Subir un Excel de 5.000 productos no puede colgar el sistema. Procesamiento en segundo plano con barra de progreso (ver D-09).
- **Resiliencia de AFIP.** El servidor de AFIP se cae con frecuencia. Si AFIP no responde, la venta se guarda igual como **"Pendiente de facturación"** para no trabar el local, y se reintenta autorizar automáticamente más tarde. Esta tolerancia a fallos es parte del contrato del adaptador AFIP (D-07), aunque la implementación real del WS llegue después.

---

## 8. Identidad de producto

**Nombre:** Posta. *(Argentinismo: "en serio", "de verdad", "posta que funciona". Cercano, confiable, local.)*

**Dirección visual:** Editorial cálido. Definida y aprobada vía POC. El sistema de diseño completo (paleta, tipografía, componentes, patrón de navegación flotante, tratamiento de montos en ARS) está documentado en `docs/DESIGN_SYSTEM.md` y debe respetarse en todo el frontend. La estética NO es decorativa: es una fortaleza comercial del producto.
