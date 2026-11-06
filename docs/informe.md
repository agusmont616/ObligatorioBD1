### Informe Obligatorio Base de Datos I

Integrantes: Agustín Montaña, Ignacio Zeballos, Mauricio Suarez


### 1. Decisiones de implementación

#### Cómo está armado el sistema

El sistema tiene tres partes: el frontend, el backend y la base de datos.

El frontend le hace los pedidos al backend, que está en app.py. Ahí están las rutas de la API y en cada ruta se marca qué roles la pueden usar. Si el usuario no inició sesión o no tiene ese rol, el pedido se rechaza. app.py también revisa que los datos que llegan estén bien, por ejemplo el email o el tipo de jugador, antes de mandarlos a la base.

Las consultas SQL están en la carpeta consultas, con un archivo por tema. Cada función recibe el rol del usuario que inició sesión y se conecta a MySQL con db.py, que usa el usuario de MySQL que corresponde a ese rol.

Para el login, la ruta /login busca el correo en la tabla login con el usuario torneo_auth, compara el hash de la contraseña y guarda el correo y el rol en la sesión.

Así el acceso se controla dos veces, una en el backend con los roles de cada ruta y otra en la base con los permisos de cada usuario de MySQL.

#### Tecnologías

El backend está hecho en Python con Flask, la base de datos es MySQL y para conectarnos usamos mysql-connector-python. No usamos ORM, todas las consultas están escritas a mano en la carpeta backend/consultas, separadas por tema (canchas, equipos, jugadores, partidos, sanciones, torneos y usuarios). Los datos siempre se pasan como parámetros y nunca se pegan dentro del texto de la consulta, para evitar la inyección SQL.

Para hacer el frontend usamos herramientas de inteligencia artificial como apoyo.

#### Scripts de la base

La base se crea con los scripts de la carpeta db, que se ejecutan en este orden:

- 01_tablas.sql: crea la base y las 14 tablas.
- 02_usuarios.sql: crea los usuarios de MySQL y les da los permisos.
- 03_datos.sql: carga los datos de prueba.
- 04_reportes.sql: tiene las consultas de los reportes.

En 01_tablas.sql las tablas están en orden. Primero van las que no tienen claves foráneas (facultad, login, turno, complejo y torneo) y después las que apuntan a ellas, porque una clave foránea no se puede crear si la tabla a la que apunta todavía no existe.

Tenerlos separados nos sirvió para trabajar los tres al mismo tiempo y, si algo falla, saber en qué archivo buscar.

#### Usuarios y permisos

Hicimos tres usuarios de MySQL:

- torneo_auth: solo puede hacer SELECT sobre la tabla login. Se usa para el login, cuando todavía no sabemos el rol del usuario.
- torneo_admin: puede hacer SELECT, INSERT, UPDATE y DELETE en todas las tablas. Lo usan los administradores.
- torneo_planillero: puede leer las tablas del torneo, hacer INSERT, UPDATE y DELETE en planilla_partido, gol y tarjeta, hacer INSERT en sancion_jugador para las sanciones automáticas y cambiar solo el estado de un partido. Lo usan los planilleros.

Como el backend se conecta con el usuario del rol que inició sesión, aunque el backend tenga un error un planillero no puede cambiar datos que no le tocan, porque la base no lo deja.

Las contraseñas de MySQL están en un archivo .env que no se sube al repositorio, en el repositorio solo está el .env.example. Las contraseñas de los usuarios del sistema se guardan con hash SHA-256 y no en texto plano.

#### Tipos de datos

- La cédula es VARCHAR(8) y no INT, porque puede empezar con 0 y con INT ese 0 se pierde. Además nunca hacemos cuentas con ella.
- Año, semestre, número de fecha, minuto y cantidad de fechas son SMALLINT porque son números chicos.
- Las fechas son DATE y las horas de los turnos son TIME.
- Usamos ENUM en los campos que en la letra tienen valores fijos: rol, tipo de jugador, estado del torneo, estado del partido, superficie de la cancha, color de la tarjeta y motivo de la sanción.
- La contraseña es VARCHAR(255) para que entre el hash.

#### Datos de prueba

03_datos.sql carga 7 facultades, 44 jugadores, 6 equipos con sus planteles, 12 partidos en 4 fechas, 21 goles, 11 tarjetas y 3 sanciones. Hay tres fechas jugadas como pide la letra, y también partidos programados, uno postergado y uno cancelado, para que todos los reportes den resultados.

