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

2. Iniciar MySQL mediante Docker y configurar las variables de entorno utilizando `.env.example`.

3. Ejecutar los scripts SQL de la carpeta `db/` en orden:

   - `01_tablas.sql`
   - `02_usuarios.sql`
   - `03_datos.sql`

4. Instalar las dependencias del backend:

   ```bash
   pip install -r backend/requirements.txt
   ```

5. Iniciar el servidor Flask:

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
