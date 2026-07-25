# Módulo de stock para Pide

## Objetivo

Agregar un módulo independiente de inventario basado en actualización directa de existencias, conservando el código del menú QR y del flujo de pedidos para retomarlo más adelante.

La primera versión busca reemplazar las planillas de papel que usa actualmente La Cuadra, sin imponer un sistema de inventario más complejo que su proceso actual.

## Alcance del MVP

- Mantener un catálogo de stock separado de los productos del menú.
- Registrar artículos con categoría obligatoria, marca opcional, nombre, unidad, orden y mínimos de temporada opcionales.
- Permitir que administradores y usuarios de carga de stock consulten y modifiquen directamente la cantidad actual.
- Aplicar cada cambio al guardarlo, sin borradores ni cierre de planilla.
- Registrar automáticamente el responsable, fecha, valor anterior, valor nuevo y diferencia.
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
- `stock_items`: categoría obligatoria, marca opcional, nombre, unidad, cantidad actual decimal, mínimos opcionales de temporada baja y alta, orden, estado activo y fecha de última modificación.
- `stock_movements`: artículo, tipo de movimiento (`initial` o `adjustment`), responsable, valor anterior nullable, valor nuevo, diferencia y fecha.
- `stock_high_season_dates`: una fila por fecha (`DATE` único) marcada como temporada alta. Toda fecha sin registro se considera temporada baja. Un rango seleccionado en la interfaz se persistirá como filas individuales.
- Ampliar el `ENUM` de `role` en la tabla `users` para incluir `stock`. Esta migración es requisito para que el usuario de carga de stock pueda crearse.

Cada actualización de cantidad bloqueará la fila del artículo (`SELECT ... FOR UPDATE`), actualizará su cantidad actual e insertará el movimiento dentro de una misma transacción. De esta manera se evita perder cambios concurrentes y el historial queda como una auditoría inmutable.

Al crear un artículo se guardará su cantidad y se generará un movimiento especial `initial`. Este movimiento tendrá valor anterior nulo y permitirá distinguir la carga inicial de un ajuste posterior.

Editar los mínimos, la marca u otros metadatos de un artículo no generará movimientos: el historial registra únicamente cambios de cantidad.

La unidad se elegirá de un catálogo cerrado definido por la API. Cada opción tendrá un código estable, un nombre y una abreviatura (por ejemplo Botella / `bot.`, Kilogramo / `kg`, Litro / `L`). La creación y edición de artículos utilizará un selector; la API rechazará valores que no pertenezcan al enum.

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

- El rol `stock` tendrá acceso exclusivo a la pantalla de carga rápida `/stock`.
- El rol `admin` podrá acceder a `/stock` y a todas las funciones administrativas.
- Solamente `admin` puede administrar el catálogo y consultar el historial completo.
- Los roles y pantallas anteriores de mozo y cocina se conservarán en el código, pero quedarán fuera del alcance activo y de la landing.
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
- Búsqueda rápida por marca o producto.
- Modo búsqueda en móviles: al enfocar el buscador se ocultan cabecera, filtros y contadores, dejando solo el campo con un botón de cruz para salir y la lista de resultados, para que el teclado no tape el contenido. El mismo comportamiento se aplica en Artículos y Alertas del panel, donde también se oculta la barra superior con el menú y el logo.
- Sin responsable ni fecha visibles: ambos datos se obtienen de la sesión y se reservan para el historial administrativo.

Cada guardado impactará inmediatamente en el stock y generará un registro histórico con la diferencia. No habrá un botón para finalizar toda la planilla.

La misma pantalla `/stock` será utilizada por empleados y administradores. Desde el módulo administrativo habrá un botón **Actualizar stock** que abrirá esta pantalla, evitando mantener dos experiencias diferentes para la misma tarea.

## Panel administrativo

El administrador continuará ingresando a `/admin` después del login. La navegación lateral mostrará temporalmente:

- **Dashboard**
- **Stock**, con un contador de artículos que estén en estado de stock bajo.

Las entradas de **Menú** y **Mesas** se ocultarán temporalmente de la navegación. Sus páginas, APIs y código se conservarán para retomarlos más adelante.

## Landing y acceso

La landing `src/app/page.tsx` se adaptará al nuevo alcance sin perder la personalización para La Cuadra:

- Presentará Pide como una solución simple para reemplazar las planillas manuales de stock.
- Explicará la carga móvil, el historial de cambios, los mínimos por temporada y las alertas.
- Reemplazará el ejemplo visual de pedidos por una representación de la pantalla de actualización de stock.
- Eliminará los accesos visibles a cliente QR, cocina y mozo.
- Mostrará un único acceso general para ingresar a la aplicación.

La landing abrirá `/login` sin anticipar ni solicitar un rol. La pantalla de login mostrará únicamente el formulario de credenciales, sin subtítulos específicos para administradores o encargados de stock.

Las tarjetas informativas del final podrán explicar las funciones de **Panel administrador** y **Carga de stock**, pero ambos enlaces abrirán el mismo `/login`. No habrá ingreso automático ni credenciales expuestas en la landing. El destino final siempre se decidirá por el rol real del usuario autenticado: `admin` irá a `/admin` y `stock` a `/stock`.

Para soportar este flujo se agregará el rol `stock` al esquema de usuarios, los tipos de sesión (`src/lib/session.ts`) y el mapa de redirección de `src/app/login/page.tsx`. El middleware (`middleware.ts`) protegerá `/stock` permitiendo los roles `stock` y `admin`, y su `matcher` incluirá la ruta `/stock`. El usuario inicial de carga de stock se creará mediante el script de usuarios.

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

La sección **Artículos**, seleccionada por defecto, mostrará tarjetas compactas con marca, nombre, categoría, stock actual, mínimos y periodicidad de control. Las señales de stock bajo se reservan para **Alertas** y no se duplican en esta pantalla de gestión. No permitirá editar todos los campos directamente en la lista.

La creación y edición completa de un artículo se realizará en un formulario enfocado: pantalla completa en móvil y diálogo o panel lateral en escritorio. Esta separación reduce errores accidentales y mantiene legible la lista administrativa. La edición de cantidades seguirá reservada a la carga rápida de `/stock`.

### Alertas e historial

- `/admin/stock/alertas` mostrará los artículos con stock bajo, incluyendo stock actual, mínimo aplicable, faltante, temporada activa y acceso rápido para actualizar stock.
- `/admin/stock/historial` listará movimientos por fecha, responsable y artículo.
- El detalle de un movimiento mostrará valor anterior, valor nuevo y diferencia.

También se preparará un seed separado con los artículos legibles de las planillas. Los nombres o valores dudosos deberán revisarse antes de cargarlos.

## Stock mínimo y temporadas

Cada artículo podrá tener dos mínimos configurables por el administrador:

- Stock mínimo de temporada baja.
- Stock mínimo de temporada alta.

Ambos valores serán opcionales. Un artículo solo generará alertas durante una temporada si tiene configurado el mínimo correspondiente.

Cada artículo tendrá además un factor de reposición, con valor por defecto `2`, que define hasta dónde conviene reponer expresado como múltiplo del mínimo vigente. Al calcularse sobre el mínimo aplicable, el objetivo acompaña automáticamente el cambio de temporada sin exigir cargar dos valores adicionales por artículo.

La pantalla de alertas mostrará la compra sugerida, es decir la diferencia entre ese objetivo y la cantidad actual, en lugar del faltante hasta el mínimo. La distinción es importante: reponer solo hasta el mínimo deja el artículo en el límite y la alerta vuelve a dispararse de inmediato, porque la condición es menor o igual. Las unidades de peso, volumen y longitud conservan decimales; las que se cuentan por piezas se redondean hacia arriba, ya que no se puede comprar media botella.

Cuando la cantidad actual sea menor o igual al mínimo aplicable, la aplicación deberá:

- Marcar claramente el artículo como stock bajo.
- Avisar al administrador cuando el artículo cruce el límite.
- Mantenerlo visible en una lista de alertas mientras continúe por debajo o igual al mínimo.
- Resolver la alerta cuando el stock vuelva a superar el mínimo.

La temporada aplicable se determinará automáticamente según la fecha local de La Cuadra, usando la zona horaria `America/Argentina/Buenos_Aires` para evitar desfases al calcular el día vigente:

- Todas las fechas serán de temporada baja por defecto.
- El administrador marcará en un calendario únicamente las fechas o rangos de temporada alta.
- No será necesario cambiar manualmente la temporada cada día.

