from db import get_conn


def obtener_usuario(correo):
    conexion = get_conn("auth")
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT correo, contrasena, rol FROM login WHERE correo = %s",
        (correo,)
    )
    resultado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return resultado

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

def crear_equipo(rol, nombre, id_torneo, id_facultad, ci_capitan):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """INSERT INTO equipo
        (nombre, id_torneo, id_facultad, ci_capitan)
        VALUES ( %s, %s, %s, %s)""",
        (nombre, id_torneo, id_facultad, ci_capitan)
    )
    conexion.commit()
    nuevo_id= cursor.lastrowid
    cursor.close()
    conexion.close()
    return nuevo_id

def obtener_equipos_por_torneo(rol, id_torneo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM equipo WHERE id_torneo = %s",
        (id_torneo,)
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_equipos(rol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM equipo;")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_jugadores(rol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM jugador;")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_jugador(rol, ci):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM jugador WHERE ci = %s",
        (ci,)
    )
    resultado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return resultado

def crear_jugador(rol, ci, nombre, apellido, email, fecha_nacimiento, id_facultad, tipo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """INSERT INTO jugador
        (ci, nombre, apellido, email, fecha_nacimiento, id_facultad, tipo)
        VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (ci, nombre, apellido, email, fecha_nacimiento, id_facultad, tipo)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def modificar_jugador(rol, ci, nombre, apellido, email, fecha_nacimiento, id_facultad, tipo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """UPDATE jugador
        SET nombre = %s, apellido = %s, email = %s, fecha_nacimiento = %s, id_facultad = %s, tipo = %s
        WHERE ci = %s""",
        (nombre, apellido, email, fecha_nacimiento, id_facultad, tipo, ci)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def borrar_jugador(rol, ci):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "DELETE FROM jugador WHERE ci = %s",
        (ci,)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def modificar_equipo(rol, id_equipo, nombre, id_facultad, ci_capitan):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """UPDATE equipo
        SET nombre = %s, id_facultad = %s, ci_capitan = %s  
        WHERE id_equipo = %s""",
        (nombre, id_facultad, ci_capitan, id_equipo)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def obtener_jugadores_equipo(rol, id_equipo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT j.*, i.numero_camiseta
        FROM jugador j
        INNER JOIN equipo_jugador_torneo i
            ON j.ci = i.ci_jugador
        WHERE i.id_equipo = %s""",
        (id_equipo,) )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def inscribir_jugador_equipo(rol, id_equipo, ci_jugador, id_torneo, numero_camiseta):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        """INSERT INTO equipo_jugador_torneo
        (id_equipo, ci_jugador, id_torneo, numero_camiseta)
        VALUES (%s, %s, %s, %s)""",
        (id_equipo, ci_jugador, id_torneo, numero_camiseta)
    )

    conexion.commit()
    cursor.close()
    conexion.close()

def quitar_jugador_equipo(rol, id_equipo, ci_jugador):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        """DELETE FROM equipo_jugador_torneo
        WHERE id_equipo = %s AND ci_jugador = %s""",
        (id_equipo, ci_jugador)
    )

    conexion.commit()
    cursor.close()
    conexion.close()

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

def obtener_partidos_por_cancha(rol, id_cancha):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        """SELECT *
        FROM partido
        WHERE id_cancha = %s""",
        (id_cancha,)
    )

    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado