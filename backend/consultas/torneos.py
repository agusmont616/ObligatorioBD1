from db import get_conn


def obtener_torneos(rol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM torneo;")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_torneo_por_id(rol, id_torneo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM torneo WHERE id_torneo = %s",
        (id_torneo,)
    )
    resultado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return resultado

def crear_torneo(rol, nombre, anio, semestre, fecha_inicio, fecha_fin, estado):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """INSERT INTO torneo
        (nombre, anio, semestre, fecha_inicio, fecha_fin, estado)
        VALUES ( %s, %s, %s, %s, %s, %s)""",
        (nombre, anio, semestre, fecha_inicio, fecha_fin, estado)
    )
    conexion.commit()
    nuevo_id= cursor.lastrowid
    cursor.close()
    conexion.close()
    return nuevo_id

def obtener_facultades(rol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM facultad ORDER BY nombre")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_turnos(rol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM turno ORDER BY hora_inicio")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def cambiar_estado_torneo(rol, id_torneo, estado):
    if estado not in ("inscripcion", "en curso", "finalizado"):
        raise ValueError("Estado del torneo inválido")
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT estado FROM torneo WHERE id_torneo = %s",
            (id_torneo,)
        )
        torneo = cursor.fetchone()
        if torneo is None:
            raise ValueError("El torneo no existe")
        if torneo["estado"] == "finalizado" and estado != "finalizado":
            raise ValueError("No se puede reabrir un torneo finalizado")
        if torneo["estado"] == "en curso" and estado == "inscripcion":
            raise ValueError("No se puede volver a inscripción")
        if estado == "en curso":
            cursor.execute(
                """SELECT e.id_equipo, e.ci_capitan,
                          COUNT(ejt.ci_jugador) AS jugadores,
                          SUM(CASE WHEN ejt.ci_jugador = e.ci_capitan
                              THEN 1 ELSE 0 END) AS capitan_inscripto
                   FROM equipo e
                   LEFT JOIN equipo_jugador_torneo ejt
                     ON ejt.id_equipo = e.id_equipo
                    AND ejt.id_torneo = e.id_torneo
                   WHERE e.id_torneo = %s
                   GROUP BY e.id_equipo, e.ci_capitan""",
                (id_torneo,)
            )
            equipos = cursor.fetchall()
            if not equipos:
                raise ValueError("El torneo no tiene equipos")
            for equipo in equipos:
                if not 5 <= equipo["jugadores"] <= 10:
                    raise ValueError("Cada equipo necesita entre 5 y 10 jugadores")
                if not equipo["capitan_inscripto"]:
                    raise ValueError("El capitán debe pertenecer al plantel")
        cursor.execute(
            "UPDATE torneo SET estado = %s WHERE id_torneo = %s",
            (estado, id_torneo)
        )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()