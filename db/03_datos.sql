USE torneo;
SET NAMES utf8mb4;



-- facultades 
INSERT INTO facultad (id_facultad, nombre) VALUES
(1, 'Ingeniería y Tecnologías'),
(2, 'Ciencias Empresariales'),
(3, 'Derecho'),
(4, 'Ciencias de la Salud'),
(5, 'Ciencias Humanas'),
(6, 'Psicología'),
(7, 'Enfermería');   -- sin equipo en este torneo


-- turnos de 18 a 23, de a una hora
INSERT INTO turno (id_turno, hora_inicio, hora_fin) VALUES
(1, '18:00:00', '19:00:00'),
(2, '19:00:00', '20:00:00'),
(3, '20:00:00', '21:00:00'),
(4, '21:00:00', '22:00:00'),
(5, '22:00:00', '23:00:00');


-- complejos y canchas
INSERT INTO complejo (id_complejo, nombre, direccion, departamento) VALUES
(1, 'Complejo Central', 'Av. 8 de Octubre 2738', 'Montevideo'),
(2, 'Complejo Parque Batlle', 'Av. Dr. Américo Ricaldoni 2410', 'Montevideo'),
(3, 'Complejo Costa', 'Av. Giannattasio km 21', 'Canelones');

INSERT INTO cancha (nombre_cancha, id_complejo, superficie, techada) VALUES
('Cancha 1', 1, 'sintetico', FALSE),
('Cancha 2', 1, 'sintetico', FALSE),
('Cancha A', 2, 'sintetico', FALSE),
('Cancha B', 2, 'parquet', TRUE),
('Cancha Techada', 3, 'parquet', TRUE);


-- torneo 
INSERT INTO torneo (id_torneo, nombre, anio, semestre, fecha_inicio, fecha_fin, estado) VALUES
(1, 'Torneo Interfacultades de Fútbol 5', 2026, 2, '2026-10-05', '2026-11-30', 'en curso');


-- jugadores

