# Carga masiva inicial de stock

Este documento conserva la carga única de la planilla física de stock: **76 artículos** distribuidos en cinco categorías.

## Antes de ejecutar

- Ejecutar únicamente en la base de producción desde phpMyAdmin.
- Exportar previamente las tablas `stock_movements`, `stock_items` y `stock_categories`.
- El SQL elimina todos los artículos, categorías y movimientos de stock existentes.
- Todos los artículos se crean con cantidad `0`, sin mínimos y sin último control.
- Al finalizar, los 76 artículos aparecerán en **Pendientes** hasta el primer conteo real.
- No volver a ejecutarlo después de comenzar a registrar cantidades, porque las borraría.

## SQL

```sql
SET NAMES utf8mb4;

-- 1. Limpieza. El orden respeta las claves foráneas: los movimientos apuntan a
-- los artículos y los artículos a las categorías.
DELETE FROM `stock_movements`;
DELETE FROM `stock_items`;
DELETE FROM `stock_categories`;

-- 2. Categorías
INSERT INTO `stock_categories` (`id`, `name`, `sort_order`) VALUES
  (1, 'Bebidas alcohólicas', 1),
  (2, 'Bebidas sin alcohol', 2),
  (3, 'Frutas y verduras', 3),
  (4, 'Almacén', 4),
  (5, 'Insumos', 5);

-- 3. Artículos
INSERT INTO `stock_items` (`category_id`, `brand`, `name`, `unit`, `current_quantity`, `sort_order`) VALUES
  -- Bebidas alcohólicas
  (1, 'Lunfa', 'Vermut Rosso', 'bottle', 0, 1),
  (1, 'Lunfa', 'Vermut Rosado', 'bottle', 0, 2),
  (1, 'La Fuerza', 'Vermut Blanco', 'bottle', 0, 3),
  (1, 'La Fuerza', 'Vermut Primavera', 'bottle', 0, 4),
  (1, 'La Fuerza', 'Vermut Rojo', 'bottle', 0, 5),
  (1, 'Il Nero', 'Vermut Rosso', 'bottle', 0, 6),
  (1, 'Ramazzotti', 'Vermut Rosado', 'bottle', 0, 7),
  (1, 'Martini', 'Vermut Rosso', 'bottle', 0, 8),
  (1, 'Beefeater', 'Gin London Dry', 'bottle', 0, 9),
  (1, 'Beefeater', 'Gin Pink', 'bottle', 0, 10),
  (1, 'Beefeater', 'Gin Blackberry', 'bottle', 0, 11),
  (1, 'Beefeater', 'Gin Orange', 'bottle', 0, 12),
  (1, 'Bombay', 'Gin', 'bottle', 0, 13),
  (1, 'Der Schwarzer', 'Gin London Dry', 'bottle', 0, 14),
  (1, 'Der Schwarzer', 'Gin London Dry Blue', 'bottle', 0, 15),
  (1, 'Absolut', 'Pears', 'bottle', 0, 16),
  (1, 'Absolut', 'Mandarin', 'bottle', 0, 17),
  (1, 'Absolut', 'Apeach', 'bottle', 0, 18),
  (1, 'Absolut', 'Raspberry', 'bottle', 0, 19),
  (1, 'Absolut', 'Mango', 'bottle', 0, 20),
  (1, 'Absolut', 'Wildberrie', 'bottle', 0, 21),
  (1, 'Smirnoff', 'Clásico', 'bottle', 0, 22),
  (1, 'Smirnoff', 'Manzana', 'bottle', 0, 23),
  (1, 'Smirnoff', 'Raspberry', 'bottle', 0, 24),
  (1, 'Wyborowa', 'Clásico', 'bottle', 0, 25),
  (1, 'Wyborowa', 'Raspberry', 'bottle', 0, 26),
  (1, 'Jack Daniel''s', 'Whisky', 'bottle', 0, 27),
  (1, 'Jameson', 'Whisky', 'bottle', 0, 28),
  (1, 'JW Black Label', 'Whisky', 'bottle', 0, 29),
  (1, 'Campari', 'Campari', 'bottle', 0, 30),
  (1, 'Varios', 'Ron blanco', 'bottle', 0, 31),
  (1, 'Varios', 'Ron dorado', 'bottle', 0, 32),
  (1, 'Malibú', 'Malibú', 'bottle', 0, 33),
  (1, 'Velho Barreiro', 'Cachaça', 'bottle', 0, 34),
  (1, 'Jägermeister', 'Jäger', 'bottle', 0, 35),
  (1, 'Branca', 'Fernet Branca', 'bottle', 0, 36),
  (1, 'Buhero', 'Fernet Buhero', 'bottle', 0, 37),
  (1, 'Gancia', 'Gancia', 'bottle', 0, 38),
  (1, 'Aperol', 'Aperol', 'bottle', 0, 39),
  (1, 'Amarula', 'Amarula', 'bottle', 0, 40),
  (1, 'Baileys', 'Baileys', 'bottle', 0, 41),
  (1, NULL, 'Alma Negra', 'bottle', 0, 42),
  (1, 'El Enemigo', 'Malbec', 'bottle', 0, 43),
  (1, 'Animal', 'Malbec orgánico', 'bottle', 0, 44),
  (1, 'D.V. Catena', 'Malbec', 'bottle', 0, 45),
  (1, 'Saint Felicien', 'Malbec', 'bottle', 0, 46),
  (1, 'Santa Julia', 'Chenin Dulce', 'bottle', 0, 47),
  (1, 'Santa Julia', 'Rosé lata', 'can', 0, 48),
  (1, 'Baron B', 'Champagne Brut Nature', 'bottle', 0, 49),
  (1, 'Nieto Senetiner', 'Champagne Brut Nature', 'bottle', 0, 50),
  (1, 'Mumm', 'Champagne Extra Brut', 'bottle', 0, 51),
  -- Frutas y verduras
  (3, NULL, 'Frutos rojos', 'kilogram', 0, 1),
  (3, NULL, 'Frutilla', 'kilogram', 0, 2),
  (3, NULL, 'Limón', 'kilogram', 0, 3),
  (3, NULL, 'Pomelo', 'kilogram', 0, 4),
  (3, NULL, 'Naranja', 'kilogram', 0, 5),
  (3, NULL, 'Lima', 'kilogram', 0, 6),
  (3, NULL, 'Jengibre', 'kilogram', 0, 7),
  (3, NULL, 'Menta', 'bundle', 0, 8),
  -- Almacén
  (4, NULL, 'Azúcar', 'kilogram', 0, 1),
  (4, NULL, 'Azúcar sobres', 'package', 0, 2),
  (4, NULL, 'Maní', 'package', 0, 3),
  (4, NULL, 'Edulcorante', 'package', 0, 4),
  -- Insumos
  (5, NULL, 'Lata frutilla', 'can', 0, 1),
  (5, NULL, 'Lata ananá', 'can', 0, 2),
  (5, NULL, 'Lata durazno', 'can', 0, 3),
  (5, NULL, 'Papel comandera', 'roll', 0, 4),
  (5, NULL, 'Guantes', 'box', 0, 5),
  (5, NULL, 'Sorbetes', 'package', 0, 6),
  (5, NULL, 'Fajinador', 'unit', 0, 7),
  (5, NULL, 'Servilletas', 'package', 0, 8),
  (5, NULL, 'Bolsas consorcio', 'package', 0, 9),
  (5, NULL, 'Hielo', 'bag', 0, 10),
  (5, NULL, 'Sobrecitos mayonesa', 'unit', 0, 11),
  (5, NULL, 'Sobrecitos ketchup', 'unit', 0, 12),
  (5, NULL, 'Sobrecitos mostaza', 'unit', 0, 13);
```
