from db import get_conn


def obtener_partidos_torneo(rol, id_torneo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT *
        FROM partido
        WHERE id_torneo = %s""",
        (id_torneo,)
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_partido_por_id(rol, id_partido):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT *
        FROM partido
        WHERE id_partido = %s""",
        (id_partido,)
    )
    resultado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return resultado

def obtener_planilla_partido(rol, id_partido):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT *
        FROM planilla_partido
        WHERE id_partido = %s""",
        (id_partido,)
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def crear_partido(rol, id_torneo, numero_fecha, id_equipo_local,
                  id_equipo_visitante, dia, id_turno, nombre_cancha, id_complejo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        if id_equipo_local == id_equipo_visitante:
            raise ValueError("Un equipo no puede jugar contra sí mismo")
        cursor.execute(
            """SELECT estado, fecha_inicio, fecha_fin
               FROM torneo WHERE id_torneo = %s""",
            (id_torneo,)
        )
        torneo = cursor.fetchone()
        if torneo is None or torneo["estado"] == "finalizado":
            raise ValueError("Torneo inexistente o finalizado")
        if not (str(torneo["fecha_inicio"]) <= str(dia) <= str(torneo["fecha_fin"])):
            raise ValueError("La fecha está fuera del torneo")
        cursor.execute(
            """SELECT e.id_equipo, COUNT(ejt.ci_jugador) AS jugadores
               FROM equipo e
               LEFT JOIN equipo_jugador_torneo ejt
                 ON ejt.id_equipo = e.id_equipo
                AND ejt.id_torneo = e.id_torneo
               WHERE e.id_torneo = %s AND e.id_equipo IN (%s, %s)
               GROUP BY e.id_equipo""",
            (id_torneo, id_equipo_local, id_equipo_visitante)
        )
        equipos = cursor.fetchall()
        if len(equipos) != 2 or any(e["jugadores"] < 5 for e in equipos):
            raise ValueError("Ambos equipos deben tener al menos 5 jugadores")
        cursor.execute(
            """SELECT id_partido FROM partido
               WHERE id_torneo = %s AND estado <> 'cancelado'
               AND LEAST(id_equipo_local, id_equipo_visitante) = LEAST(%s, %s)
               AND GREATEST(id_equipo_local, id_equipo_visitante) = GREATEST(%s, %s)
               LIMIT 1""",
            (id_torneo, id_equipo_local, id_equipo_visitante,
             id_equipo_local, id_equipo_visitante)
        )
        if cursor.fetchone():
            raise ValueError("Los equipos ya tienen un enfrentamiento")
        cursor.execute(
            """SELECT id_partido FROM partido
               WHERE id_torneo = %s AND numero_fecha = %s
                 AND estado <> 'cancelado'
                 AND (id_equipo_local IN (%s, %s)
                      OR id_equipo_visitante IN (%s, %s))
               LIMIT 1""",
            (id_torneo, numero_fecha, id_equipo_local, id_equipo_visitante,
             id_equipo_local, id_equipo_visitante)
        )
        if cursor.fetchone():
            raise ValueError("Uno de los equipos ya juega en esa fecha")
        cursor.execute(
            """SELECT id_partido FROM partido
               WHERE dia = %s AND id_turno = %s
                 AND nombre_cancha = %s AND id_complejo = %s
                 AND estado NOT IN ('cancelado', 'postergado')
               LIMIT 1""",
            (dia, id_turno, nombre_cancha, id_complejo)
        )
        if cursor.fetchone():
            raise ValueError("La cancha ya está ocupada")
        cursor.execute(
            """INSERT INTO partido
               (id_torneo, numero_fecha, id_equipo_local, id_equipo_visitante,
                dia, id_turno, nombre_cancha, id_complejo, estado)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'programado')""",
            (id_torneo, numero_fecha, id_equipo_local, id_equipo_visitante,
             dia, id_turno, nombre_cancha, id_complejo)
        )
        nuevo_id = cursor.lastrowid
        conexion.commit()
        return nuevo_id
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def modificar_partido(rol, id_partido, id_torneo, numero_fecha,
                      id_equipo_local, id_equipo_visitante, dia,
                      id_turno, nombre_cancha, id_complejo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT estado FROM partido WHERE id_partido = %s",
            (id_partido,)
        )
        partido = cursor.fetchone()
        if partido is None:
            raise ValueError("El partido no existe")
        if partido["estado"] == "jugado":
            raise ValueError("No se puede reprogramar un partido jugado")
        if id_equipo_local == id_equipo_visitante:
            raise ValueError("Un equipo no puede jugar contra sí mismo")
        cursor.execute(
            """SELECT estado, fecha_inicio, fecha_fin
               FROM torneo WHERE id_torneo = %s""",
            (id_torneo,)
        )
        torneo = cursor.fetchone()
        if torneo is None or torneo["estado"] == "finalizado":
            raise ValueError("Torneo inexistente o finalizado")
        if not (str(torneo["fecha_inicio"]) <= str(dia) <= str(torneo["fecha_fin"])):
            raise ValueError("Fecha fuera del torneo")
        cursor.execute(
            """SELECT e.id_equipo, COUNT(ejt.ci_jugador) AS jugadores
               FROM equipo e
               LEFT JOIN equipo_jugador_torneo ejt
                 ON ejt.id_equipo = e.id_equipo
                AND ejt.id_torneo = e.id_torneo
               WHERE e.id_torneo = %s AND e.id_equipo IN (%s, %s)
               GROUP BY e.id_equipo""",
            (id_torneo, id_equipo_local, id_equipo_visitante)
        )
        equipos = cursor.fetchall()
        if len(equipos) != 2 or any(e["jugadores"] < 5 for e in equipos):
            raise ValueError("Equipos inválidos o con menos de 5 jugadores")
        cursor.execute(
            """SELECT id_partido FROM partido
               WHERE id_torneo = %s AND id_partido <> %s
                 AND estado <> 'cancelado'
                 AND LEAST(id_equipo_local, id_equipo_visitante) = LEAST(%s, %s)
                 AND GREATEST(id_equipo_local, id_equipo_visitante) = GREATEST(%s, %s)
               LIMIT 1""",
            (id_torneo, id_partido, id_equipo_local, id_equipo_visitante,
             id_equipo_local, id_equipo_visitante)
        )
        if cursor.fetchone():
            raise ValueError("Los equipos ya tienen un enfrentamiento")
        cursor.execute(
            """SELECT id_partido FROM partido
               WHERE id_torneo = %s AND numero_fecha = %s
                 AND id_partido <> %s AND estado <> 'cancelado'
                 AND (id_equipo_local IN (%s, %s)
                      OR id_equipo_visitante IN (%s, %s))
               LIMIT 1""",
            (id_torneo, numero_fecha, id_partido, id_equipo_local,
             id_equipo_visitante, id_equipo_local, id_equipo_visitante)
        )
        if cursor.fetchone():
            raise ValueError("Uno de los equipos ya juega en esa fecha")
        cursor.execute(
            """SELECT id_partido FROM partido
               WHERE dia = %s AND id_turno = %s
                 AND nombre_cancha = %s AND id_complejo = %s
                 AND id_partido <> %s
                 AND estado NOT IN ('cancelado', 'postergado')
               LIMIT 1""",
            (dia, id_turno, nombre_cancha, id_complejo, id_partido)
        )
        if cursor.fetchone():
            raise ValueError("La cancha ya está ocupada")
        cursor.execute(
            """UPDATE partido
               SET id_torneo = %s, numero_fecha = %s,
                   id_equipo_local = %s, id_equipo_visitante = %s,
                   dia = %s, id_turno = %s, nombre_cancha = %s,
                   id_complejo = %s, estado = 'programado'
               WHERE id_partido = %s""",
            (id_torneo, numero_fecha, id_equipo_local, id_equipo_visitante,
             dia, id_turno, nombre_cancha, id_complejo, id_partido)
        )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def cambiar_estado_partido(rol, id_partido, estado):
    if estado not in ("programado", "jugado", "postergado", "cancelado"):
        raise ValueError("Estado de partido inválido")
    if rol == "planillero" and estado != "jugado":
        raise ValueError("El planillero solo puede marcar partidos jugados")
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT p.estado,
                     TIMESTAMP(p.dia, t.hora_fin) <= NOW() AS terminado
               FROM partido p
               JOIN turno t ON t.id_turno = p.id_turno
               WHERE p.id_partido = %s""",
            (id_partido,)
        )
        partido = cursor.fetchone()
        if partido is None:
            raise ValueError("El partido no existe")
        if partido["estado"] == "jugado" and estado != "jugado":
            raise ValueError("No se puede revertir un partido jugado")
        if estado == "jugado":
            if not partido["terminado"]:
                raise ValueError("El partido todavía no terminó")
            if partido["estado"] in ("cancelado", "postergado"):
                raise ValueError("Primero hay que reprogramar el partido")
        cursor.execute(
            "UPDATE partido SET estado = %s WHERE id_partido = %s",
            (estado, id_partido)
        )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def borrar_partido(rol, id_partido):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT estado FROM partido WHERE id_partido = %s",
            (id_partido,)
        )
        partido = cursor.fetchone()
        if partido is None:
            raise ValueError("El partido no existe")
        if partido["estado"] == "jugado":
            raise ValueError("No se puede borrar un partido jugado")
        cursor.execute(
            "DELETE FROM partido WHERE id_partido = %s",
            (id_partido,)
        )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def obtener_resultado_partido(rol, id_partido):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT p.id_partido, p.estado,
                  p.id_equipo_local, p.id_equipo_visitante,
           (SELECT COUNT(*)
            FROM gol g
            JOIN planilla_partido pl
              ON pl.id_partido = g.id_partido
             AND pl.ci_jugador = g.ci_jugador
            WHERE g.id_partido = p.id_partido
              AND ((pl.id_equipo = p.id_equipo_local AND g.autogol = 0)
                OR (pl.id_equipo = p.id_equipo_visitante AND g.autogol = 1))
           ) AS goles_local,
           (SELECT COUNT(*)
            FROM gol g
            JOIN planilla_partido pl
              ON pl.id_partido = g.id_partido
             AND pl.ci_jugador = g.ci_jugador
            WHERE g.id_partido = p.id_partido
              AND ((pl.id_equipo = p.id_equipo_visitante AND g.autogol = 0)
                OR (pl.id_equipo = p.id_equipo_local AND g.autogol = 1))
           ) AS goles_visitante
           FROM partido p
           WHERE p.id_partido = %s""",
        (id_partido,)
    )
    resultado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return resultado

def agregar_jugador_planilla(rol, id_partido, ci_jugador, id_equipo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT id_torneo, numero_fecha, id_equipo_local,
                      id_equipo_visitante, estado
               FROM partido WHERE id_partido = %s""",
            (id_partido,)
        )
        partido = cursor.fetchone()
        if partido is None or partido["estado"] in ("cancelado", "postergado"):
            raise ValueError("El partido no está disponible")
        if id_equipo not in (
            partido["id_equipo_local"],
            partido["id_equipo_visitante"]
        ):
            raise ValueError("El equipo no participa en este partido")
        cursor.execute(
            """SELECT ci_jugador
               FROM equipo_jugador_torneo
               WHERE id_torneo = %s AND id_equipo = %s
                 AND ci_jugador = %s""",
            (partido["id_torneo"], id_equipo, ci_jugador)
        )
        if cursor.fetchone() is None:
            raise ValueError("El jugador no pertenece al plantel")
        cursor.execute(
            """SELECT id_sancion FROM sancion_jugador
               WHERE id_torneo = %s AND ci_jugador = %s
                 AND %s BETWEEN numero_fecha_inicio
                     AND numero_fecha_inicio + cantidad_fechas - 1
               LIMIT 1""",
            (partido["id_torneo"], ci_jugador, partido["numero_fecha"])
        )
        if cursor.fetchone():
            raise ValueError("El jugador está suspendido")
        cursor.execute(
            """INSERT INTO planilla_partido
               (id_partido, ci_jugador, id_equipo)
               VALUES (%s, %s, %s)""",
            (id_partido, ci_jugador, id_equipo)
        )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def quitar_jugador_planilla(rol, id_partido, ci_jugador):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT p.estado,
            TIMESTAMP(p.dia, t.hora_fin) >= DATE_SUB(NOW(), INTERVAL 48 HOUR) AS en_plazo
               FROM partido p
               JOIN turno t ON t.id_turno = p.id_turno
               WHERE p.id_partido = %s""",
            (id_partido,)
        )
        partido = cursor.fetchone()
        if partido is None:
            raise ValueError("Partido inexistente")
        if partido["estado"] == "jugado" and not partido["en_plazo"]:
            raise ValueError("Venció el plazo de 48 horas")
        cursor.execute(
            """DELETE FROM planilla_partido
               WHERE id_partido = %s AND ci_jugador = %s""",
            (id_partido, ci_jugador)
        )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def obtener_goles_partido(rol, id_partido):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT *
        FROM gol
        WHERE id_partido = %s""",
        (id_partido,)
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def registrar_gol(rol, id_partido, ci_jugador, minuto, autogol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT p.estado,
                      TIMESTAMP(p.dia, t.hora_fin) <= NOW() AS terminado,
                      TIMESTAMP(p.dia, t.hora_fin) >=
                      DATE_SUB(NOW(), INTERVAL 48 HOUR) AS en_plazo
               FROM partido p
               JOIN turno t ON t.id_turno = p.id_turno
               WHERE p.id_partido = %s""",
            (id_partido,)
        )
        partido = cursor.fetchone()
        if partido is None or partido["estado"] in ("cancelado", "postergado"):
            raise ValueError("El partido no admite goles")
        if not partido["terminado"]:
            raise ValueError("El partido todavía no terminó")
        if partido["estado"] == "jugado" and not partido["en_plazo"]:
            raise ValueError("Venció el plazo de 48 horas")
        cursor.execute(
            """INSERT INTO gol (id_partido, ci_jugador, minuto, autogol)
               VALUES (%s, %s, %s, %s)""",
            (id_partido, ci_jugador, minuto, autogol)
        )
        nuevo_id = cursor.lastrowid
        conexion.commit()
        return nuevo_id
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def borrar_gol(rol, id_gol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT p.estado,
                      TIMESTAMP(p.dia, t.hora_fin) >=
                      DATE_SUB(NOW(), INTERVAL 48 HOUR) AS en_plazo
               FROM gol g
               JOIN partido p ON p.id_partido = g.id_partido
               JOIN turno t ON t.id_turno = p.id_turno
               WHERE g.id_gol = %s""",
            (id_gol,)
        )
        partido = cursor.fetchone()
        if partido is None:
            raise ValueError("El gol no existe")
        if partido["estado"] == "jugado" and not partido["en_plazo"]:
            raise ValueError("Venció el plazo de 48 horas")
        cursor.execute(
            "DELETE FROM gol WHERE id_gol = %s",
            (id_gol,)
        )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()