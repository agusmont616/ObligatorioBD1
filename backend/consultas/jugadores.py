from db import get_conn


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