#### Reportes

En 04_reportes.sql están los 9 reportes que pide la letra y 3 que agregamos nosotros. Los hicimos con lo que vimos en el curso: JOIN, LEFT JOIN, GROUP BY, ORDER BY, LIMIT, COUNT, SUM, subconsultas, NOT IN y CASE WHEN.

Los reportes que agregamos son:

- El fixture de una fecha, con qué equipos juegan, en qué cancha, qué día y a qué hora.
- Los jugadores con más tarjetas, para ver quién está cerca de una suspensión por amarillas.
- Cuántos jugadores tiene el plantel de cada equipo, para controlar que tengan entre 5 y 10.

El resultado de un partido no se guarda en ninguna tabla, se calcula con los goles como pide la letra. Para saber de qué equipo es cada gol usamos la planilla, que dice con qué equipo jugó cada jugador en ese partido. Si el gol es en contra se le suma al otro equipo.


### 2. Modelo de datos

#### Las tablas

Usamos las 14 tablas de la letra. Para cada una ponemos la clave primaria y a qué tablas apunta con claves foráneas:

- facultad: clave primaria id_facultad. No apunta a ninguna tabla.
- login: clave primaria correo. No apunta a ninguna tabla.
- turno: clave primaria id_turno. No apunta a ninguna tabla.
- complejo: clave primaria id_complejo. No apunta a ninguna tabla.
- torneo: clave primaria id_torneo. No apunta a ninguna tabla.
- jugador: clave primaria ci. Apunta a facultad con id_facultad.
- cancha: clave primaria (nombre_cancha, id_complejo). Apunta a complejo con id_complejo.
- equipo: clave primaria id_equipo. Apunta a torneo con id_torneo, a facultad con id_facultad y a jugador con ci_capitan.
- sancion_jugador: clave primaria id_sancion. Apunta a jugador con ci_jugador y a torneo con id_torneo.
- equipo_jugador_torneo: clave primaria (id_equipo, ci_jugador, id_torneo). Apunta a equipo con (id_equipo, id_torneo), a jugador con ci_jugador y a torneo con id_torneo.
- partido: clave primaria id_partido. Apunta a torneo con id_torneo, dos veces a equipo con (id_equipo_local, id_torneo) y (id_equipo_visitante, id_torneo), a turno con id_turno y a cancha con (nombre_cancha, id_complejo).
- planilla_partido: clave primaria (id_partido, ci_jugador). Apunta a partido con id_partido, a jugador con ci_jugador y a equipo_jugador_torneo con (id_equipo, ci_jugador).
- gol: clave primaria id_gol. Apunta a planilla_partido con (id_partido, ci_jugador).
- tarjeta: clave primaria id_tarjeta. Apunta a planilla_partido con (id_partido, ci_jugador).

#### Reglas que controla la base de datos

Le agregamos restricciones a las tablas para que la base controle todas las reglas de la letra que se pueden poner en una tabla:

- gol y tarjeta apuntan a planilla_partido con (id_partido, ci_jugador) y no a partido y a jugador por separado. Así solo puede hacer un gol o recibir una tarjeta alguien que está en la planilla de ese partido.
- planilla_partido apunta a equipo_jugador_torneo con (id_equipo, ci_jugador), entonces en la planilla solo puede estar un jugador que es del plantel de ese equipo.
- partido y equipo_jugador_torneo apuntan a equipo con (id_equipo, id_torneo). Así los dos equipos de un partido son del mismo torneo, y un plantel solo se puede armar con un equipo de ese torneo.
- UNIQUE (ci_jugador, id_torneo) en equipo_jugador_torneo, para que un jugador no pueda estar en dos equipos del mismo torneo.
- CHECK (id_equipo_local <> id_equipo_visitante), para que un equipo no juegue contra sí mismo.
- CHECK en turno, para que los turnos sean entre las 18:00 y las 23:00 y duren una hora.
- UNIQUE para que no haya repetidos: (nombre, departamento) en complejo, (nombre, anio, semestre) en torneo, (nombre, id_torneo) en equipo, (hora_inicio, hora_fin) en turno y (id_equipo, numero_camiseta) en el plantel. También son únicos el nombre de la facultad y el email del jugador.
- CHECK de formato y de rango: la cédula tiene 7 u 8 números, el email tiene formato de email, el semestre es 1 o 2, la fecha de fin del torneo no es antes que la de inicio, el número de fecha y la cantidad de fechas de una sanción son por lo menos 1, el minuto de un gol o de una tarjeta va de 0 a 60 y el número de camiseta va de 1 a 99.

