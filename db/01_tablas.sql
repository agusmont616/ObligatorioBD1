DROP DATABASE IF EXISTS torneo;
CREATE DATABASE torneo;
USE torneo;


CREATE TABLE facultad (
   id_facultad INT AUTO_INCREMENT,
   nombre VARCHAR(30) NOT NULL,
   PRIMARY KEY (id_facultad),
   UNIQUE (nombre)
);

CREATE TABLE login (
   correo VARCHAR(50),
   contrasena VARCHAR(30) NOT NULL,
   rol ENUM('administrador', 'planillero') NOT NULL,
   PRIMARY KEY (correo)
);

CREATE TABLE turno (
   id_turno INT AUTO_INCREMENT,
   hora_inicio TIME NOT NULL,
   hora_fin TIME NOT NULL,
   PRIMARY KEY (id_turno),
   UNIQUE (hora_inicio, hora_fin)
);

CREATE TABLE complejo (
   id_complejo INT AUTO_INCREMENT,
   nombre VARCHAR(30) NOT NULL,
   direccion VARCHAR(30) NOT NULL,
   departamento VARCHAR(30) NOT NULL,
   PRIMARY KEY (id_complejo),
   UNIQUE (nombre, departamento)
);

CREATE TABLE torneo (
   id_torneo INT AUTO_INCREMENT,
   nombre VARCHAR(50) NOT NULL,
   anio SMALLINT NOT NULL,
   semestre SMALLINT NOT NULL,
   fecha_inicio DATE NOT NULL,
   fecha_fin DATE NOT NULL,
   estado ENUM('inscripcion', 'en curso', 'finalizado') NOT NULL,
   PRIMARY KEY (id_torneo),
   UNIQUE (nombre, anio, semestre)
);

CREATE TABLE jugador (
   ci VARCHAR(8),
   nombre VARCHAR(30) NOT NULL,
   apellido VARCHAR(30) NOT NULL,
   email VARCHAR(50) NOT NULL,
   fecha_nacimiento DATE NOT NULL,
   id_facultad INT NOT NULL,
   tipo ENUM('grado', 'posgrado', 'docente', 'funcionario') NOT NULL,
   PRIMARY KEY (ci),
   UNIQUE (email),
   FOREIGN KEY (id_facultad) REFERENCES facultad(id_facultad)
);

CREATE TABLE cancha (
   nombre_cancha VARCHAR(30),
   id_complejo INT,
   superficie ENUM('sintetico', 'parquet') NOT NULL,
   techada BOOLEAN NOT NULL,
   PRIMARY KEY (nombre_cancha, id_complejo),
   FOREIGN KEY (id_complejo) REFERENCES complejo(id_complejo)
);

CREATE TABLE equipo (
   id_equipo INT AUTO_INCREMENT,
   nombre VARCHAR(40) NOT NULL,
   id_torneo INT NOT NULL,
   id_facultad INT NOT NULL,
   ci_capitan VARCHAR(8) NOT NULL,
   PRIMARY KEY (id_equipo),
   UNIQUE (nombre, id_torneo),
   FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo),
   FOREIGN KEY (id_facultad) REFERENCES facultad(id_facultad),
   FOREIGN KEY (ci_capitan) REFERENCES jugador(ci)
);

CREATE TABLE sancion_jugador (
   id_sancion INT AUTO_INCREMENT,
   ci_jugador VARCHAR(8) NOT NULL,
   id_torneo INT NOT NULL,
   motivo ENUM('roja', 'acumulacion de amarillas', 'disciplinaria') NOT NULL,
   numero_fecha_inicio SMALLINT NOT NULL,
   cantidad_fechas SMALLINT NOT NULL,
   PRIMARY KEY (id_sancion),
   FOREIGN KEY (ci_jugador) REFERENCES jugador(ci),
   FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
);

CREATE TABLE equipo_jugador_torneo (
   id_equipo INT,
   ci_jugador VARCHAR(8),
   id_torneo INT,
   numero_camiseta SMALLINT NOT NULL,
   PRIMARY KEY (id_equipo, ci_jugador, id_torneo),
   UNIQUE (ci_jugador, id_torneo),
   UNIQUE (id_equipo, numero_camiseta),
   FOREIGN KEY (id_equipo) REFERENCES equipo(id_equipo),
   FOREIGN KEY (ci_jugador) REFERENCES jugador(ci),
   FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
);

CREATE TABLE partido (
   id_partido INT AUTO_INCREMENT,
   id_torneo INT NOT NULL,
   numero_fecha SMALLINT NOT NULL,
   id_equipo_local INT NOT NULL,
   id_equipo_visitante INT NOT NULL,
   dia DATE NOT NULL,
   id_turno INT NOT NULL,
   nombre_cancha VARCHAR(30) NOT NULL,
   id_complejo INT NOT NULL,
   estado ENUM('programado', 'jugado', 'postergado', 'cancelado') NOT NULL,
   PRIMARY KEY (id_partido),
   UNIQUE (dia, id_turno, nombre_cancha, id_complejo),
   CHECK (id_equipo_local <> id_equipo_visitante),
   FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo),
   FOREIGN KEY (id_equipo_local) REFERENCES equipo(id_equipo),
   FOREIGN KEY (id_equipo_visitante) REFERENCES equipo(id_equipo),
   FOREIGN KEY (id_turno) REFERENCES turno(id_turno),
   FOREIGN KEY (nombre_cancha, id_complejo) REFERENCES cancha(nombre_cancha, id_complejo)
);

CREATE TABLE planilla_partido (
   id_partido INT,
   ci_jugador VARCHAR(8),
   id_equipo INT NOT NULL,
   PRIMARY KEY (id_partido, ci_jugador),
   FOREIGN KEY (id_partido) REFERENCES partido(id_partido),
   FOREIGN KEY (ci_jugador) REFERENCES jugador(ci),
   FOREIGN KEY (id_equipo) REFERENCES equipo(id_equipo)
);

CREATE TABLE gol (
   id_gol INT AUTO_INCREMENT,
   id_partido INT NOT NULL,
   ci_jugador VARCHAR(8) NOT NULL,
   minuto SMALLINT NOT NULL,
   autogol BOOLEAN NOT NULL,
   PRIMARY KEY (id_gol),
   FOREIGN KEY (id_partido, ci_jugador) REFERENCES planilla_partido(id_partido, ci_jugador)
);

CREATE TABLE tarjeta (
   id_tarjeta INT AUTO_INCREMENT,
   id_partido INT NOT NULL,
   ci_jugador VARCHAR(8) NOT NULL,
   minuto SMALLINT NOT NULL,
   color ENUM('amarilla', 'roja') NOT NULL,
   PRIMARY KEY (id_tarjeta),
   FOREIGN KEY (id_partido, ci_jugador) REFERENCES planilla_partido(id_partido, ci_jugador)
);
