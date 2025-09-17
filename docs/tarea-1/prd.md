# PRD

**Estado:** Aceptado
**Autor:** anntnzrb

---

## 1. Objetivo del Producto

Implementar un servidor backend utilizando Node.js que exponga una API RESTful para la gestión completa (CRUD) de la entidad **Evento**. El servicio debe seguir las especificaciones técnicas y de funcionalidad descritas en este documento, utilizando el stack tecnológico y la arquitectura definidos.

## 2. Entidad a Gestionar: Evento

La API gestionará recursos del tipo `Evento`. La estructura de datos será definida y validada utilizando un esquema de **Zod**.

- **`id`** (`string`): Identificador único del evento (validado como UUID).
- **`nombre`** (`string`): Un nombre descriptivo para el evento.
- **`descripcion`** (`string`, opcional): Una descripción más detallada.
- **`cantidad`** (`number`): El monto numérico asociado al evento.
- **`fecha`** (`Date`): La fecha en que ocurrió el evento.
- **`tipo`** (`string`): El tipo de evento. Debe ser uno de los valores: `"ingreso"` o `"egreso"`.
- **`adjunto`** (`string`, opcional): URL o referencia a un archivo adjunto (validado como URL).

## 3. Requisitos Funcionales

### 3.1. Operaciones CRUD para Eventos

La API debe implementar los siguientes endpoints para la gestión de eventos.

#### 1. Crear un nuevo Evento
- **Método:** `POST`
- **Endpoint:** `/api/v1/eventos`
- **Descripción:** Crea un nuevo recurso de tipo evento.
- **Request Body:** Un objeto JSON con los atributos del evento (sin `id`).
- **Respuesta Exitosa:**
  - **Código:** `201 Created`
  - **Body:** El objeto del evento recién creado.

#### 2. Listar todos los Eventos
- **Método:** `GET`
- **Endpoint:** `/api/v1/eventos`
- **Descripción:** Devuelve una lista de todos los eventos.
- **Respuesta Exitosa:**
  - **Código:** `200 OK`
  - **Body:** Un array de objetos de eventos.

#### 3. Obtener un Evento por ID
- **Método:** `GET`
- **Endpoint:** `/api/v1/eventos/:id`
- **Descripción:** Devuelve un evento específico identificado por su `id`.
- **Respuesta Exitosa:**
  - **Código:** `200 OK`
  - **Body:** El objeto del evento solicitado.

#### 4. Actualizar un Evento
- **Método:** `PUT`
- **Endpoint:** `/api/v1/eventos/:id`
- **Descripción:** Actualiza un evento existente.
- **Request Body:** Un objeto JSON con los datos actualizados del evento.
- **Respuesta Exitosa:**
  - **Código:** `200 OK`
  - **Body:** El objeto del evento actualizado.

#### 5. Eliminar un Evento
- **Método:** `DELETE`
- **Endpoint:** `/api/v1/eventos/:id`
- **Descripción:** Elimina un evento específico.
- **Respuesta Exitosa:**
  - **Código:** `200 OK` o `204 No Content`.

### 3.2. Filtrado y Paginación
- **Descripción:** El endpoint `GET /api/v1/eventos` debe soportar parámetros en la querystring para filtrar, paginar y ordenar los resultados (`page`, `limit`, `tipo`, `sortBy`, `sortOrder`).
- **Parámetros Soportados (Ejemplo):** `?page=1&limit=10&tipo=ingreso`.

### 3.3. Middleware de Logging
- **Descripción:** Se debe implementar un middleware propio que registre en consola cada petición entrante al servidor.
- **Información a registrar:** Método HTTP, URL, hora de la petición y el objeto `req.query`.

### 3.4. Endpoint de Salud del Servicio
- **Método:** `GET`
- **Endpoint:** `/health`
- **Descripción:** Proporciona un endpoint para verificar el estado y tiempo de actividad del servicio.
- **Respuesta Exitosa:**
  - **Código:** `200 OK`
  - **Body:** `{ "status": "ok", "uptime": "<tiempo_en_segundos>s" }`.

## 4. Requisitos No Funcionales

### 4.1. Configuración del Servidor
- El servidor Node.js debe ejecutarse y escuchar peticiones en el puerto **3030**.

### 4.2. Almacenamiento de Datos
- Los datos de los eventos se almacenarán en memoria (usando un array en el servidor) o en un archivo JSON para permitir la persistencia entre reinicios.