#### Reglas que controla el backend

Hay reglas que no se pueden poner como restricción de una tabla, porque hay que contar filas, mirar otros partidos o comparar con la fecha y hora de hoy. Esas las controla el backend, en las funciones de la carpeta consultas:

- Al programar o cambiar un partido: el torneo existe y no terminó, el día está entre las fechas del torneo, los dos equipos tienen por lo menos 5 jugadores, no jugaron ya entre ellos, ninguno de los dos tiene otro partido en esa fecha y la cancha está libre ese día y en ese turno.
- Para ver si la cancha está libre no se cuentan los partidos cancelados o postergados, así ese horario se puede volver a usar. Por eso esta regla está en el backend y no como UNIQUE en la base, porque con un UNIQUE un partido cancelado seguiría ocupando la cancha.
- Estado del partido: solo se puede marcar como jugado si ya terminó, un partido jugado no se puede volver atrás, cambiar de día ni borrar, y el planillero solo puede marcar partidos como jugados.
- Planilla: el equipo tiene que jugar ese partido, el jugador tiene que ser del plantel de ese equipo y no puede estar suspendido.
- Goles y tarjetas: se cargan cuando el partido terminó y solo se pueden corregir en las primeras 48 horas. Las tarjetas se cargan en el orden en que pasaron y solo el administrador las puede corregir.
- Sanciones: las sanciones por roja o por juntar amarillas se crean solas cuando se registran las tarjetas. A mano solo se cargan las disciplinarias.
- Estado del torneo: un torneo finalizado no se puede volver a abrir, y para que empiece cada equipo tiene que tener entre 5 y 10 jugadores y el capitán tiene que estar en el plantel.

#### Mejoras que pensamos

- Algunas reglas del backend, como las sanciones automáticas o no dejar jugar a los suspendidos, se podrían hacer en la base con triggers. No lo hicimos porque no los vimos en el curso y en el backend son más fáciles de leer y probar.
- Guardar las contraseñas con un hash con sal, por ejemplo bcrypt, en vez de solo SHA-256, para que dos contraseñas iguales no tengan el mismo hash.


### 3. Bitácora

28 de octubre: Agustín creó el repositorio en GitHub, subió la letra y armó las carpetas backend, db, frontend y docs. Mauricio escribió las 14 tablas en 01_tablas.sql. El primer problema fue el orden, porque una tabla no se puede crear si apunta a otra que todavía no existe. Las ordenamos por niveles, primero las que no tienen claves foráneas y al final planilla_partido, gol y tarjeta.

29 de octubre: Agustín hizo 02_usuarios.sql con los tres usuarios de MySQL y sus permisos, la conexión según el rol en db.py, el .env.example y el login. Ignacio armó la API en Flask (app.py) con las primeras consultas de torneos, equipos y jugadores y las probó contra MySQL.

3 de noviembre: Agustín cargó los datos de prueba en 03_datos.sql y mejoró las tablas. Agregó los CHECK y cambió algunas claves foráneas por compuestas, para que la base controle cosas como que un jugador de la planilla sea del plantel de su equipo. También sacó el UNIQUE de cancha, día y turno en partido, porque no dejaba volver a usar el horario de un partido cancelado, y esa regla pasó al backend. Además agregó rutas al backend.

4 de noviembre: Ignacio escribió las consultas de equipos, planteles, partidos, goles, tarjetas y sanciones.

5 de noviembre: Ignacio escribió el README con los pasos para instalar el sistema. Como consultas.py ya tenía más de 300 líneas, lo separó en una carpeta con un archivo por tema, y ahí quedaron también las validaciones de partidos, planillas, tarjetas, sanciones y torneos. Mauricio escribió los 12 reportes en 04_reportes.sql y agregó al README cómo ejecutar los scripts de la base.

6 de noviembre: Hicimos la documentación, este informe con las decisiones de implementación, el modelo de datos, la bitácora y la bibliografía.


### 4. Bibliografía

- Letra del Trabajo Obligatorio, Base de Datos 1, Universidad Católica del Uruguay, segundo semestre 2026.
- Material del curso Base de Datos I.
- MySQL 8.4 Reference Manual: https://dev.mysql.com/doc/refman/8.4/en/
- Herramientas de inteligencia artificial. Las usamos como apoyo para hacer el frontend y para escribir y revisar consultas SQL.
