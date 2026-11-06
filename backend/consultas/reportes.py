from db import get_conn


def consultar(rol, sql, parametros=()):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(sql, parametros)
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado


def reporte_posiciones(rol, id_torneo):
    return consultar(rol,
        """SELECT r.id_equipo, r.equipo,
               COUNT(*) AS PJ,
               SUM(CASE WHEN r.gf > r.gc THEN 1 ELSE 0 END) AS PG,
               SUM(CASE WHEN r.gf = r.gc THEN 1 ELSE 0 END) AS PE,
               SUM(CASE WHEN r.gf < r.gc THEN 1 ELSE 0 END) AS PP,
               SUM(r.gf) AS GF,
               SUM(r.gc) AS GC,
               SUM(r.gf) - SUM(r.gc) AS DG,
               SUM(CASE WHEN r.gf > r.gc THEN 3 WHEN r.gf = r.gc THEN 1 ELSE 0 END) AS PTS
        FROM (
           SELECT e.id_equipo, e.nombre AS equipo, p.id_partido,
                  (SELECT COUNT(*)
                   FROM gol g
                   JOIN planilla_partido pp ON pp.id_partido = g.id_partido AND pp.ci_jugador = g.ci_jugador
                   WHERE g.id_partido = p.id_partido
                     AND ((pp.id_equipo = e.id_equipo AND g.autogol = FALSE)
                       OR (pp.id_equipo <> e.id_equipo AND g.autogol = TRUE))) AS gf,
                  (SELECT COUNT(*)
                   FROM gol g
                   JOIN planilla_partido pp ON pp.id_partido = g.id_partido AND pp.ci_jugador = g.ci_jugador
                   WHERE g.id_partido = p.id_partido
                     AND ((pp.id_equipo <> e.id_equipo AND g.autogol = FALSE)
                       OR (pp.id_equipo = e.id_equipo AND g.autogol = TRUE))) AS gc
           FROM equipo e
           JOIN partido p ON e.id_equipo = p.id_equipo_local OR e.id_equipo = p.id_equipo_visitante
           WHERE p.estado = 'jugado' AND p.id_torneo = %s
        ) r
        GROUP BY r.id_equipo, r.equipo
        ORDER BY PTS DESC, DG DESC, GF DESC""",
        (id_torneo,))

def reporte_goleadores(rol, id_torneo):
    return consultar(rol,
        """SELECT j.ci, j.nombre, j.apellido, e.nombre AS equipo, COUNT(*) AS goles
        FROM gol g
        JOIN jugador j ON j.ci = g.ci_jugador
        JOIN partido p ON p.id_partido = g.id_partido
        JOIN planilla_partido pp ON pp.id_partido = g.id_partido AND pp.ci_jugador = g.ci_jugador
        JOIN equipo e ON e.id_equipo = pp.id_equipo
        WHERE g.autogol = FALSE AND p.id_torneo = %s
        GROUP BY j.ci, j.nombre, j.apellido, e.nombre
        ORDER BY goles DESC
        LIMIT 10""",
        (id_torneo,))

# amarilla 1 punto, roja 3, gana el de menor puntaje
def reporte_fair_play(rol, id_torneo):
    return consultar(rol,
        """SELECT e.nombre AS equipo,
               SUM(CASE WHEN t.color = 'amarilla' THEN 1 ELSE 0 END) AS amarillas,
               SUM(CASE WHEN t.color = 'roja' THEN 1 ELSE 0 END) AS rojas,
               SUM(CASE WHEN t.color = 'amarilla' THEN 1
                        WHEN t.color = 'roja' THEN 3
                        ELSE 0 END) AS puntaje
        FROM equipo e
        LEFT JOIN planilla_partido pp ON pp.id_equipo = e.id_equipo
        LEFT JOIN tarjeta t ON t.id_partido = pp.id_partido AND t.ci_jugador = pp.ci_jugador
        WHERE e.id_torneo = %s
        GROUP BY e.id_equipo, e.nombre
        ORDER BY puntaje""",
        (id_torneo,))

def reporte_promedio_goles_fecha(rol, id_torneo):
    return consultar(rol,
        """SELECT p.numero_fecha,
               COUNT(DISTINCT p.id_partido) AS partidos,
               COUNT(g.id_gol) AS goles,
               COUNT(g.id_gol) / COUNT(DISTINCT p.id_partido) AS promedio
        FROM partido p
        LEFT JOIN gol g ON g.id_partido = p.id_partido
        WHERE p.estado = 'jugado' AND p.id_torneo = %s
        GROUP BY p.numero_fecha
        ORDER BY p.numero_fecha""",
        (id_torneo,))

def reporte_promedio_goles_torneo(rol, id_torneo):
    return consultar(rol,
        """SELECT COUNT(DISTINCT p.id_partido) AS partidos,
               COUNT(g.id_gol) AS goles,
               COUNT(g.id_gol) / COUNT(DISTINCT p.id_partido) AS promedio
        FROM partido p
        LEFT JOIN gol g ON g.id_partido = p.id_partido
        WHERE p.estado = 'jugado' AND p.id_torneo = %s""",
        (id_torneo,))

