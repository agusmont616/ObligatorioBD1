import os
import re
import hashlib
from datetime import date, datetime, timedelta
from decimal import Decimal
from functools import wraps
from flask import Flask, request, session
from flask.json.provider import DefaultJSONProvider
import mysql.connector
import consultas


# fechas y horas como texto ('2003-04-12', '18:00:00') y decimales como numero
class JSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, (date, datetime, timedelta)):
            return str(o)
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


app = Flask(__name__)
app.json = JSONProvider(app)
app.secret_key = os.getenv("SECRET_KEY", "clave-de-desarrollo")

TODOS = ("administrador", "planillero")


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

# las reglas de negocio de consultas tiran ValueError con el mensaje
@app.errorhandler(ValueError)
def error_regla(error):
    return {"error": str(error)}, 400


def rol():
    return session["rol"]

def leer_json():
    datos = request.get_json(silent=True)
    return datos if isinstance(datos, dict) else None

def falta_campo(datos, campos):
    for campo in campos:
        if campo not in datos or datos[campo] in ("", None):
            return f"Falta el campo {campo}"
    return None

def id_torneo_param():
    return request.args.get("id_torneo", type=int)

def torneo_en_inscripcion(id_torneo):
    torneo = consultas.obtener_torneo_por_id(rol(), id_torneo)
    if torneo is None:
        return "El torneo no existe"
    if torneo["estado"] != "inscripcion":
        return "Los planteles solo se pueden modificar con el torneo en inscripción"
    return None


# sesion

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

# para que el front sepa quien esta logueado
@app.route("/sesion")
def sesion():
    if "rol" not in session:
        return {"error": "No hay sesión"}, 401
    return {"correo": session["correo"], "rol": session["rol"]}


# configuracion: facultades, turnos y usuarios

@app.route("/facultades")
@requiere_rol(*TODOS)
def facultades():
    return consultas.obtener_facultades(rol())

@app.route("/facultades", methods=["POST"])
@requiere_rol("administrador")
def crear_facultad():
    datos = leer_json()
    if datos is None or not datos.get("nombre"):
        return {"error": "Falta el nombre"}, 400
    return {"id_facultad": consultas.crear_facultad(rol(), datos["nombre"])}, 201

@app.route("/turnos")
@requiere_rol(*TODOS)
def turnos():
    return consultas.obtener_turnos(rol())

@app.route("/usuarios")
@requiere_rol("administrador")
def usuarios():
    return consultas.obtener_usuarios(rol())

@app.route("/usuarios", methods=["POST"])
@requiere_rol("administrador")
def crear_usuario():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["correo", "contrasena", "rol"])
    if error:
        return {"error": error}, 400
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", datos["correo"]):
        return {"error": "El correo no es válido"}, 400
    if datos["rol"] not in TODOS:
        return {"error": "El rol tiene que ser administrador o planillero"}, 400
    if len(datos["contrasena"]) < 6:
        return {"error": "La contraseña tiene que tener al menos 6 caracteres"}, 400

    contrasena_hash = hashlib.sha256(datos["contrasena"].encode()).hexdigest()
    consultas.crear_usuario(rol(), datos["correo"], contrasena_hash, datos["rol"])
    return {"correo": datos["correo"]}, 201

@app.route("/usuarios/<correo>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_usuario(correo):
    if correo == session["correo"]:
        return {"error": "No podés borrar tu propio usuario"}, 400
    consultas.borrar_usuario(rol(), correo)
    return {"mensaje": "Usuario eliminado"}


# torneos

@app.route("/torneos")
@requiere_rol(*TODOS)
def torneos():
    return consultas.obtener_torneos(rol())

@app.route("/torneos/<int:id_torneo>")
@requiere_rol(*TODOS)
def torneos_id(id_torneo):
    torneo = consultas.obtener_torneo_por_id(rol(), id_torneo)
    if torneo is None:
        return {"error": "Torneo no encontrado"}, 404
    return torneo

@app.route("/torneos", methods=["POST"])
@requiere_rol("administrador")
def crear_torneo():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["nombre", "anio", "semestre", "fecha_inicio", "fecha_fin"])
    if error:
        return {"error": error}, 400
    if str(datos["semestre"]) not in ("1", "2"):
        return {"error": "El semestre tiene que ser 1 o 2"}, 400
    if datos["fecha_fin"] < datos["fecha_inicio"]:
        return {"error": "La fecha de fin tiene que ser posterior a la de inicio"}, 400

    # una edicion nueva siempre arranca en inscripcion
    nuevo_id = consultas.crear_torneo(rol(), datos["nombre"], datos["anio"], datos["semestre"],
                                      datos["fecha_inicio"], datos["fecha_fin"], "inscripcion")
    return {"id_torneo": nuevo_id}, 201

