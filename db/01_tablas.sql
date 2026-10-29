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
