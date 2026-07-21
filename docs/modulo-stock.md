# Módulo de stock para Pide

## Objetivo

Agregar un módulo independiente de inventario basado en actualización directa de existencias, conservando el código del menú QR y del flujo de pedidos para retomarlo más adelante.

La primera versión busca reemplazar las planillas de papel que usa actualmente La Cuadra, sin imponer un sistema de inventario más complejo que su proceso actual.

## Alcance del MVP

- Mantener un catálogo de stock separado de los productos del menú.
- Registrar artículos con categoría, marca, nombre, unidad y orden.
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
- `stock_items`: categoría, marca opcional, nombre, unidad, cantidad actual decimal, orden, estado activo y fecha de última modificación.
- `stock_movements`: artículo, responsable, valor anterior, valor nuevo, diferencia, observación y fecha.

Cada actualización bloqueará el artículo, actualizará su cantidad actual e insertará el movimiento dentro de una misma transacción. De esta manera se evita perder cambios concurrentes y el historial queda como una auditoría inmutable.

Los artículos y categorías se desactivarán en lugar de eliminarse para preservar correctamente el historial.

## API y permisos

Crear Route Handlers bajo `src/app/api/stock/` para:

- Listar, crear y editar categorías y artículos.
- Consultar el stock actual.
- Actualizar la cantidad de un artículo y generar su movimiento.
- Listar el historial de movimientos.
- Consultar el detalle de cada modificación.

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

El administrador ingresará directamente a Stock después del login. En `src/app/admin/layout.tsx` se agregará Stock como única opción visible y se comentarán temporalmente las entradas de Dashboard, Menú y Mesas. Sus páginas y APIs seguirán existiendo y podrán abrirse por URL, pero no aparecerán en la navegación.

## Administración e historial

Crear:

- `src/app/admin/stock/page.tsx` para crear y gestionar categorías y artículos, incluyendo marca opcional, unidad, cantidad inicial, orden y estado activo.
- `src/app/admin/stock/historial/page.tsx` para listar movimientos por fecha, responsable y artículo.
- Una vista de detalle con valor anterior, valor nuevo, diferencia y observación.

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

La temporada aplicable debe determinarse automáticamente; no se le exigirá al administrador cambiarla manualmente cada día.

### Decisión pendiente

Todavía debe definirse cómo se programan las temporadas sin volver compleja la administración. Las alternativas consideradas son:

1. Días semanales recurrentes, por ejemplo viernes y sábado como temporada alta.
2. Fechas o rangos específicos en un calendario.
3. Una regla semanal sencilla con excepciones para feriados, eventos o fines de semana particulares.

También queda por definir el canal de notificación inicial: aviso dentro de la aplicación, notificación del navegador u otro medio. Estas decisiones deben resolverse antes de cerrar el modelo de datos y desarrollar las alertas.

## Etapas de implementación

1. Consultar la documentación local de Next.js 16 aplicable a Route Handlers, sesiones y navegación.
2. Resolver el calendario de temporadas y el canal de notificación.
3. Agregar el esquema idempotente y los tipos de stock.
4. Implementar las APIs del catálogo, actualización transaccional, mínimos, alertas e historial.
5. Construir la pantalla móvil de carga.
6. Agregar la administración del catálogo y el historial comparativo.
7. Ajustar la navegación administrativa y preparar el seed revisable.
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
