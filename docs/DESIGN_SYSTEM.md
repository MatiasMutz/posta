# Sistema de Diseño — Posta

> Dirección visual **aprobada** vía POC: **Editorial cálido**. Este documento es la fuente de verdad para todo el frontend. La estética es una fortaleza comercial del producto, no decoración: respetarla con cuidado.
>
> Principio rector: **familiar y muy intuitivo, con personalidad propia y quiebres puntuales** (sobre todo en navegación). Nunca sacrificar claridad por estética: el usuario viene de Excel y le tiene miedo a migrar.

---

## 1. Personalidad

Confiable y cálido, no corporativo-frío ni juguetón-startup. El usuario necesita sentir "esto es serio, no voy a perder mi plata" sin la rigidez bancaria que asusta. Mucho aire, los números como protagonistas, sensación editorial (como una buena revista financiera) más que de panel de admin genérico.

**Veto explícito:** nada de azul SaaS corporativo. Nada que evoque "software viejo de gestión argentino" (gris, denso, ventanitas). Evitar la estética de plantilla de admin panel.

---

## 2. Tokens de color

Paleta cálida sobre papel (no blanco puro). Acento terracota. Semánticos calibrados a la paleta (sin azul puro).

```
/* Superficie */
ink        #1a1612   /* texto principal, fondos oscuros (panel "ink") */
inkSoft    #3a312a   /* texto secundario fuerte */
muted      #7a6e62   /* texto terciario, labels, símbolo $ */
rule       #d8cfc0   /* bordes/divisores */
ruleSoft   #ece5d6   /* divisores suaves */
paper      #faf6ec   /* fondo base (papel cálido) */
paperWarm  #f3ecdb   /* fondo alternativo */
paperDeep  #ebe2cc   /* fondo de chips neutros */
card       #ffffff   /* tarjetas / superficies elevadas */

/* Acento */
accent     #c9542e   /* terracota — acción primaria, marca */
accentSoft #f4d6c8   /* fondo de pills de acento */
accentDeep #9a3e21   /* texto sobre accentSoft, hover */

/* Semánticos (calibrados a la paleta cálida) */
ok / pos   #3e7d4a   verde musgo   · okSoft  #dde8d2   /* éxito, saldo positivo */
warn       #b8862a   mostaza       · warnSoft #f3e4be  /* advertencia */
err / neg  #a83a2a   bermellón     · errSoft #f3d4ca   /* error, saldo negativo */
info       #5a5346   gris-marrón   · infoSoft #e7e1d2  /* info (NO azul) */
```

**Saldos:** positivo en verde musgo (`pos`), negativo en bermellón (`neg`). Inconfundibles de un vistazo — es lo primero que el dueño busca en caja y cuentas corrientes.

Estos tokens se traducen a la config de Tailwind (theme.extend.colors) y/o a variables CSS. No hardcodear hex en componentes; usar siempre el token.

---

## 3. Tipografía (triple registro)

| Rol | Fuente | Uso |
|---|---|---|
| **Serif** | Instrument Serif (fallback: Source Serif Pro, Georgia) | Títulos, encabezados, y **el entero de los montos en ARS**. Da el carácter editorial. |
| **Sans** | Geist (fallback: -apple-system, system-ui) | Toda la UI: labels, botones, texto de cuerpo, tablas. |
| **Mono** | JetBrains Mono (fallback: ui-monospace) | Datos: decimales de montos, SKUs, códigos, etiquetas tipo "uppercase tracking" de secciones. |

---

## 4. Tratamiento de montos en ARS (firma visual del producto)

Los montos son protagonistas. Patrón del componente `APrice`:

- Símbolo **`$`** chico, en sans, color `muted`, a la izquierda.
- **Entero** grande, en **serif**, color `ink` (o `neg` si es negativo), con tracking ajustado.
- **Decimales** chicos (≈42% del tamaño del entero), en **mono**, color `muted`, precedidos por coma.
- Formato local: miles con punto, decimales con coma (`$ 1.234,56`).