@app.route("/torneos/<int:id_torneo>/estado", methods=["PUT"])
@requiere_rol("administrador")
def cambiar_estado_torneo(id_torneo):
    datos = leer_json()
    if datos is None or "estado" not in datos:
        return {"error": "Falta el estado"}, 400
    consultas.cambiar_estado_torneo(rol(), id_torneo, datos["estado"])
    return {"id_torneo": id_torneo, "estado": datos["estado"]}


# equipos

@app.route("/equipos")
@requiere_rol(*TODOS)
def equipos():
    id_torneo = id_torneo_param()
    if id_torneo:
        return consultas.equipos_detalle(rol(), id_torneo)
    return consultas.obtener_equipos(rol())

@app.route("/equipos/<int:id_equipo>")
@requiere_rol(*TODOS)
def equipo_id(id_equipo):
    equipo = consultas.obtener_equipo(rol(), id_equipo)
    if equipo is None:
        return {"error": "Equipo no encontrado"}, 404
    return equipo

# el capitan entra al plantel junto con el equipo
@app.route("/equipos", methods=["POST"])
@requiere_rol("administrador")
def crear_equipo():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["nombre", "id_torneo", "id_facultad", "ci_capitan", "numero_camiseta"])
    if error:
        return {"error": error}, 400

    error = torneo_en_inscripcion(datos["id_torneo"])
    if error:
        return {"error": error}, 400
    capitan = consultas.obtener_jugador(rol(), datos["ci_capitan"])
    if capitan is None:
        return {"error": "El capitán no existe"}, 400
    if capitan["id_facultad"] != int(datos["id_facultad"]):
        return {"error": "El capitán tiene que ser de la facultad del equipo"}, 400
    if consultas.equipo_del_jugador(rol(), capitan["ci"], datos["id_torneo"]):
        return {"error": "El capitán ya está en otro equipo de este torneo"}, 400
    if not 1 <= int(datos["numero_camiseta"]) <= 99:
        return {"error": "El número de camiseta tiene que estar entre 1 y 99"}, 400

    nuevo_id = consultas.crear_equipo(rol(), datos["nombre"], datos["id_torneo"],
                                      datos["id_facultad"], capitan["ci"])
    try:
        consultas.inscribir_jugador_equipo(rol(), nuevo_id, capitan["ci"], datos["id_torneo"],
                                           datos["numero_camiseta"])
    except Exception:
        consultas.borrar_equipo(rol(), nuevo_id)
        raise
    return {"id_equipo": nuevo_id}, 201

# se puede cambiar el nombre y el capitan (la facultad no, el plantel depende de ella)
@app.route("/equipos/<int:id_equipo>", methods=["PUT"])
@requiere_rol("administrador")
def modificar_equipo(id_equipo):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["nombre", "ci_capitan"])
    if error:
        return {"error": error}, 400
    equipo = consultas.obtener_equipo(rol(), id_equipo)
    if equipo is None:
        return {"error": "Equipo no encontrado"}, 404
    if consultas.equipo_del_jugador(rol(), datos["ci_capitan"], equipo["id_torneo"]) != id_equipo:
        return {"error": "El capitán tiene que ser un jugador del plantel"}, 400

    consultas.modificar_equipo(rol(), id_equipo, datos["nombre"], equipo["id_facultad"], datos["ci_capitan"])
    return {"id_equipo": id_equipo}