def reporte_canchas(rol, id_torneo):
    return consultar(rol,
        """SELECT c.nombre AS complejo, p.nombre_cancha, COUNT(*) AS partidos
        FROM partido p
        JOIN complejo c ON c.id_complejo = p.id_complejo
        WHERE p.estado IN ('jugado', 'programado') AND p.id_torneo = %s
        GROUP BY c.nombre, p.nombre_cancha
        ORDER BY partidos DESC""",
        (id_torneo,))

def reporte_turnos(rol, id_torneo):
    return consultar(rol,
        """SELECT t.hora_inicio, t.hora_fin, COUNT(*) AS partidos
        FROM partido p
        JOIN turno t ON t.id_turno = p.id_turno
        WHERE p.estado IN ('jugado', 'programado') AND p.id_torneo = %s
        GROUP BY t.id_turno, t.hora_inicio, t.hora_fin
        ORDER BY t.hora_inicio""",
        (id_torneo,))

# no depende del torneo, son todos los jugadores registrados
def reporte_jugadores_facultad(rol):
    return consultar(rol,
        """SELECT f.nombre AS facultad, j.tipo, COUNT(*) AS jugadores
        FROM jugador j
        JOIN facultad f ON f.id_facultad = j.id_facultad
        GROUP BY f.nombre, j.tipo
        ORDER BY f.nombre, j.tipo""")

def reporte_sin_planilla(rol, id_torneo):
    return consultar(rol,
        """SELECT j.ci, j.nombre, j.apellido, e.nombre AS equipo
        FROM equipo_jugador_torneo ejt
        JOIN jugador j ON j.ci = ejt.ci_jugador
        JOIN equipo e ON e.id_equipo = ejt.id_equipo
        WHERE ejt.id_torneo = %s
          AND ejt.ci_jugador NOT IN (SELECT pp.ci_jugador FROM planilla_partido pp)
        ORDER BY e.nombre, j.apellido""",
        (id_torneo,))

def reporte_sanciones(rol, id_torneo):
    return consultar(rol,
        """SELECT e.nombre AS equipo, s.motivo, COUNT(*) AS sanciones
        FROM sancion_jugador s
        JOIN equipo_jugador_torneo ejt ON ejt.ci_jugador = s.ci_jugador AND ejt.id_torneo = s.id_torneo
        JOIN equipo e ON e.id_equipo = ejt.id_equipo
        WHERE s.id_torneo = %s
        GROUP BY e.nombre, s.motivo
        ORDER BY e.nombre, s.motivo""",
        (id_torneo,))

def reporte_estados(rol, id_torneo):
    return consultar(rol,
        """SELECT estado,
               COUNT(*) AS partidos,
               COUNT(*) * 100 / (SELECT COUNT(*) FROM partido WHERE id_torneo = %s) AS porcentaje
        FROM partido
        WHERE id_torneo = %s
        GROUP BY estado
        ORDER BY partidos DESC""",
        (id_torneo, id_torneo))

def reporte_fixture(rol, id_torneo, numero_fecha):
    return consultar(rol,
        """SELECT p.numero_fecha, p.dia, t.hora_inicio,
               el.nombre AS local, ev.nombre AS visitante,
               p.nombre_cancha, c.nombre AS complejo, p.estado
        FROM partido p
        JOIN equipo el ON el.id_equipo = p.id_equipo_local
        JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante
        JOIN turno t ON t.id_turno = p.id_turno
        JOIN complejo c ON c.id_complejo = p.id_complejo
        WHERE p.id_torneo = %s AND p.numero_fecha = %s
        ORDER BY p.dia, t.hora_inicio""",
        (id_torneo, numero_fecha))

def reporte_tarjetas_jugador(rol, id_torneo):
    return consultar(rol,
        """SELECT j.nombre, j.apellido,
               SUM(CASE WHEN t.color = 'amarilla' THEN 1 ELSE 0 END) AS amarillas,
               SUM(CASE WHEN t.color = 'roja' THEN 1 ELSE 0 END) AS rojas,
               COUNT(*) AS total
        FROM tarjeta t
        JOIN jugador j ON j.ci = t.ci_jugador
        JOIN partido p ON p.id_partido = t.id_partido
        WHERE p.id_torneo = %s
        GROUP BY j.ci, j.nombre, j.apellido
        ORDER BY total DESC
        LIMIT 5""",
        (id_torneo,))

def reporte_tamano_planteles(rol, id_torneo):
    return consultar(rol,
        """SELECT e.nombre AS equipo, COUNT(ejt.ci_jugador) AS jugadores
        FROM equipo e
        LEFT JOIN equipo_jugador_torneo ejt ON ejt.id_equipo = e.id_equipo
        WHERE e.id_torneo = %s
        GROUP BY e.id_equipo, e.nombre
        ORDER BY jugadores DESC""",
        (id_torneo,))
