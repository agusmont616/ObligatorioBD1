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