INSERT INTO jugador (ci, nombre, apellido, email, fecha_nacimiento, id_facultad, tipo) VALUES
-- Equipo 1 - Ingeniería
('51000001', 'Martín',     'Rodríguez', 'martin.rodriguez@correo.ucu.edu.uy',   '2003-04-12', 1, 'grado'),
('51000002', 'Santiago',   'González',  'santiago.gonzalez@correo.ucu.edu.uy',  '2004-09-03', 1, 'grado'),
('51000003', 'Nicolás',    'Fernández', 'nicolas.fernandez@correo.ucu.edu.uy',  '2002-01-25', 1, 'grado'),
('51000004', 'Matías',     'López',     'matias.lopez@correo.ucu.edu.uy',       '2005-06-17', 1, 'grado'),
('51000005', 'Diego',      'Martínez',  'diego.martinez@correo.ucu.edu.uy',     '2003-11-30', 1, 'grado'),
('51000006', 'Pablo',      'Sosa',      'pablo.sosa@ucu.edu.uy',                '1982-03-08', 1, 'docente'),
('51000007', 'Jorge',      'Pereira',   'jorge.pereira@ucu.edu.uy',             '1979-07-21', 1, 'funcionario'),
-- Equipo 2 - Empresariales
('52000001', 'Federico',   'Silva',     'federico.silva@correo.ucu.edu.uy',     '2002-02-14', 2, 'grado'),
('52000002', 'Agustín',    'Gómez',     'agustin.gomez@correo.ucu.edu.uy',      '2004-05-22', 2, 'grado'),
('52000003', 'Joaquín',    'Díaz',      'joaquin.diaz@correo.ucu.edu.uy',       '2003-08-09', 2, 'grado'),
('52000004', 'Facundo',    'Álvarez',   'facundo.alvarez@correo.ucu.edu.uy',    '2005-01-11', 2, 'grado'),
('52000005', 'Bruno',      'Romero',    'bruno.romero@correo.ucu.edu.uy',       '2004-10-02', 2, 'grado'),
('52000006', 'Lucas',      'Suárez',    'lucas.suarez@correo.ucu.edu.uy',       '1998-12-19', 2, 'posgrado'),
('52000007', 'Gustavo',    'Acosta',    'gustavo.acosta@ucu.edu.uy',            '1985-04-27', 2, 'docente'),
-- Equipo 3 - Derecho
('53000001', 'Tomás',      'Benítez',   'tomas.benitez@correo.ucu.edu.uy',      '2003-03-05', 3, 'grado'),
('53000002', 'Rodrigo',    'Ramírez',   'rodrigo.ramirez@correo.ucu.edu.uy',    '2002-07-15', 3, 'grado'),
('53000003', 'Maximiliano','Castro',    'maximiliano.castro@correo.ucu.edu.uy', '2004-12-01', 3, 'grado'),
('53000004', 'Gonzalo',    'Núñez',     'gonzalo.nunez@correo.ucu.edu.uy',      '2005-02-28', 3, 'grado'),
('53000005', 'Ignacio',    'Medina',    'ignacio.medina@correo.ucu.edu.uy',     '2003-09-13', 3, 'grado'),
('53000006', 'Ricardo',    'Cabrera',   'ricardo.cabrera@ucu.edu.uy',           '1988-06-06', 3, 'funcionario'),
('53000007', 'Felipe',     'Ríos',      'felipe.rios@correo.ucu.edu.uy',        '2006-01-20', 3, 'grado'),
-- Equipo 4 - Salud
('54000001', 'Emiliano',   'Torres',    'emiliano.torres@correo.ucu.edu.uy',    '2002-11-08', 4, 'grado'),
('54000002', 'Franco',     'Morales',   'franco.morales@correo.ucu.edu.uy',     '2003-05-30', 4, 'grado'),
('54000003', 'Valentín',   'Herrera',   'valentin.herrera@correo.ucu.edu.uy',   '2004-08-24', 4, 'grado'),
('54000004', 'Andrés',     'Giménez',   'andres.gimenez@correo.ucu.edu.uy',     '2003-02-16', 4, 'grado'),
('54000005', 'Mateo',      'Ruiz',      'mateo.ruiz@correo.ucu.edu.uy',         '2005-07-04', 4, 'grado'),
('54000006', 'Juan',       'Méndez',    'juan.mendez@correo.ucu.edu.uy',        '1997-10-10', 4, 'posgrado'),
('54000007', 'Marcelo',    'Olivera',   'marcelo.olivera@ucu.edu.uy',           '1980-01-29', 4, 'docente'),
-- Equipo 5 - Humanas
('55000001', 'Leandro',    'Viera',     'leandro.viera@correo.ucu.edu.uy',      '2003-06-21', 5, 'grado'),
('55000002', 'Germán',     'Cardozo',   'german.cardozo@correo.ucu.edu.uy',     '2004-03-14', 5, 'grado'),
('55000003', 'Alejandro',  'Ferreira',  'alejandro.ferreira@correo.ucu.edu.uy', '2002-09-09', 5, 'grado'),
('55000004', 'Marcos',     'Rossi',     'marcos.rossi@correo.ucu.edu.uy',       '2005-12-12', 5, 'grado'),
('55000005', 'Kevin',      'Silveira',  'kevin.silveira@correo.ucu.edu.uy',     '2004-04-18', 5, 'grado'),
('55000006', 'Daniel',     'Correa',    'daniel.correa@ucu.edu.uy',             '1976-08-03', 5, 'docente'),
('55000007', 'Fernando',   'Ortiz',     'fernando.ortiz@ucu.edu.uy',            '1984-11-25', 5, 'docente'),
-- Equipo 6 - Psicología
('56000001', 'Thiago',     'Duarte',    'thiago.duarte@correo.ucu.edu.uy',      '2005-03-27', 6, 'grado'),
('56000002', 'Bautista',   'Moreira',   'bautista.moreira@correo.ucu.edu.uy',   '2004-01-06', 6, 'grado'),
('56000003', 'Lautaro',    'Machado',   'lautaro.machado@correo.ucu.edu.uy',    '2003-10-19', 6, 'grado'),
('56000004', 'Enzo',       'Pintos',    'enzo.pintos@correo.ucu.edu.uy',        '2002-05-11', 6, 'grado'),
('56000005', 'Camilo',     'Rocha',     'camilo.rocha@correo.ucu.edu.uy',       '2006-02-02', 6, 'grado'),
('56000006', 'Esteban',    'Larrosa',   'esteban.larrosa@correo.ucu.edu.uy',    '1996-07-31', 6, 'posgrado'),
('56000007', 'Washington', 'Bentancor', 'washington.bentancor@ucu.edu.uy',      '1977-12-15', 6, 'funcionario'),
-- Sin equipo (Enfermería)
('57000001', 'Alan',       'Techera',   'alan.techera@correo.ucu.edu.uy',       '2004-06-08', 7, 'grado'),
('57000002', 'Hugo',       'Da Silva',  'hugo.dasilva@ucu.edu.uy',              '1983-09-17', 7, 'funcionario');


-- equipos (el capitán es el jugador 1 de cada uno)
INSERT INTO equipo (id_equipo, nombre, id_torneo, id_facultad, ci_capitan) VALUES
(1, 'Los Ingenieros',    1, 1, '51000001'),
(2, 'Empresariales FC',  1, 2, '52000001'),
(3, 'Deportivo Derecho', 1, 3, '53000001'),
(4, 'Salud United',      1, 4, '54000001'),
(5, 'Humanas FC',        1, 5, '55000001'),
(6, 'Psico Club',        1, 6, '56000001');


