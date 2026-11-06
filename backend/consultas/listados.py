from db import get_conn
from .reportes import consultar


# listados con joins para mostrar nombres en el front

def jugadores_detalle(rol, id_torneo):
    return consultar(rol,
        """SELECT j.*, f.nombre AS facultad, e.id_equipo, e.nombre AS equipo
        FROM jugador j
        JOIN facultad f ON f.id_facultad = j.id_facultad
        LEFT JOIN equipo_jugador_torneo ejt ON ejt.ci_jugador = j.ci AND ejt.id_torneo = %s
        LEFT JOIN equipo e ON e.id_equipo = ejt.id_equipo
        ORDER BY j.apellido, j.nombre""",
        (id_torneo,))

def equipos_detalle(rol, id_torneo):
    return consultar(rol,
        """SELECT e.*, f.nombre AS facultad,
               c.nombre AS capitan_nombre, c.apellido AS capitan_apellido,
               COUNT(ejt.ci_jugador) AS jugadores,
               SUM(CASE WHEN j.tipo IN ('docente', 'funcionario') THEN 1 ELSE 0 END) AS docentes_funcionarios
        FROM equipo e
        JOIN facultad f ON f.id_facultad = e.id_facultad
        JOIN jugador c ON c.ci = e.ci_capitan
        LEFT JOIN equipo_jugador_torneo ejt ON ejt.id_equipo = e.id_equipo
        LEFT JOIN jugador j ON j.ci = ejt.ci_jugador
        WHERE e.id_torneo = %s
        GROUP BY e.id_equipo
        ORDER BY e.nombre""",
        (id_torneo,))

def obtener_equipo(rol, id_equipo):
    filas = consultar(rol, "SELECT * FROM equipo WHERE id_equipo = %s", (id_equipo,))
    return filas[0] if filas else None

def equipo_del_jugador(rol, ci_jugador, id_torneo):
    filas = consultar(rol,
        """SELECT id_equipo FROM equipo_jugador_torneo
        WHERE ci_jugador = %s AND id_torneo = %s""",
        (ci_jugador, id_torneo))
    return filas[0]["id_equipo"] if filas else None

# terminado: ya paso la hora de fin / en_plazo: no pasaron 48 horas del fin
PARTIDO_DETALLE = """
    SELECT p.*, el.nombre AS local, ev.nombre AS visitante,
           t.hora_inicio, t.hora_fin, c.nombre AS complejo,
           TIMESTAMP(p.dia, t.hora_fin) <= NOW() AS terminado,
           TIMESTAMP(p.dia, t.hora_fin) >= DATE_SUB(NOW(), INTERVAL 48 HOUR) AS en_plazo,
           (SELECT COUNT(*) FROM planilla_partido pl WHERE pl.id_partido = p.id_partido) AS en_planilla,
           (SELECT COUNT(*)
            FROM gol g
            JOIN planilla_partido pl ON pl.id_partido = g.id_partido AND pl.ci_jugador = g.ci_jugador
            WHERE g.id_partido = p.id_partido
              AND ((pl.id_equipo = p.id_equipo_local AND g.autogol = 0)
                OR (pl.id_equipo = p.id_equipo_visitante AND g.autogol = 1))) AS goles_local,
           (SELECT COUNT(*)
            FROM gol g
            JOIN planilla_partido pl ON pl.id_partido = g.id_partido AND pl.ci_jugador = g.ci_jugador
            WHERE g.id_partido = p.id_partido
              AND ((pl.id_equipo = p.id_equipo_visitante AND g.autogol = 0)
                OR (pl.id_equipo = p.id_equipo_local AND g.autogol = 1))) AS goles_visitante
    FROM partido p
    JOIN equipo el ON el.id_equipo = p.id_equipo_local
    JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante
    JOIN turno t ON t.id_turno = p.id_turno
    JOIN complejo c ON c.id_complejo = p.id_complejo
"""

def partidos_detalle(rol, id_torneo):
    return consultar(rol,
        PARTIDO_DETALLE + " WHERE p.id_torneo = %s ORDER BY p.numero_fecha, p.dia, t.hora_inicio",
        (id_torneo,))

def partido_detalle(rol, id_partido):
    filas = consultar(rol, PARTIDO_DETALLE + " WHERE p.id_partido = %s", (id_partido,))
    return filas[0] if filas else None

# canchas ocupadas ese dia, de cualquier torneo
def partidos_del_dia(rol, dia):
    return consultar(rol,
        """SELECT id_partido, id_turno, nombre_cancha, id_complejo
        FROM partido
        WHERE dia = %s AND estado NOT IN ('cancelado', 'postergado')""",
        (dia,))

def planilla_detalle(rol, id_partido):
    return consultar(rol,
        """SELECT pp.*, j.nombre, j.apellido, ejt.numero_camiseta
        FROM planilla_partido pp
        JOIN jugador j ON j.ci = pp.ci_jugador
        JOIN equipo_jugador_torneo ejt ON ejt.id_equipo = pp.id_equipo AND ejt.ci_jugador = pp.ci_jugador
        WHERE pp.id_partido = %s
        ORDER BY ejt.numero_camiseta""",
        (id_partido,))

def goles_detalle(rol, id_partido):
    return consultar(rol,
        """SELECT g.*, j.nombre, j.apellido, pp.id_equipo
        FROM gol g
        JOIN jugador j ON j.ci = g.ci_jugador
        JOIN planilla_partido pp ON pp.id_partido = g.id_partido AND pp.ci_jugador = g.ci_jugador
        WHERE g.id_partido = %s
        ORDER BY g.minuto""",
        (id_partido,))

def tarjetas_detalle(rol, id_partido):
    return consultar(rol,
        """SELECT t.*, j.nombre, j.apellido, pp.id_equipo
        FROM tarjeta t
        JOIN jugador j ON j.ci = t.ci_jugador
        JOIN planilla_partido pp ON pp.id_partido = t.id_partido AND pp.ci_jugador = t.ci_jugador
        WHERE t.id_partido = %s
        ORDER BY t.minuto""",
        (id_partido,))

def sanciones_detalle(rol, id_torneo):
    return consultar(rol,
        """SELECT s.*, j.nombre, j.apellido, e.nombre AS equipo
        FROM sancion_jugador s
        JOIN jugador j ON j.ci = s.ci_jugador
        LEFT JOIN equipo_jugador_torneo ejt ON ejt.ci_jugador = s.ci_jugador AND ejt.id_torneo = s.id_torneo
        LEFT JOIN equipo e ON e.id_equipo = ejt.id_equipo
        WHERE s.id_torneo = %s
        ORDER BY s.numero_fecha_inicio DESC, j.apellido""",
        (id_torneo,))


# usuarios y facultades (pantalla de configuracion)

def obtener_usuarios(rol):
    return consultar(rol, "SELECT correo, rol FROM login ORDER BY rol, correo")

def crear_usuario(rol, correo, contrasena_hash, rol_usuario):
    conexion = get_conn(rol)
    cursor = conexion.cursor()
    cursor.execute(
        "INSERT INTO login (correo, contrasena, rol) VALUES (%s, %s, %s)",
        (correo, contrasena_hash, rol_usuario)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def borrar_usuario(rol, correo):
    conexion = get_conn(rol)
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM login WHERE correo = %s", (correo,))
    conexion.commit()
    cursor.close()
    conexion.close()

def crear_facultad(rol, nombre):
    conexion = get_conn(rol)
    cursor = conexion.cursor()
    cursor.execute("INSERT INTO facultad (nombre) VALUES (%s)", (nombre,))
    conexion.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conexion.close()
    return nuevo_id
