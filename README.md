# Obligatorio Base de Datos I

## Sistema de Gestión del Torneo Interfacultades de Fútbol 5

Proyecto desarrollado para la materia **Base de Datos I** de la Universidad Católica del Uruguay, segundo semestre de 2026.

El sistema permite gestionar la información de torneos universitarios de fútbol 5, incluyendo equipos, jugadores, partidos, resultados y sanciones.

## Tecnologías utilizadas

- **Backend:** Python y Flask.
- **Base de datos:** MySQL, versión 8.4.
- **Conexión a BD:** mysql-connector-python.
- **Entorno:** Docker.
- **Frontend:** Interfaz de usuario para la visualización y gestión del torneo.

## Estructura del proyecto

```text
ObligatorioBD1/
├── backend/    
├── db/         
├── frontend/   
├── docs/      
└── README.md
```

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/agusmont616/ObligatorioBD1.git
   cd ObligatorioBD1
   ```

2. Iniciar la base de datos con Docker:

   ```bash
   docker compose up -d
   ```

3. Crear el archivo `.env` a partir de `.env.example` y configurar las credenciales de MySQL.

4. Ejecutar los scripts de la carpeta `db/` en el siguiente orden:

   - `01_tablas.sql`
   - `02_usuarios.sql`
   - `03_datos.sql`

   Desde la terminal:

   ```bash
   mysql -u root -p < db/01_tablas.sql
   mysql -u root -p < db/02_usuarios.sql
   mysql -u root -p < db/03_datos.sql
   ```

   El archivo `04_reportes.sql` tiene las consultas de los reportes. No hace falta ejecutarlo para instalar el sistema, sirve para probarlas directamente en MySQL.

5. Crear y activar un entorno virtual de Python (Windows):

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

6. Instalar las dependencias:

   ```bash
   pip install -r backend/requirements.txt
   ```

7. Iniciar el backend:

   ```bash
   cd backend
   python -m flask --app app run --debug
   ```

## Documentación

El informe técnico y la documentación adicional del proyecto se encuentran en la carpeta `docs/`.

## Integrantes

- Ignacio Zeballos
- Mauricio Suarez
- Agustin Montaña