-- planteles
INSERT INTO equipo_jugador_torneo (id_equipo, ci_jugador, id_torneo, numero_camiseta) VALUES
(1, '51000001', 1, 1), (1, '51000002', 1, 4), (1, '51000003', 1, 7), (1, '51000004', 1, 9),
(1, '51000005', 1, 10), (1, '51000006', 1, 11), (1, '51000007', 1, 5),
(2, '52000001', 1, 1), (2, '52000002', 1, 4), (2, '52000003', 1, 7), (2, '52000004', 1, 9),
(2, '52000005', 1, 10), (2, '52000006', 1, 11), (2, '52000007', 1, 5),
(3, '53000001', 1, 1), (3, '53000002', 1, 4), (3, '53000003', 1, 7), (3, '53000004', 1, 9),
(3, '53000005', 1, 10), (3, '53000006', 1, 11), (3, '53000007', 1, 5),
(4, '54000001', 1, 1), (4, '54000002', 1, 4), (4, '54000003', 1, 7), (4, '54000004', 1, 9),
(4, '54000005', 1, 10), (4, '54000006', 1, 11), (4, '54000007', 1, 5),
(5, '55000001', 1, 1), (5, '55000002', 1, 4), (5, '55000003', 1, 7), (5, '55000004', 1, 9),
(5, '55000005', 1, 10), (5, '55000006', 1, 11), (5, '55000007', 1, 5),
(6, '56000001', 1, 1), (6, '56000002', 1, 4), (6, '56000003', 1, 7), (6, '56000004', 1, 9),
(6, '56000005', 1, 10), (6, '56000006', 1, 11), (6, '56000007', 1, 5);


-- partidos
INSERT INTO partido (id_partido, id_torneo, numero_fecha, id_equipo_local, id_equipo_visitante, dia, id_turno, nombre_cancha, id_complejo, estado) VALUES
-- Fecha 1
(1,  1, 1, 1, 6, '2026-10-05', 1, 'Cancha 1',       1, 'jugado'),
(2,  1, 1, 2, 5, '2026-10-05', 2, 'Cancha 1',       1, 'jugado'),
(3,  1, 1, 3, 4, '2026-10-05', 1, 'Cancha A',       2, 'jugado'),
-- Fecha 2
(4,  1, 2, 1, 5, '2026-10-12', 3, 'Cancha 1',       1, 'jugado'),
(5,  1, 2, 6, 4, '2026-10-12', 3, 'Cancha 2',       1, 'jugado'),
(6,  1, 2, 2, 3, '2026-10-12', 4, 'Cancha A',       2, 'postergado'),
-- Fecha 3
(7,  1, 3, 1, 4, '2026-10-19', 1, 'Cancha Techada', 3, 'jugado'),
(8,  1, 3, 5, 3, '2026-10-19', 2, 'Cancha Techada', 3, 'jugado'),
(9,  1, 3, 6, 2, '2026-10-19', 2, 'Cancha 1',       1, 'cancelado'),
-- Fecha 4 (a futuro)
(10, 1, 4, 1, 3, '2026-11-09', 1, 'Cancha 1',       1, 'programado'),
(11, 1, 4, 4, 2, '2026-11-09', 2, 'Cancha 1',       1, 'programado'),
(12, 1, 4, 5, 6, '2026-11-09', 3, 'Cancha B',       2, 'programado');


