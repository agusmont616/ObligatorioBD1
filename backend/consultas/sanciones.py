from db import get_conn


def obtener_tarjetas_partido(rol, id_partido):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT *
        FROM tarjeta
        WHERE id_partido = %s""",
        (id_partido,)
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_sanciones_jugador(rol, ci_jugador):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT *
        FROM sancion_jugador
        WHERE ci_jugador = %s""",
        (ci_jugador,)
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_sanciones_torneo(rol, id_torneo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT *
        FROM sancion_jugador
        WHERE id_torneo = %s""",
        (id_torneo,)
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def crear_sancion(rol, ci_jugador, id_torneo, motivo, numero_fecha_inicio, cantidad_fechas):
    if motivo != "disciplinaria":
        raise ValueError("Las sanciones por tarjetas se generan automáticamente")
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """INSERT INTO sancion_jugador
           (ci_jugador, id_torneo, motivo,
            numero_fecha_inicio, cantidad_fechas)
           VALUES (%s, %s, %s, %s, %s)""",
        (ci_jugador, id_torneo, motivo,
         numero_fecha_inicio, cantidad_fechas)
    )
    conexion.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conexion.close()
    return nuevo_id

def modificar_sancion(rol, id_sancion, ci_jugador, id_torneo, motivo, numero_fecha_inicio, cantidad_fechas):
    if motivo != "disciplinaria":
        raise ValueError("No se modifican manualmente sanciones automáticas")
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """UPDATE sancion_jugador
           SET ci_jugador = %s, id_torneo = %s, motivo = %s,
               numero_fecha_inicio = %s, cantidad_fechas = %s
           WHERE id_sancion = %s AND motivo = 'disciplinaria'""",
        (ci_jugador, id_torneo, motivo,
         numero_fecha_inicio, cantidad_fechas, id_sancion)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def borrar_sancion(rol, id_sancion):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """DELETE FROM sancion_jugador
           WHERE id_sancion = %s AND motivo = 'disciplinaria'""",
        (id_sancion,)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def registrar_tarjeta(rol, id_partido, ci_jugador, minuto, color):
    if color not in ("amarilla", "roja"):
        raise ValueError("Color inválido")
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT p.id_torneo, p.numero_fecha, p.estado,
                      p.dia, t.hora_inicio,
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
            raise ValueError("El partido no admite tarjetas")
        if not partido["terminado"]:
            raise ValueError("El partido todavía no terminó")
        if partido["estado"] == "jugado" and not partido["en_plazo"]:
            raise ValueError("Venció el plazo de corrección de 48 horas")
        cursor.execute(
            """SELECT ta.id_tarjeta
               FROM tarjeta ta
               JOIN partido p ON p.id_partido = ta.id_partido
               JOIN turno t ON t.id_turno = p.id_turno
               WHERE ta.ci_jugador = %s AND p.id_torneo = %s
                 AND (
                     p.dia > %s
                     OR (p.dia = %s AND t.hora_inicio > %s)
                     OR (p.dia = %s AND t.hora_inicio = %s AND ta.minuto > %s)
                 )
               LIMIT 1""",
            (ci_jugador, partido["id_torneo"],
             partido["dia"], partido["dia"], partido["hora_inicio"],
             partido["dia"], partido["hora_inicio"], minuto)
        )
        if cursor.fetchone():
            raise ValueError("Las tarjetas deben cargarse en orden cronológico")
        cursor.execute(
            """INSERT INTO tarjeta (id_partido, ci_jugador, minuto, color)
               VALUES (%s, %s, %s, %s)""",
            (id_partido, ci_jugador, minuto, color)
        )
        nuevo_id = cursor.lastrowid
        motivo = None
        if color == "roja":
            motivo = "roja"
        if color == "amarilla":
            cursor.execute(
                """SELECT COUNT(*) AS total
                   FROM tarjeta ta
                   JOIN partido p ON p.id_partido = ta.id_partido
                   WHERE ta.ci_jugador = %s
                     AND p.id_torneo = %s
                     AND ta.color = 'amarilla'""",
                (ci_jugador, partido["id_torneo"])
            )
            total = cursor.fetchone()["total"]
            if total % 3 == 0:
                motivo = "acumulacion de amarillas"
        if motivo is not None:
            cursor.execute(
                """INSERT INTO sancion_jugador
                   (ci_jugador, id_torneo, motivo,
                    numero_fecha_inicio, cantidad_fechas)
                   VALUES (%s, %s, %s, %s, 1)""",
                (ci_jugador, partido["id_torneo"], motivo,
                 partido["numero_fecha"] + 1)
            )
        conexion.commit()
        return nuevo_id
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()

def borrar_tarjeta(rol, id_tarjeta):
    if rol != "administrador":
        raise ValueError("Solo el administrador puede corregir tarjetas")
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT ta.ci_jugador, p.id_torneo, p.estado,
                      TIMESTAMP(p.dia, t.hora_fin) >=
                      DATE_SUB(NOW(), INTERVAL 48 HOUR) AS en_plazo
               FROM tarjeta ta
               JOIN partido p ON p.id_partido = ta.id_partido
               JOIN turno t ON t.id_turno = p.id_turno
               WHERE ta.id_tarjeta = %s""",
            (id_tarjeta,)
        )
        tarjeta = cursor.fetchone()
        if tarjeta is None:
            raise ValueError("La tarjeta no existe")
        if tarjeta["estado"] == "jugado" and not tarjeta["en_plazo"]:
            raise ValueError("Venció el plazo de corrección de 48 horas")
        cursor.execute(
            "DELETE FROM tarjeta WHERE id_tarjeta = %s",
            (id_tarjeta,)
        )
        cursor.execute(
            """DELETE FROM sancion_jugador
               WHERE ci_jugador = %s AND id_torneo = %s
                 AND motivo IN ('roja', 'acumulacion de amarillas')""",
            (tarjeta["ci_jugador"], tarjeta["id_torneo"])
        )
        cursor.execute(
            """SELECT ta.color, p.numero_fecha
               FROM tarjeta ta
               JOIN partido p ON p.id_partido = ta.id_partido
               JOIN turno t ON t.id_turno = p.id_turno
               WHERE ta.ci_jugador = %s AND p.id_torneo = %s
               ORDER BY p.dia, t.hora_inicio, ta.minuto, ta.id_tarjeta""",
            (tarjeta["ci_jugador"], tarjeta["id_torneo"])
        )
        tarjetas = cursor.fetchall()
        amarillas = 0
        for registro in tarjetas:
            motivo = None
            if registro["color"] == "roja":
                motivo = "roja"
            if registro["color"] == "amarilla":
                amarillas += 1
                if amarillas % 3 == 0:
                    motivo = "acumulacion de amarillas"
            if motivo is not None:
                cursor.execute(
                    """INSERT INTO sancion_jugador
                       (ci_jugador, id_torneo, motivo,
                        numero_fecha_inicio, cantidad_fechas)
                       VALUES (%s, %s, %s, %s, 1)""",
                    (tarjeta["ci_jugador"], tarjeta["id_torneo"],
                     motivo, registro["numero_fecha"] + 1)
                )
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()