@app.route("/equipos/<int:id_equipo>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_equipo(id_equipo):
    equipo = consultas.obtener_equipo(rol(), id_equipo)
    if equipo is None:
        return {"error": "Equipo no encontrado"}, 404
    error = torneo_en_inscripcion(equipo["id_torneo"])
    if error:
        return {"error": error}, 400

    for jugador in consultas.obtener_jugadores_equipo(rol(), id_equipo):
        consultas.quitar_jugador_equipo(rol(), id_equipo, jugador["ci"])
    consultas.borrar_equipo(rol(), id_equipo)
    return {"mensaje": "Equipo eliminado"}


# planteles

@app.route("/equipos/<int:id_equipo>/jugadores")
@requiere_rol(*TODOS)
def plantel(id_equipo):
    return consultas.obtener_jugadores_equipo(rol(), id_equipo)

@app.route("/equipos/<int:id_equipo>/jugadores", methods=["POST"])
@requiere_rol("administrador")
def agregar_al_plantel(id_equipo):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["ci_jugador", "numero_camiseta"])
    if error:
        return {"error": error}, 400

    equipo = consultas.obtener_equipo(rol(), id_equipo)
    if equipo is None:
        return {"error": "Equipo no encontrado"}, 404
    error = torneo_en_inscripcion(equipo["id_torneo"])
    if error:
        return {"error": error}, 400
    jugador = consultas.obtener_jugador(rol(), datos["ci_jugador"])
    if jugador is None:
        return {"error": "El jugador no existe"}, 400
    if jugador["id_facultad"] != equipo["id_facultad"]:
        return {"error": "El jugador tiene que ser de la facultad del equipo"}, 400
    if consultas.equipo_del_jugador(rol(), jugador["ci"], equipo["id_torneo"]):
        return {"error": "El jugador ya está en un equipo de este torneo"}, 400

    plantel = consultas.obtener_jugadores_equipo(rol(), id_equipo)
    if len(plantel) >= 10:
        return {"error": "El plantel ya tiene 10 jugadores"}, 400
    docentes = [j for j in plantel if j["tipo"] in ("docente", "funcionario")]
    if jugador["tipo"] in ("docente", "funcionario") and len(docentes) >= 2:
        return {"error": "El plantel ya tiene 2 docentes o funcionarios"}, 400
    if not 1 <= int(datos["numero_camiseta"]) <= 99:
        return {"error": "El número de camiseta tiene que estar entre 1 y 99"}, 400

    consultas.inscribir_jugador_equipo(rol(), id_equipo, jugador["ci"], equipo["id_torneo"],
                                       datos["numero_camiseta"])
    return {"mensaje": "Jugador agregado al plantel"}, 201

@app.route("/equipos/<int:id_equipo>/jugadores/<ci>", methods=["DELETE"])
@requiere_rol("administrador")
def quitar_del_plantel(id_equipo, ci):
    equipo = consultas.obtener_equipo(rol(), id_equipo)
    if equipo is None:
        return {"error": "Equipo no encontrado"}, 404
    error = torneo_en_inscripcion(equipo["id_torneo"])
    if error:
        return {"error": error}, 400
    if equipo["ci_capitan"] == ci:
        return {"error": "Es el capitán: primero elegí otro capitán"}, 400

    consultas.quitar_jugador_equipo(rol(), id_equipo, ci)
    return {"mensaje": "Jugador quitado del plantel"}


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

# con ?id_torneo= trae tambien la facultad y el equipo de ese torneo
@app.route("/jugadores")
@requiere_rol(*TODOS)
def jugadores():
    id_torneo = id_torneo_param()
    if id_torneo:
        return consultas.jugadores_detalle(rol(), id_torneo)
    return consultas.obtener_jugadores(rol())

@app.route("/jugadores/<ci>")
@requiere_rol(*TODOS)
def jugador_ci(ci):
    jugador = consultas.obtener_jugador(rol(), ci)
    if jugador is None:
        return {"error": "Jugador no encontrado"}, 404
    return jugador

@app.route("/jugadores", methods=["POST"])
@requiere_rol("administrador")
def crear_jugador():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = validar_jugador(datos)
    if error:
        return {"error": error}, 400

    consultas.crear_jugador(rol(), datos["ci"], datos["nombre"], datos["apellido"], datos["email"],
                            datos["fecha_nacimiento"], datos["id_facultad"], datos["tipo"])
    return {"ci": datos["ci"]}, 201