-- planillas (jugadores que participaron)
INSERT INTO planilla_partido (id_partido, ci_jugador, id_equipo) VALUES
-- Partido 1: Ingenieros vs Psico Club
(1, '51000001', 1), (1, '51000002', 1), (1, '51000003', 1), (1, '51000004', 1), (1, '51000005', 1), (1, '51000006', 1),
(1, '56000001', 6), (1, '56000002', 6), (1, '56000003', 6), (1, '56000004', 6), (1, '56000005', 6), (1, '56000006', 6),
-- Partido 2: Empresariales vs Humanas
(2, '52000001', 2), (2, '52000002', 2), (2, '52000003', 2), (2, '52000004', 2), (2, '52000005', 2), (2, '52000006', 2),
(2, '55000001', 5), (2, '55000002', 5), (2, '55000003', 5), (2, '55000004', 5), (2, '55000005', 5), (2, '55000006', 5),
-- Partido 3: Derecho vs Salud
(3, '53000001', 3), (3, '53000002', 3), (3, '53000003', 3), (3, '53000004', 3), (3, '53000005', 3), (3, '53000006', 3),
(3, '54000001', 4), (3, '54000002', 4), (3, '54000003', 4), (3, '54000004', 4), (3, '54000005', 4), (3, '54000006', 4),
-- Partido 4: Ingenieros vs Humanas
(4, '51000001', 1), (4, '51000002', 1), (4, '51000003', 1), (4, '51000004', 1), (4, '51000005', 1), (4, '51000006', 1),
(4, '55000001', 5), (4, '55000002', 5), (4, '55000003', 5), (4, '55000004', 5), (4, '55000005', 5), (4, '55000006', 5),
-- Partido 5: Psico Club vs Salud (54000003 suspendido por la roja de la fecha 1, entra 54000007)
(5, '56000001', 6), (5, '56000002', 6), (5, '56000003', 6), (5, '56000004', 6), (5, '56000005', 6), (5, '56000006', 6),
(5, '54000001', 4), (5, '54000002', 4), (5, '54000004', 4), (5, '54000005', 4), (5, '54000006', 4), (5, '54000007', 4),
-- Partido 7: Ingenieros vs Salud
(7, '51000001', 1), (7, '51000002', 1), (7, '51000003', 1), (7, '51000004', 1), (7, '51000005', 1), (7, '51000006', 1),
(7, '54000001', 4), (7, '54000002', 4), (7, '54000003', 4), (7, '54000004', 4), (7, '54000005', 4), (7, '54000006', 4),
-- Partido 8: Humanas vs Derecho
(8, '55000001', 5), (8, '55000002', 5), (8, '55000003', 5), (8, '55000004', 5), (8, '55000005', 5), (8, '55000006', 5),
(8, '53000001', 3), (8, '53000002', 3), (8, '53000003', 3), (8, '53000004', 3), (8, '53000005', 3), (8, '53000006', 3);


-- goles
-- Un autogol suma para el equipo rival
INSERT INTO gol (id_partido, ci_jugador, minuto, autogol) VALUES
-- Partido 1: Ingenieros 3 - 2 Psico Club
(1, '51000001', 5,  FALSE),
(1, '51000002', 18, FALSE),
(1, '56000003', 22, FALSE),
(1, '51000001', 30, FALSE),
(1, '56000001', 41, FALSE),
-- Partido 2: Empresariales 1 - 1 Humanas
(2, '52000003', 12, FALSE),
(2, '55000002', 38, FALSE),
-- Partido 3: Derecho 0 - 2 Salud
(3, '54000001', 10, FALSE),
(3, '54000001', 27, FALSE),
-- Partido 4: Ingenieros 2 - 2 Humanas (el gol del 55000003 es en contra)
(4, '55000001', 8,  FALSE),
(4, '51000002', 19, FALSE),
(4, '55000003', 25, TRUE),
(4, '55000001', 44, FALSE),
-- Partido 5: Psico Club 1 - 3 Salud
(5, '54000002', 5,  FALSE),
(5, '56000003', 16, FALSE),
(5, '54000001', 29, FALSE),
(5, '54000007', 40, FALSE),
-- Partido 7: Ingenieros 1 - 1 Salud
(7, '51000003', 14, FALSE),
(7, '54000003', 37, FALSE),
-- Partido 8: Humanas 2 - 0 Derecho
(8, '55000002', 9,  FALSE),
(8, '55000004', 31, FALSE);


-- tarjetas 
INSERT INTO tarjeta (id_partido, ci_jugador, minuto, color) VALUES
(1, '56000002', 15, 'amarilla'),
(1, '51000004', 33, 'amarilla'),   -- 1ª amarilla de 51000004
(2, '52000004', 20, 'amarilla'),
(3, '53000004', 22, 'amarilla'),
(3, '54000003', 35, 'roja'),       -- suspendido en la fecha 2
(4, '51000004', 12, 'amarilla'),   -- 2ª amarilla de 51000004
(4, '55000005', 30, 'amarilla'),
(5, '56000002', 10, 'amarilla'),
(5, '54000004', 33, 'amarilla'),
(7, '51000004', 20, 'amarilla'),   -- 3ª amarilla de 51000004 -> suspendido en la fecha 4
(8, '53000005', 18, 'amarilla');


-- sanciones 
INSERT INTO sancion_jugador (ci_jugador, id_torneo, motivo, numero_fecha_inicio, cantidad_fechas) VALUES
('54000003', 1, 'roja',                     2, 1),
('51000004', 1, 'acumulacion de amarillas', 4, 1),
('52000004', 1, 'disciplinaria',            4, 2);


-- usuarios del sistema
INSERT INTO login (correo, contrasena, rol) VALUES
('admin@ucu.edu.uy',       SHA2('admin123', 256),    'administrador'),
('planillero1@ucu.edu.uy', SHA2('planilla123', 256), 'planillero'),
('planillero2@ucu.edu.uy', SHA2('planilla123', 256), 'planillero');