Las alertas serán internas a la aplicación durante el MVP; no se implementarán notificaciones push:

- La opción **Stock** de la navegación mostrará un contador.
- El Dashboard mostrará el banner resumido.
- La pantalla de alertas mostrará el detalle completo.
- El estado se calculará a partir del stock actual, los mínimos y el calendario, sin una tabla adicional de notificaciones.
- Si el cambio de fecha activa un mínimo más alto, el artículo aparecerá como stock bajo aunque nadie haya modificado su cantidad ese día.

## Control periódico

El stock se controla de forma periódica, artículo por artículo. La primera versión del módulo no permite saber cuándo se controló cada artículo por última vez y, en consecuencia, cuáles quedan pendientes de recorrer.

El problema central es que guardar una cantidad y controlar un artículo no son la misma acción. Cuando el conteo físico coincide con la cantidad registrada, hoy no se guarda nada: la API responde sin cambios y la pantalla mantiene el botón deshabilitado. Ese caso, que es frecuente, deja al artículo indistinguible de uno que nadie miró.

La solución consiste en registrar el control como un hecho propio y en definir cada cuánto debe repetirse.

### Modelo de datos

Se agregarán tres columnas a `stock_items` mediante migraciones idempotentes en `scripts/migrate.ts`, manteniendo alineado `scripts/migrate.sql`:

- `control_interval_days`: entero positivo con valor por defecto `1`. El valor nulo significa que el artículo no requiere control periódico.
- `last_controlled_at`: fecha y hora del último control, nula mientras el artículo nunca haya sido controlado.
- `last_controlled_by`: responsable del último control, con clave foránea nullable hacia `users`.

No se creará una tabla nueva. `stock_movements` seguirá registrando exclusivamente los cambios de cantidad, por lo que las confirmaciones que no modifican el stock no dejarán historial: de ellas solo se conservará la última. Se acepta esa limitación a cambio de mantener el modelo simple.

Durante la migración se completarán `last_controlled_at` y `last_controlled_by` con el movimiento más reciente de cada artículo, para que el estado inicial refleje el trabajo ya realizado en lugar de marcar todo el catálogo como pendiente.

### Cálculo del estado

El vencimiento se calculará por día calendario y no por horas transcurridas, usando la zona horaria `America/Argentina/Buenos_Aires` y el helper `getStockLocalDate` ya existente. Un intervalo diario significa entonces que cada jornada comienza con todo el catálogo pendiente, sin depender del horario exacto del control anterior.

- Un artículo sin intervalo configurado nunca estará pendiente.
- Un artículo sin fecha de control estará pendiente.
- En los demás casos estará pendiente cuando los días transcurridos desde el último control alcancen o superen su intervalo.

La antigüedad se expondrá junto al estado para poder distinguir un artículo recién vencido de uno olvidado hace una semana. No se definirá un tercer estado: un control muy atrasado seguirá siendo un pendiente, mostrado con sus días de demora.

### API y permisos

`PATCH /api/stock/items/:id/quantity` pasará a representar la confirmación de un control. Dentro de la misma transacción actualizará siempre `last_controlled_at` y `last_controlled_by` con la sesión activa, y actualizará la cantidad e insertará el movimiento únicamente cuando el valor haya cambiado. Se eliminará la salida anticipada que hoy revierte la transacción ante una cantidad igual, aunque la respuesta seguirá indicando que la cantidad no cambió.

`GET /api/stock/items` devolverá por artículo el intervalo, la fecha del último control, el nombre del responsable, el estado calculado y los días transcurridos.

`PUT /api/stock/items/:id` aceptará `control_interval_days`, admitiendo un entero mayor o igual a uno o el valor nulo. Cambiar el intervalo no modificará la fecha del último control: el próximo vencimiento se recalculará a partir del control ya registrado.

La creación de un artículo registrará su carga inicial como primer control, en coherencia con el movimiento `initial` que ya genera.

Los permisos no cambian. Los roles `stock` y `admin` confirman controles; solo `admin` configura el intervalo.

### Experiencia de carga

La pantalla `/stock` sumará una fila de filtros de estado ubicada debajo del buscador y encima de las categorías, con **Pendientes**, **Todos** y **Controlados**, cada uno con su contador. La pantalla abrirá en **Pendientes**, de modo que lo primero que vea el operario sea lo que falta recorrer. El filtro de estado se combinará con el de categoría, pero una búsqueda por texto ignorará el estado para que un artículo ya controlado siga siendo localizable.