@app.route("/jugadores/<ci>", methods=["PUT"])
@requiere_rol("administrador")
def modificar_jugador(ci):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    # la ci no se cambia, se toma de la url
    datos["ci"] = ci
    error = validar_jugador(datos)
    if error:
        return {"error": error}, 400
    if consultas.obtener_jugador(rol(), ci) is None:
        return {"error": "Jugador no encontrado"}, 404

    consultas.modificar_jugador(rol(), ci, datos["nombre"], datos["apellido"], datos["email"],
                                datos["fecha_nacimiento"], datos["id_facultad"], datos["tipo"])
    return {"ci": ci}

@app.route("/jugadores/<ci>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_jugador(ci):
    if consultas.obtener_jugador(rol(), ci) is None:
        return {"error": "Jugador no encontrado"}, 404

    consultas.borrar_jugador(rol(), ci)
    return {"mensaje": "Jugador eliminado"}


# complejos y canchas

def validar_complejo(datos):
    return falta_campo(datos, ["nombre", "direccion", "departamento"])

@app.route("/complejos")
@requiere_rol(*TODOS)
def complejos():
    return consultas.obtener_complejos(rol())

@app.route("/complejos", methods=["POST"])
@requiere_rol("administrador")
def crear_complejo():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = validar_complejo(datos)
    if error:
        return {"error": error}, 400
    nuevo_id = consultas.crear_complejo(rol(), datos["nombre"], datos["direccion"], datos["departamento"])
    return {"id_complejo": nuevo_id}, 201

@app.route("/complejos/<int:id_complejo>", methods=["PUT"])
@requiere_rol("administrador")
def modificar_complejo(id_complejo):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = validar_complejo(datos)
    if error:
        return {"error": error}, 400
    consultas.modificar_complejo(rol(), id_complejo, datos["nombre"], datos["direccion"], datos["departamento"])
    return {"id_complejo": id_complejo}

@app.route("/complejos/<int:id_complejo>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_complejo(id_complejo):
    consultas.borrar_complejo(rol(), id_complejo)
    return {"mensaje": "Complejo eliminado"}

def validar_cancha(datos):
    error = falta_campo(datos, ["superficie"])
    if error:
        return error
    if datos["superficie"] not in ("sintetico", "parquet"):
        return "La superficie tiene que ser sintetico o parquet"
    if not isinstance(datos.get("techada"), bool):
        return "Falta indicar si es techada"
    return None

@app.route("/canchas")
@requiere_rol(*TODOS)
def canchas():
    return consultas.obtener_canchas(rol())

@app.route("/canchas", methods=["POST"])
@requiere_rol("administrador")
def crear_cancha():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["nombre_cancha", "id_complejo"]) or validar_cancha(datos)
    if error:
        return {"error": error}, 400
    consultas.crear_cancha(rol(), datos["nombre_cancha"], datos["id_complejo"],
                           datos["superficie"], datos["techada"])
    return {"nombre_cancha": datos["nombre_cancha"]}, 201

@app.route("/canchas/<int:id_complejo>/<nombre_cancha>", methods=["PUT"])
@requiere_rol("administrador")
def modificar_cancha(id_complejo, nombre_cancha):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = validar_cancha(datos)
    if error:
        return {"error": error}, 400
    consultas.modificar_cancha(rol(), nombre_cancha, id_complejo, datos["superficie"], datos["techada"])
    return {"nombre_cancha": nombre_cancha}

@app.route("/canchas/<int:id_complejo>/<nombre_cancha>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_cancha(id_complejo, nombre_cancha):
    consultas.borrar_cancha(rol(), nombre_cancha, id_complejo)
    return {"mensaje": "Cancha eliminada"}


# partidos

CAMPOS_PARTIDO = ["id_torneo", "numero_fecha", "id_equipo_local", "id_equipo_visitante",
                  "dia", "id_turno", "nombre_cancha", "id_complejo"]

@app.route("/partidos")
@requiere_rol(*TODOS)
def partidos():
    id_torneo = id_torneo_param()
    if id_torneo is None:
        return {"error": "Falta el parámetro id_torneo"}, 400
    return consultas.partidos_detalle(rol(), id_torneo)

@app.route("/partidos/<int:id_partido>")
@requiere_rol(*TODOS)
def partido_id(id_partido):
    partido = consultas.partido_detalle(rol(), id_partido)
    if partido is None:
        return {"error": "Partido no encontrado"}, 404
    return partido

# canchas y turnos ocupados en un dia (para programar partidos)
@app.route("/ocupacion")
@requiere_rol(*TODOS)
def ocupacion():
    dia = request.args.get("dia")
    if not dia:
        return {"error": "Falta el parámetro dia"}, 400
    return consultas.partidos_del_dia(rol(), dia)

@app.route("/partidos", methods=["POST"])
@requiere_rol("administrador")
def crear_partido():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, CAMPOS_PARTIDO)
    if error:
        return {"error": error}, 400
    nuevo_id = consultas.crear_partido(rol(), *[datos[c] for c in CAMPOS_PARTIDO])
    return {"id_partido": nuevo_id}, 201

@app.route("/partidos/<int:id_partido>", methods=["PUT"])
@requiere_rol("administrador")
def modificar_partido(id_partido):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, CAMPOS_PARTIDO)
    if error:
        return {"error": error}, 400
    consultas.modificar_partido(rol(), id_partido, *[datos[c] for c in CAMPOS_PARTIDO])
    return {"id_partido": id_partido}

