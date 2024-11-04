
# API Documentation

## 1. Crear URL Corta
- **URL**: `/shorten`
- **Método**: `POST`
- **Descripción**: Crea una URL corta a partir de una URL original.
- **Cuerpo de la Solicitud**:
```json
{
  "originalUrl": "https://example.com"
}
```
- **Respuesta**:
```json
{
  "shortUrl": "http://localhost:3000/abc123",
  "id": "abc123"
}
```

## 2. Redirigir a URL Original
- **URL**: `/:id`
- **Método**: `GET`
- **Descripción**: Redirige al usuario a la URL original usando el ID.
- **Parámetro**:
  - `id`: ID de la URL corta
- **Respuesta**: Redirección a la URL original.

## 3. Actualizar Estado de la URL (Habilitar/Deshabilitar)
- **URL**: `/url/:id/status`
- **Método**: `PATCH`
- **Descripción**: Habilita o deshabilita una URL.
- **Parámetro**:
  - `id`: ID de la URL corta
- **Cuerpo de la Solicitud**:
```json
{
  "enabled": true
}
```
- **Respuesta**:
```json
{
  "message": "URL habilitada correctamente."
}
```

## 4. Modificar la URL de Destino
- **URL**: `/url/:id`
- **Método**: `PATCH`
- **Descripción**: Cambia la URL de destino original.
- **Parámetro**:
  - `id`: ID de la URL corta
- **Cuerpo de la Solicitud**:
```json
{
  "originalUrl": "https://new-example.com"
}
```
- **Respuesta**:
```json
{
  "message": "URL actualizada correctamente."
}
```

## 5. Obtener Estadísticas de la URL
- **URL**: `/url/:id/stats`
- **Método**: `GET`
- **Descripción**: Muestra estadísticas de la URL (cantidad de accesos).
- **Parámetro**:
  - `id`: ID de la URL corta
- **Respuesta**:
```json
{
  "id": "abc123",
  "originalUrl": "https://example.com",
  "shortUrl": "http://localhost:3000/abc123",
  "enabled": true,
  "hits": 100
}
```