Esta jerarquía (serif grande + mono chico) es lo que hace que la plata se lea de un vistazo y se sienta "editorial". Replicarla con fidelidad.

---

## 5. Forma y elevación

```
radius      2px     /* casi recto — aire editorial-funcional, no "burbuja" */
shadow      0 1px 2px rgba(60,40,20,.08), 0 8px 24px -8px rgba(60,40,20,.12)
shadowFlat  0 1px 0 rgba(60,40,20,.06)
```

Radios chicos (2px), sombras cálidas y sutiles (tinte marrón, no gris/negro). Bordes con `rule`. Las tarjetas son blancas sobre papel cálido.

---

## 6. Componentes núcleo (del POC)

- **Botones (`ABtn`)**: variantes `primary` (terracota), `secondary` (blanco + borde), `ghost` (transparente), `ink` (oscuro). Tamaños sm/md/lg. Radio 2px, peso 500.
- **Pills/chips (`APill`)**: tonos `neutral`, `ok`, `warn`, `err`, `accent`. Para estados (ej.: "Pendiente de facturación" en warn, "Pagado" en ok).
- **Tablas densas** (inventario, movimientos): densidad **media-cómoda**, legibilidad de números prioritaria, opción de vista compacta. El usuario tolera varias columnas (viene de Excel) pero no hay que abrumar a un no técnico.
- **Paginación (`APaginacion`)**: obligatoria bajo toda tabla de datos de servidor. Muestra rango (`51 – 100 de 237`), página actual y botones Anterior/Siguiiente. Estado vacío: "Sin resultados". Navegación vía query param `pagina` en la URL (default 50 filas). Ver skill `paginacion`.
- **Tarjetas de métrica** (dashboard): label en mono uppercase + monto protagonista + delta.
- Estados obligatorios para cada componente: hover, foco, carga, vacío, error. Los estados vacíos guían (no dejan al usuario perdido).

---

## 7. Navegación — el quiebre de patrón

El POC NO usa el sidebar oscuro estático de siempre. La navegación entre módulos es **flotante**, pensada mobile-first como ciudadano de primera clase (no como reducción del desktop).

Implementación actual (`components/nav/`):

- **`NavShell`** en el layout raíz: el nav **no se desmonta** al cambiar de ruta (evita parpadeos y layout shift).
- **Desktop:** sidebar fijo `w-48`, flotante a la izquierda; **mobile:** barra inferior.
- **Panel** (icono ▦) es el **primer ítem** y lleva al inicio según rol (dashboard / POS / vista contador). Si coincide con otro ítem del menú, no se duplica.
- Sección de perfil + cerrar sesión: altura reservada desde el primer render; botón logout con hover `err-soft` + borde.
- Ítems filtrados por rol (`dueno`, `vendedor`, `contador`); ver `NavFlotante.tsx`.

Reglas de diseño:

- Mantener el carácter flotante/elevado (no sidebar tradicional anclado a pantalla completa).
- En mobile, acceso rápido con el pulgar a POS, caja e inventario.
- Pantallas del producto: dashboard, POS, inventario, clientes, proveedores, compras, caja, importación, vista contador, equipo.

---

## 8. Reglas de aplicación

- Mobile-first real: diseñar mobile y escalar a desktop.
- Accesibilidad: contraste AA mínimo, áreas táctiles cómodas, legibilidad de números por encima de todo.
- Ocultar la jerga fiscal al dueño/vendedor; la vista de contador sí muestra el detalle (IVA, CAE, etc.).
- El POC HTML aprobado es la referencia canónica. Ante una duda visual no resuelta acá, mirar el POC antes de inventar.

---

## 9. Referencia

- En la carpeta `Referencia Diseño UI` se encuentra la referencia del diseño UI aprobado. Puedes usar Playwright para verificar que el diseño se está aplicando correctamente.