# el planillero solo puede pasarlo a jugado (lo controla consultas)
@app.route("/partidos/<int:id_partido>/estado", methods=["PUT"])
@requiere_rol(*TODOS)
def cambiar_estado_partido(id_partido):
    datos = leer_json()
    if datos is None or "estado" not in datos:
        return {"error": "Falta el estado"}, 400
    consultas.cambiar_estado_partido(rol(), id_partido, datos["estado"])
    return {"id_partido": id_partido, "estado": datos["estado"]}

@app.route("/partidos/<int:id_partido>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_partido(id_partido):
    consultas.borrar_partido(rol(), id_partido)
    return {"mensaje": "Partido eliminado"}


# planilla, goles y tarjetas

@app.route("/partidos/<int:id_partido>/planilla")
@requiere_rol(*TODOS)
def planilla(id_partido):
    return consultas.planilla_detalle(rol(), id_partido)

@app.route("/partidos/<int:id_partido>/planilla", methods=["POST"])
@requiere_rol(*TODOS)
def agregar_a_planilla(id_partido):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["ci_jugador", "id_equipo"])
    if error:
        return {"error": error}, 400
    consultas.agregar_jugador_planilla(rol(), id_partido, datos["ci_jugador"], int(datos["id_equipo"]))
    return {"mensaje": "Jugador agregado a la planilla"}, 201

@app.route("/partidos/<int:id_partido>/planilla/<ci>", methods=["DELETE"])
@requiere_rol(*TODOS)
def quitar_de_planilla(id_partido, ci):
    consultas.quitar_jugador_planilla(rol(), id_partido, ci)
    return {"mensaje": "Jugador quitado de la planilla"}

@app.route("/partidos/<int:id_partido>/goles")
@requiere_rol(*TODOS)
def goles(id_partido):
    return consultas.goles_detalle(rol(), id_partido)

@app.route("/partidos/<int:id_partido>/goles", methods=["POST"])
@requiere_rol(*TODOS)
def crear_gol(id_partido):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["ci_jugador", "minuto"])
    if error:
        return {"error": error}, 400
    nuevo_id = consultas.registrar_gol(rol(), id_partido, datos["ci_jugador"], datos["minuto"],
                                       bool(datos.get("autogol")))
    return {"id_gol": nuevo_id}, 201

@app.route("/goles/<int:id_gol>", methods=["DELETE"])
@requiere_rol(*TODOS)
def borrar_gol(id_gol):
    consultas.borrar_gol(rol(), id_gol)
    return {"mensaje": "Gol eliminado"}

