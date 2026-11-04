import os
import re
import hashlib
from datetime import date, timedelta
from functools import wraps
from flask import Flask, request, session
from flask.json.provider import DefaultJSONProvider
import mysql.connector
import consultas


# fechas y horas como texto ('2003-04-12', '18:00:00')
class JSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, (date, timedelta)):
            return str(o)
        return super().default(o)


app = Flask(__name__)
app.json = JSONProvider(app)
app.secret_key = os.getenv("SECRET_KEY", "clave-de-desarrollo")


# solo entran los usuarios logueados con alguno de esos roles
def requiere_rol(*roles):
    def decorador(funcion):
        @wraps(funcion)
        def envoltura(*args, **kwargs):
            if "rol" not in session:
                return {"error": "Tenés que iniciar sesión"}, 401
            if session["rol"] not in roles:
                return {"error": "No tenés permiso para esta acción"}, 403
            return funcion(*args, **kwargs)
        return envoltura
    return decorador


# errores de la base (check, fk, unique...)
@app.errorhandler(mysql.connector.Error)
def error_mysql(error):
    if error.errno == 1062:
        return {"error": "Ya existe un registro con esos datos"}, 400
    if error.errno == 1451:
        return {"error": "No se puede borrar porque tiene datos asociados"}, 400
    if error.errno == 1452:
        return {"error": "Hace referencia a un dato que no existe"}, 400
    return {"error": error.msg}, 400


@app.route("/login", methods=["POST"])
def login():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict) or "correo" not in datos or "contrasena" not in datos:
        return {"error": "Faltan el correo o la contraseña"}, 400

    usuario = consultas.obtener_usuario(datos["correo"])
    hash_ingresado = hashlib.sha256(datos["contrasena"].encode()).hexdigest()
    if usuario is None or usuario["contrasena"] != hash_ingresado:
        return {"error": "Correo o contraseña incorrectos"}, 401

    session["correo"] = usuario["correo"]
    session["rol"] = usuario["rol"]
    return {"correo": usuario["correo"], "rol": usuario["rol"]}

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return {"mensaje": "Sesión cerrada"}


# torneos

@app.route("/torneos")
@requiere_rol("administrador", "planillero")
def torneos():
    return consultas.obtener_torneos(session["rol"])

@app.route("/torneos/<int:id_torneo>")
@requiere_rol("administrador", "planillero")
def torneos_id(id_torneo):
    torneo= consultas.obtener_torneo_por_id(session["rol"], id_torneo)
    if torneo is None:
        return {"error" : "Torneo no encontrado"}, 404

    return torneo

@app.route("/torneos", methods=["POST"])
@requiere_rol("administrador")
def crear_torneo():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return {"error": "Debes enviar un JSON válido"}, 400
    campos = ["nombre", "anio", "semestre", "fecha_inicio", "fecha_fin", "estado"]
    for campo in campos:
        if campo not in datos:
            return{"error": f"Falta el campo {campo}"}, 400

    nuevo_id = consultas.crear_torneo(
        session["rol"],
        datos["nombre"],
        datos["anio"],
        datos["semestre"],
        datos["fecha_inicio"],
        datos["fecha_fin"],
        datos["estado"]
    )
    return {"id_torneo": nuevo_id}, 201


# equipos

@app.route("/equipos")
@requiere_rol("administrador", "planillero")
def equipos():
    return consultas.obtener_equipos(session["rol"])


# jugadores

def validar_jugador(datos):
    campos = ["ci", "nombre", "apellido", "email", "fecha_nacimiento", "id_facultad", "tipo"]
    for campo in campos:
        if campo not in datos or datos[campo] in ("", None):
            return f"Falta el campo {campo}"

    if not re.fullmatch(r"\d{7,8}", str(datos["ci"])):
        return "La cédula tiene que tener 7 u 8 números"
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", datos["email"]):
        return "El email no es válido"
    if datos["tipo"] not in ("grado", "posgrado", "docente", "funcionario"):
        return "El tipo tiene que ser grado, posgrado, docente o funcionario"

    try:
        fecha = date.fromisoformat(datos["fecha_nacimiento"])
    except (ValueError, TypeError):
        return "La fecha de nacimiento tiene que ser AAAA-MM-DD"
    if fecha >= date.today():
        return "La fecha de nacimiento tiene que ser anterior a hoy"

    return None

@app.route("/jugadores")
@requiere_rol("administrador", "planillero")
def jugadores():
    return consultas.obtener_jugadores(session["rol"])

@app.route("/jugadores/<ci>")
@requiere_rol("administrador", "planillero")
def jugador_ci(ci):
    jugador = consultas.obtener_jugador(session["rol"], ci)
    if jugador is None:
        return {"error": "Jugador no encontrado"}, 404
    return jugador

@app.route("/jugadores", methods=["POST"])
@requiere_rol("administrador")
def crear_jugador():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return {"error": "Debes enviar un JSON válido"}, 400
    error = validar_jugador(datos)
    if error:
        return {"error": error}, 400

    consultas.crear_jugador(
        session["rol"],
        datos["ci"],
        datos["nombre"],
        datos["apellido"],
        datos["email"],
        datos["fecha_nacimiento"],
        datos["id_facultad"],
        datos["tipo"]
    )
    return {"ci": datos["ci"]}, 201

@app.route("/jugadores/<ci>", methods=["PUT"])
@requiere_rol("administrador")
def modificar_jugador(ci):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return {"error": "Debes enviar un JSON válido"}, 400
    # la ci no se cambia, se toma de la url
    datos["ci"] = ci
    error = validar_jugador(datos)
    if error:
        return {"error": error}, 400
    if consultas.obtener_jugador(session["rol"], ci) is None:
        return {"error": "Jugador no encontrado"}, 404

    consultas.modificar_jugador(
        session["rol"],
        ci,
        datos["nombre"],
        datos["apellido"],
        datos["email"],
        datos["fecha_nacimiento"],
        datos["id_facultad"],
        datos["tipo"]
    )
    return {"ci": ci}

@app.route("/jugadores/<ci>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_jugador(ci):
    if consultas.obtener_jugador(session["rol"], ci) is None:
        return {"error": "Jugador no encontrado"}, 404

    consultas.borrar_jugador(session["rol"], ci)
    return {"mensaje": "Jugador eliminado"}