### 4.3. Manejo de Errores y Códigos de Estado HTTP
- La API debe utilizar los siguientes códigos de estado HTTP de forma estricta:
  - **`201 Created`**: Al crear un recurso.
  - **`200 OK`**: Para respuestas exitosas de `GET`, `PUT`, `DELETE`.
  - **`204 No Content`**: Alternativa para `DELETE` exitoso sin contenido de respuesta.
  - **`400 Bad Request`**: Cuando los datos enviados en la petición son inválidos (falla la validación de Zod).
  - **`404 Not Found`**: Cuando el recurso solicitado (ej. por `id`) no existe.
  - **`500 Internal Server Error`**: Para cualquier error inesperado no controlado en el servidor.
- Se debe implementar un middleware centralizado (`errorHandler`) para gestionar todos los errores de la aplicación.

### 4.4. Validación y Tipado de Datos con Zod
- Se debe utilizar la librería **Zod** para definir esquemas y validar todos los datos de entrada en las rutas `POST` y `PUT`. Esto garantiza que los datos que ingresan a la lógica de negocio se ajusten a la estructura definida en la entidad `Evento`.
- Los esquemas de Zod deben definir los tipos de datos (`z.string()`, `z.number()`, `z.date()`), validaciones (`.uuid()`, `.min(1)`) y tipos enumerados (`z.enum(['ingreso', 'egreso'])`).

## 5. Stack Tecnológico

El desarrollo del proyecto debe adherirse estrictamente al siguiente conjunto de tecnologías. No se deben agregar dependencias adicionales a menos que sea indispensable y justificado.

- **Runtime y Gestor de Paquetes:**
  - **Node.js:** Entorno de ejecución de JavaScript del lado del servidor.
  - **npm:** Gestor de paquetes para la instalación y manejo de dependencias.
- **Lenguaje de Programación:**
  - **TypeScript:** El proyecto debe estar escrito 100% en TypeScript. No se permite el uso de archivos JavaScript (`.js`).
- **Framework y Librerías Principales:**
  - **Express:** Framework web para la construcción de la API REST.
  - **Zod:** Librería para la declaración de esquemas, validación y seguridad de tipos de los datos.
- **Herramientas de Calidad de Código:**
  - **ESLint:** Herramienta para el análisis estático de código (linting).
  - **Prettier:** Formateador de código para mantener un estilo consistente.

## 6. Arquitectura del Software

Para garantizar la separación de responsabilidades, la mantenibilidad y la escalabilidad, el proyecto implementará una **Arquitectura en Capas**.

### 6.1. Descripción de las Capas

1.  **Capa de Rutas/Controladores (Routes/Controllers):** Responsable de manejar las peticiones y respuestas HTTP. Define los endpoints, extrae datos de la petición y delega la lógica a la capa de servicio.
2.  **Capa de Servicios (Services):** Contiene la lógica de negocio de la aplicación. Orquesta las operaciones y se comunica con la capa de repositorio.
3.  **Capa de Repositorio (Repository):** Abstrae el acceso a los datos. Es la única capa que interactúa directamente con la fuente de datos (array en memoria o archivo JSON).

### 6.2. Estructura de Directorios

La organización del código fuente seguirá la siguiente estructura:

```
src/
├── app.ts                # Configuración principal de Express (middlewares, etc.)
├── index.ts              # Punto de entrada, inicia el servidor
|
├── api/
│   └── events/
│       ├── event.controller.ts # Lógica del controlador para eventos
│       ├── event.routes.ts     # Definición de rutas (/api/v1/eventos)
│       ├── event.repository.ts # Lógica de acceso a datos (array/JSON)
│       ├── event.service.ts    # Lógica de negocio para eventos
│       └── event.schema.ts     # Esquemas de Zod para validación de eventos
|
└── core/
    └── middleware/
        ├── errorHandler.ts     # Middleware de manejo de errores
        └── logger.ts           # Middleware de logging de peticiones
```

## 7. Criterios de Aceptación (Checklist)

- [ ] El servidor corre en `http://localhost:3030`.
- [ ] El CRUD completo para la entidad `Evento` está implementado y es funcional.
- [ ] Todos los endpoints responden con los códigos HTTP correctos según la especificación.
- [ ] El middleware de logging propio está funcionando y registra la información requerida.
- [ ] Los parámetros de `/:id` y querystring (paginación/filtrado) están implementados.
- [ ] La validación de datos de entrada se realiza utilizando esquemas de Zod.
- [ ] Existe un manejador de errores centralizado (middleware).
- [ ] El endpoint de salud `GET /health` responde correctamente e incluye el estado de la base de datos.
- [ ] El proyecto está escrito 100% en TypeScript y utiliza el stack tecnológico definido. No se utiliza en absoluto Javascript crudo.
- [ ] La estructura del proyecto sigue la Arquitectura en Capas y la organización de directorios especificada.
