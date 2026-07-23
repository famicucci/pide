# Gestión de usuarios

La pantalla `/admin/usuarios` es el medio principal para administrar accesos. También existe una API para soporte técnico o automatizaciones.

## Permisos y reglas

- Solamente un usuario activo con rol `admin` puede utilizar la pantalla y los endpoints.
- En esta etapa se pueden gestionar los roles `admin` y `stock`.
- Los usuarios no se eliminan: se desactivan para conservar correctamente el historial.
- No es posible desactivar ni cambiar el rol del último administrador activo.
- Un administrador no puede desactivar ni quitar el rol de su propia cuenta.
- Las contraseñas deben tener entre 8 y 72 caracteres, al menos una letra y un número.
- Las contraseñas se almacenan con bcrypt y nunca se incluyen en las respuestas.

## Uso desde la interfaz

1. Ingresar como administrador.
2. Abrir **Usuarios** en la navegación.
3. Seleccionar **Nuevo usuario**.
4. Completar nombre, email, rol y contraseña inicial.
5. Comunicar las credenciales a la persona por un canal privado.

Desde la misma pantalla se puede editar el usuario, activarlo o desactivarlo y definir una contraseña nueva.

## Uso de la API

Primero hay que iniciar sesión como administrador y guardar la cookie:

```bash
curl -c cookies.txt \
  -X POST https://tu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"administrador@ejemplo.com","password":"CONTRASEÑA"}'
```

### Listar usuarios

```bash
curl -b cookies.txt https://tu-dominio.com/api/admin/users
```

### Crear un usuario

```bash
curl -b cookies.txt \
  -X POST https://tu-dominio.com/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Responsable de stock",
    "email": "stock@ejemplo.com",
    "password": "ClaveSegura123",
    "role": "stock"
  }'
```

### Editar datos o permisos

```bash
curl -b cookies.txt \
  -X PATCH https://tu-dominio.com/api/admin/users/2 \
  -H "Content-Type: application/json" \
  -d '{"name":"Nuevo nombre","role":"admin"}'
```

### Desactivar un usuario

```bash
curl -b cookies.txt \
  -X PATCH https://tu-dominio.com/api/admin/users/2 \
  -H "Content-Type: application/json" \
  -d '{"active":false}'
```

### Restablecer una contraseña

```bash
curl -b cookies.txt \
  -X PATCH https://tu-dominio.com/api/admin/users/2 \
  -H "Content-Type: application/json" \
  -d '{"password":"OtraClaveSegura456"}'
```

El archivo `cookies.txt` contiene una sesión temporal y no debe incorporarse al repositorio.
