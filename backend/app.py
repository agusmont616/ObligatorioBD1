import os
import hashlib
from functools import wraps
from flask import Flask, request, session
import mysql.connector
import consultas


app = Flask(__name__)
# Clave para firmar la cookie de sesión (que nadie pueda falsificar su rol)
app.secret_key = os.getenv("SECRET_KEY", "clave-de-desarrollo")


# Protege una ruta: solo pueden entrar los usuarios logueados con alguno de esos roles
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


# Si MySQL rechaza algo (CHECK, FK, UNIQUE...) se devuelve un 400 en vez de romper el servidor
@app.errorhandler(mysql.connector.Error)
def error_mysql(error):
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

@app.route("/equipos")
@requiere_rol("administrador", "planillero")
def equipos():
    return consultas.obtener_equipos(session["rol"])

@app.route("/jugadores")
@requiere_rol("administrador", "planillero")
def jugadores():
    return consultas.obtener_jugadores(session["rol"])
