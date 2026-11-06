# Obligatorio Base de Datos I

## Sistema de Gestión del Torneo Interfacultades de Fútbol 5

Proyecto desarrollado para la materia **Base de Datos I** de la Universidad Católica del Uruguay, segundo semestre de 2026.

El sistema permite gestionar la información de torneos universitarios de fútbol 5, incluyendo equipos, jugadores, partidos, resultados y sanciones.

## Tecnologías utilizadas

- **Base de datos:** MySQL, versión 8.4.
- **Backend:** Python y Flask (API REST que responde en JSON).
- **Conexión a BD:** mysql-connector-python.
- **Frontend:** React con Vite.

Las reglas de negocio y los reportes están en el backend (Python), no en la base: no se usan triggers ni vistas.

## Estructura del proyecto

```text
ObligatorioBD1/
├── backend/
│   ├── app.py          # rutas de la API y validaciones
│   ├── db.py           # conexión a MySQL según el rol
│   └── consultas/      # consultas SQL separadas por tema
├── db/                 # scripts SQL: tablas, usuarios, datos de prueba y reportes
├── frontend/
│   └── src/
│       ├── paginas/        # una pantalla por archivo
│       └── componentes/    # menú, encabezado y piezas comunes
├── docs/               # informe y letra del obligatorio
└── README.md
```

## Roles y usuarios de MySQL

El sistema tiene dos roles. El backend se conecta a MySQL con un usuario distinto según el rol de quien inició sesión, así que los permisos también los controla la base (ver `db/02_usuarios.sql`):

| Rol | Puede | Usuario de MySQL |
|---|---|---|
| Administrador | Gestionar todo: torneos, jugadores, equipos, canchas, partidos, sanciones y usuarios | `torneo_admin` |
| Planillero | Consultar datos y cargar planillas, goles y tarjetas; marcar un partido como jugado | `torneo_planillero` |

Para validar el login se usa un tercer usuario, `torneo_auth`, que solo puede leer la tabla `login`.

## Requisitos

- MySQL 8.4
- Python 3.10 o superior
- Node.js 18 o superior

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/agusmont616/ObligatorioBD1.git
   cd ObligatorioBD1
   ```

2. Ejecutar los scripts de la carpeta `db/` en este orden:

   ```bash
   mysql -u root -p < db/01_tablas.sql
   mysql -u root -p < db/02_usuarios.sql
   mysql -u root -p < db/03_datos.sql
   ```

   `01_tablas.sql` borra y vuelve a crear la base `torneo`, así que sirve también para empezar de cero.

   El archivo `04_reportes.sql` tiene las consultas de los reportes. No hace falta ejecutarlo para instalar el sistema: sirve para probarlas directamente en MySQL.

3. Copiar `.env.example` como `.env` y completar las contraseñas. Tienen que coincidir con las definidas en `db/02_usuarios.sql`.

4. Instalar las dependencias del backend. Usar un entorno virtual es opcional:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r backend/requirements.txt
   ```

5. Instalar las dependencias del frontend:

   ```bash
   cd frontend
   npm install
   ```

## Ejecución

Se necesitan dos terminales, las dos abiertas desde la raíz del repositorio.

**Terminal 1: backend** (queda en `http://localhost:5000`)

```bash
cd backend
python -m flask --app app run --debug
```

**Terminal 2: frontend** (queda en `http://localhost:5173`)

```bash
cd frontend
npm run dev
```

Abrir **http://localhost:5173** en el navegador. El frontend manda las llamadas a `/api/...` y Vite las redirige al backend, así que no hace falta configurar CORS.

### Usuarios de prueba

Están cargados en `db/03_datos.sql`:

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@ucu.edu.uy` | `admin123` | Administrador |
| `planillero1@ucu.edu.uy` | `planilla123` | Planillero |
| `planillero2@ucu.edu.uy` | `planilla123` | Planillero |

## Documentación

El informe técnico y la letra del obligatorio están en la carpeta `docs/`.

## Integrantes

- Ignacio Zeballos
- Mauricio Suarez
- Agustin Montaña
