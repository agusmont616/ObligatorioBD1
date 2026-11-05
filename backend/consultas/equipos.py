from db import get_conn


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

def borrar_equipo(rol, id_equipo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "DELETE FROM equipo WHERE id_equipo = %s",
        (id_equipo,)
    )
    conexion.commit()
    cursor.close()
    conexion.close()