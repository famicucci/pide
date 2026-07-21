# Módulo de stock para Pide

## Objetivo

Agregar un módulo independiente de inventario basado en actualización directa de existencias, conservando el código del menú QR y del flujo de pedidos para retomarlo más adelante.

La primera versión busca reemplazar las planillas de papel que usa actualmente La Cuadra, sin imponer un sistema de inventario más complejo que su proceso actual.

## Alcance del MVP

- Mantener un catálogo de stock separado de los productos del menú.
- Registrar artículos con categoría obligatoria, marca opcional, nombre, unidad, orden y mínimos de temporada.
- Permitir que cualquier empleado autenticado consulte y modifique directamente la cantidad actual.
- Aplicar cada cambio al guardarlo, sin borradores ni cierre de planilla.
- Registrar automáticamente el responsable, fecha, valor anterior, valor nuevo y diferencia.
- Permitir una observación opcional al realizar un cambio.
- Dar a los administradores acceso a la gestión del catálogo y al historial.

Quedan fuera del MVP:

- Compras y proveedores.
- Ventas y consumos tipificados como movimientos automáticos.
- Consumos automáticos a partir de pedidos.
- Integración entre los artículos de stock y los productos del menú.
- Reportes avanzados.
- Cambios al alcance simplificado del QR, que se definirá por separado.

## Modelo de datos

Extender `scripts/migrate.ts` y mantener alineado `scripts/migrate.sql` con migraciones idempotentes para:

- `stock_categories`: nombre, orden y estado activo.
- `stock_items`: categoría obligatoria, marca opcional, nombre, unidad, cantidad actual decimal, mínimo de temporada baja, mínimo de temporada alta, orden, estado activo y fecha de última modificación.
- `stock_movements`: artículo, responsable, valor anterior, valor nuevo, diferencia, observación y fecha.
- `stock_high_season_dates`: fechas marcadas por el administrador como temporada alta. Toda fecha sin registro se considera temporada baja.

Cada actualización bloqueará el artículo, actualizará su cantidad actual e insertará el movimiento dentro de una misma transacción. De esta manera se evita perder cambios concurrentes y el historial queda como una auditoría inmutable.

Los artículos y categorías se desactivarán en lugar de eliminarse para preservar correctamente el historial.

## API y permisos

Crear Route Handlers bajo `src/app/api/stock/` para:

- Listar, crear y editar categorías y artículos.
- Consultar el stock actual.
- Actualizar la cantidad de un artículo y generar su movimiento.
- Listar el historial de movimientos.
- Consultar el detalle de cada modificación.
- Consultar los artículos cuyo stock actual sea menor o igual al mínimo aplicable.
- Administrar las fechas de temporada alta.

Reglas de acceso:

- Todos los roles autenticados (`admin`, `waiter` y `kitchen`) pueden consultar y modificar el stock.
- Solamente `admin` puede administrar el catálogo y consultar el historial completo.
- Las cantidades no pueden ser negativas.
- Los movimientos históricos no pueden editarse ni eliminarse.
- La actualización del stock y la creación del movimiento deben realizarse en una misma transacción.

## Experiencia de carga

Crear una pantalla móvil en `src/app/stock/page.tsx`, optimizada para recorrer muchas filas y corregir cantidades rápidamente:

- Diseño orientado primero a teléfonos, con controles grandes y jerarquía visual clara.
- Flujo evidente para usuarios no técnicos que pueden estar trabajando con apuro.
- Artículos agrupados por categoría.
- Marca y unidad visibles.
- Cantidad actual visible y campo numérico con soporte para cantidades fraccionarias.
- Apertura automática del teclado numérico adecuado en dispositivos móviles.
- Acción de guardado individual por artículo.
- Indicación clara de cambios pendientes, guardado en curso, éxito o error.
- Observación opcional para explicar un ajuste.
- Búsqueda rápida por marca o producto.
- Sin responsable ni fecha visibles: ambos datos se obtienen de la sesión y se reservan para el historial administrativo.

Cada guardado impactará inmediatamente en el stock y generará un registro histórico con la diferencia. No habrá un botón para finalizar toda la planilla.

La misma pantalla `/stock` será utilizada por empleados y administradores. Desde el módulo administrativo habrá un botón **Actualizar stock** que abrirá esta pantalla, evitando mantener dos experiencias diferentes para la misma tarea.

## Panel administrativo

El administrador continuará ingresando a `/admin` después del login. La navegación lateral mostrará temporalmente:

- **Dashboard**
- **Stock**, con un contador de artículos que estén en estado de stock bajo.

Las entradas de **Menú** y **Mesas** se ocultarán temporalmente de la navegación. Sus páginas, APIs y código se conservarán para retomarlos más adelante.

### Dashboard

El Dashboard dejará ocultos temporalmente los indicadores de pedidos y mesas. En su lugar mostrará un banner de estado de stock:

- Si existen faltantes: cantidad de artículos con stock bajo y acceso **Ver artículos**.
- Si no existen faltantes: estado positivo indicando que todo el stock está por encima del mínimo.

El banner abrirá `/admin/stock/alertas`.

### Pantalla principal de Stock

`/admin/stock` será el centro de gestión administrativa. Incluirá:

- Resumen de artículos activos, artículos con stock bajo y última actualización.
- Botón principal **Actualizar stock**, que abre `/stock`.
- Botón **Nuevo artículo**, que abre el formulario de creación.
- Buscador y filtros por categoría, marca y estado.
- Navegación interna por **Artículos**, **Alertas**, **Historial** y **Temporadas**.

La sección **Artículos**, seleccionada por defecto, mostrará tarjetas compactas con marca, nombre, categoría, stock actual, mínimos y estado. No permitirá editar todos los campos directamente en la lista.

La creación y edición completa de un artículo se realizará en un formulario enfocado: pantalla completa en móvil y diálogo o panel lateral en escritorio. Esta separación reduce errores accidentales y mantiene legible la lista administrativa. La edición de cantidades seguirá reservada a la carga rápida de `/stock`.

### Alertas e historial

- `/admin/stock/alertas` mostrará los artículos con stock bajo, incluyendo stock actual, mínimo aplicable, faltante, temporada activa y acceso rápido para actualizar stock.
- `/admin/stock/historial` listará movimientos por fecha, responsable y artículo.
- El detalle de un movimiento mostrará valor anterior, valor nuevo, diferencia y observación.

También se preparará un seed separado con los artículos legibles de las planillas. Los nombres o valores dudosos deberán revisarse antes de cargarlos.

## Stock mínimo y temporadas

Cada artículo podrá tener dos mínimos configurables por el administrador:

- Stock mínimo de temporada baja.
- Stock mínimo de temporada alta.

Cuando la cantidad actual sea menor o igual al mínimo aplicable, la aplicación deberá:

- Marcar claramente el artículo como stock bajo.
- Avisar al administrador cuando el artículo cruce el límite.
- Mantenerlo visible en una lista de alertas mientras continúe por debajo o igual al mínimo.
- Resolver la alerta cuando el stock vuelva a superar el mínimo.

La temporada aplicable se determinará automáticamente según la fecha local de La Cuadra:

- Todas las fechas serán de temporada baja por defecto.
- El administrador marcará en un calendario únicamente las fechas o rangos de temporada alta.
- No será necesario cambiar manualmente la temporada cada día.

Las alertas serán internas a la aplicación durante el MVP; no se implementarán notificaciones push:

- La opción **Stock** de la navegación mostrará un contador.
- El Dashboard mostrará el banner resumido.
- La pantalla de alertas mostrará el detalle completo.
- El estado se calculará a partir del stock actual, los mínimos y el calendario, sin una tabla adicional de notificaciones.
- Si el cambio de fecha activa un mínimo más alto, el artículo aparecerá como stock bajo aunque nadie haya modificado su cantidad ese día.

## Etapas de implementación

1. Consultar la documentación local de Next.js 16 aplicable a Route Handlers, sesiones y navegación.
2. Agregar el esquema idempotente y los tipos de stock.
3. Implementar las APIs del catálogo, actualización transaccional, mínimos, calendario, alertas e historial.
4. Construir la pantalla móvil de carga.
5. Adaptar el Dashboard y la navegación administrativa.
6. Agregar la gestión de artículos, alertas, historial y temporadas.
7. Preparar el seed revisable.
8. Verificar el flujo completo y el build de producción.

## Verificación

- Ejecutar la migración localmente y comprobar que sea idempotente.
- Probar permisos para `admin`, `waiter` y `kitchen`.
- Probar actualizaciones consecutivas y concurrentes del mismo artículo.
- Confirmar que cada cambio genere exactamente un movimiento inmutable con usuario y fecha.
- Verificar cantidades enteras y fraccionarias.
- Verificar el cálculo de diferencias y el rechazo de cantidades negativas.
- Verificar ambos mínimos, el cambio automático de temporada y el ciclo completo de las alertas.
- Probar estados vacíos y uso en dispositivos móviles.
- Ejecutar el build de producción.
- Confirmar que el menú QR y el flujo de pedidos existente continúen funcionando.
