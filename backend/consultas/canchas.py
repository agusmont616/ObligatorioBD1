from db import get_conn


def obtener_complejos(rol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM complejo")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def crear_complejo(rol, nombre, direccion, departamento):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """INSERT INTO complejo (nombre, direccion, departamento)
        VALUES (%s, %s, %s)""",
        (nombre, direccion, departamento)
    )
    conexion.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conexion.close()
    return nuevo_id

def modificar_complejo(rol, id_complejo, nombre, direccion, departamento):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """UPDATE complejo
        SET nombre = %s, direccion = %s, departamento = %s
        WHERE id_complejo = %s""",
        (nombre, direccion, departamento, id_complejo)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def borrar_complejo(rol, id_complejo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "DELETE FROM complejo WHERE id_complejo = %s",
        (id_complejo,)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def obtener_canchas(rol):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM cancha ORDER BY id_complejo, nombre_cancha"
    )
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def crear_cancha(rol, nombre_cancha, id_complejo, superficie, techada):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """INSERT INTO cancha
           (nombre_cancha, id_complejo, superficie, techada)
           VALUES (%s, %s, %s, %s)""",
        (nombre_cancha, id_complejo, superficie, techada)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def modificar_cancha(rol, nombre_cancha, id_complejo, superficie, techada):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """UPDATE cancha
           SET superficie = %s, techada = %s
           WHERE nombre_cancha = %s AND id_complejo = %s""",
        (superficie, techada, nombre_cancha, id_complejo)
    )
    conexion.commit()
    cursor.close()
    conexion.close()

def borrar_cancha(rol, nombre_cancha, id_complejo):
    conexion = get_conn(rol)
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """DELETE FROM cancha
           WHERE nombre_cancha = %s AND id_complejo = %s""",
        (nombre_cancha, id_complejo)
    )
    conexion.commit()
    cursor.close()
    conexion.close()