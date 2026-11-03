from db import get_conn


def obtener_torneos():
    conexion = get_conn("administrador")
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM torneo;")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_torneo_por_id(id_torneo):
    conexion = get_conn("administrador")
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM torneo WHERE id_torneo = %s",
        (id_torneo,)
    )
    resultado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return resultado

def crear_torneo(nombre, anio, semestre, fecha_inicio, fecha_fin, estado):
    conexion = get_conn("administrador")
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

def obtener_equipos():
    conexion = get_conn("administrador")
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM equipo;")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado

def obtener_jugadores():
    conexion = get_conn("administrador")
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM jugador;")
    resultado = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resultado