El botón principal pasará a llamarse **Confirmar** y estará siempre habilitado, salvo mientras haya un guardado en curso o la cantidad ingresada sea inválida. Como el campo se vacía al enfocarlo, un campo vacío se interpretará como la confirmación de la cantidad actual, que es el caso más habitual.

Cada tarjeta indicará el resultado mediante un icono compacto ubicado en la misma fila que la unidad: check verde para controlado, cruz roja para pendiente y guion gris para un artículo sin control periódico. El aviso de stock bajo, cuando corresponda, se mostrará debajo de ambos. Al tocar o enfocar el icono se mostrará un tooltip con la fecha, el responsable y la antigüedad del control. La cabecera usará un layout sin elementos superpuestos para conservar legibles tanto el nombre como los indicadores y reducir la altura de las tarjetas sin marca.

Al confirmar, el artículo permanecerá visible con su estado actualizado aunque el filtro activo sea **Pendientes**. La lista se depurará recién al recargar la pantalla, evitando que las tarjetas desaparezcan bajo el dedo del operario. Cuando no queden pendientes se mostrará un estado vacío que confirme que el control está al día.

El diálogo de confirmación por cambios inusuales se mantiene sin modificaciones.

### Panel administrativo

El panel conserva su rol de gestión del catálogo, por lo que la única incorporación será el campo **Frecuencia de control** en el formulario de alta y edición, con opciones directas para control diario, cada dos días, semanal, un valor personalizado en días y la alternativa sin control periódico. El valor por defecto será diario.

Las tarjetas de `/admin/stock` no mostrarán información de control. Un administrador que quiera supervisar el trabajo ingresará a `/stock` y filtrará por **Controlados**, donde ya verá la fecha y el responsable de cada artículo.

### Fuera de alcance

- Rondas o sesiones de control con apertura, progreso y cierre formal.
- Historial completo de confirmaciones que no modifican la cantidad.
- Asignación de artículos por responsable y notificaciones de control vencido.

### Etapas

1. Agregar las columnas, el relleno inicial y los tipos.
2. Adaptar la actualización de cantidad para registrar el control y exponer el estado en el listado.
3. Sumar la frecuencia de control al formulario administrativo.
4. Incorporar el filtro de estado, el indicador con detalle de último control y el botón de confirmación en `/stock`.

## Etapas de implementación

1. Consultar la documentación local de Next.js 16 aplicable a Route Handlers, sesiones y navegación.
2. Agregar el esquema idempotente y los tipos de stock.
3. Implementar las APIs del catálogo, actualización transaccional, mínimos, calendario, alertas e historial.
4. Construir la pantalla móvil de carga.
5. Adaptar la landing, el login contextual y el rol `stock`.
6. Adaptar el Dashboard y la navegación administrativa.
7. Agregar la gestión de artículos, alertas, historial y temporadas.
8. Preparar el seed revisable.
9. Verificar el flujo completo y el build de producción.

## Verificación

- Ejecutar la migración localmente y comprobar que sea idempotente.
- Probar que `stock` solo acceda a `/stock` y que `admin` acceda tanto a `/stock` como al panel.
- Verificar ambos accesos contextuales de la landing y sus redireccionamientos.
- Probar actualizaciones consecutivas y concurrentes del mismo artículo.
- Confirmar que cada cambio genere exactamente un movimiento inmutable con usuario y fecha.
- Verificar cantidades enteras y fraccionarias.
- Verificar el cálculo de diferencias y el rechazo de cantidades negativas.
- Verificar ambos mínimos, el cambio automático de temporada y el ciclo completo de las alertas.
- Probar estados vacíos y uso en dispositivos móviles.
- Confirmar que una cantidad idéntica registre el control sin generar un movimiento.
- Verificar que el estado pendiente cambie al pasar la medianoche local y no a las veinticuatro horas del último control.
- Probar intervalos mayores a un día, artículos sin control periódico y artículos nunca controlados.
- Verificar el relleno inicial de la fecha de control tras ejecutar la migración sobre datos existentes.
- Ejecutar el build de producción.
- Confirmar que el menú QR y el flujo de pedidos existente continúen funcionando.