@app.route("/partidos/<int:id_partido>/tarjetas")
@requiere_rol(*TODOS)
def tarjetas(id_partido):
    return consultas.tarjetas_detalle(rol(), id_partido)

@app.route("/partidos/<int:id_partido>/tarjetas", methods=["POST"])
@requiere_rol(*TODOS)
def crear_tarjeta(id_partido):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, ["ci_jugador", "minuto", "color"])
    if error:
        return {"error": error}, 400
    nuevo_id = consultas.registrar_tarjeta(rol(), id_partido, datos["ci_jugador"], datos["minuto"],
                                           datos["color"])
    return {"id_tarjeta": nuevo_id}, 201

@app.route("/tarjetas/<int:id_tarjeta>", methods=["DELETE"])
@requiere_rol(*TODOS)
def borrar_tarjeta(id_tarjeta):
    consultas.borrar_tarjeta(rol(), id_tarjeta)
    return {"mensaje": "Tarjeta eliminada"}


# sanciones

CAMPOS_SANCION = ["ci_jugador", "id_torneo", "motivo", "numero_fecha_inicio", "cantidad_fechas"]

@app.route("/sanciones")
@requiere_rol(*TODOS)
def sanciones():
    id_torneo = id_torneo_param()
    if id_torneo is None:
        return {"error": "Falta el parámetro id_torneo"}, 400
    return consultas.sanciones_detalle(rol(), id_torneo)

@app.route("/sanciones", methods=["POST"])
@requiere_rol("administrador")
def crear_sancion():
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, CAMPOS_SANCION)
    if error:
        return {"error": error}, 400
    nuevo_id = consultas.crear_sancion(rol(), *[datos[c] for c in CAMPOS_SANCION])
    return {"id_sancion": nuevo_id}, 201

@app.route("/sanciones/<int:id_sancion>", methods=["PUT"])
@requiere_rol("administrador")
def modificar_sancion(id_sancion):
    datos = leer_json()
    if datos is None:
        return {"error": "Debes enviar un JSON válido"}, 400
    error = falta_campo(datos, CAMPOS_SANCION)
    if error:
        return {"error": error}, 400
    consultas.modificar_sancion(rol(), id_sancion, *[datos[c] for c in CAMPOS_SANCION])
    return {"id_sancion": id_sancion}

@app.route("/sanciones/<int:id_sancion>", methods=["DELETE"])
@requiere_rol("administrador")
def borrar_sancion(id_sancion):
    consultas.borrar_sancion(rol(), id_sancion)
    return {"mensaje": "Sanción eliminada"}


# reportes: /reportes/<nombre>?id_torneo=1

REPORTES = {
    "posiciones": consultas.reporte_posiciones,
    "goleadores": consultas.reporte_goleadores,
    "fair-play": consultas.reporte_fair_play,
    "promedio-goles-fecha": consultas.reporte_promedio_goles_fecha,
    "promedio-goles-torneo": consultas.reporte_promedio_goles_torneo,
    "canchas": consultas.reporte_canchas,
    "turnos": consultas.reporte_turnos,
    "sin-planilla": consultas.reporte_sin_planilla,
    "sanciones": consultas.reporte_sanciones,
    "estados": consultas.reporte_estados,
    "tarjetas-jugador": consultas.reporte_tarjetas_jugador,
    "tamano-planteles": consultas.reporte_tamano_planteles,
}

@app.route("/reportes/<nombre>")
@requiere_rol(*TODOS)
def reporte(nombre):
    if nombre == "jugadores-facultad":
        return consultas.reporte_jugadores_facultad(rol())

    id_torneo = id_torneo_param()
    if id_torneo is None:
        return {"error": "Falta el parámetro id_torneo"}, 400

    if nombre == "fixture":
        numero_fecha = request.args.get("numero_fecha", type=int)
        if numero_fecha is None:
            return {"error": "Falta el parámetro numero_fecha"}, 400
        return consultas.reporte_fixture(rol(), id_torneo, numero_fecha)

    if nombre not in REPORTES:
        return {"error": "Reporte no encontrado"}, 404
    return REPORTES[nombre](rol(), id_torneo)
