USE torneo;

DROP USER IF EXISTS 'torneo_auth'@'%';
DROP USER IF EXISTS 'torneo_admin'@'%';
DROP USER IF EXISTS 'torneo_planillero'@'%';

CREATE USER 'torneo_auth'@'%'       IDENTIFIED BY 'auth_pass';
CREATE USER 'torneo_admin'@'%'      IDENTIFIED BY 'admin_pass';
CREATE USER 'torneo_planillero'@'%' IDENTIFIED BY 'planillero_pass';


GRANT SELECT ON torneo.login TO 'torneo_auth'@'%';


-- Permisos de admin (todo)
GRANT SELECT, INSERT, UPDATE, DELETE ON torneo.* TO 'torneo_admin'@'%';


-- Permisos de planillero (puede consultar datos de todas estas tablas)
GRANT SELECT ON torneo.torneo                TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.facultad              TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.jugador               TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.equipo                TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.equipo_jugador_torneo TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.partido               TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.turno                 TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.complejo              TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.cancha                TO 'torneo_planillero'@'%';
GRANT SELECT ON torneo.sancion_jugador       TO 'torneo_planillero'@'%';

-- (puede consultar, insertar, actualizar y borrar datos de todas estas otras)
GRANT SELECT, INSERT, UPDATE, DELETE ON torneo.planilla_partido TO 'torneo_planillero'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON torneo.gol              TO 'torneo_planillero'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON torneo.tarjeta          TO 'torneo_planillero'@'%';

-- (puede actualizar el estado de un partido)
GRANT UPDATE (estado) ON torneo.partido TO 'torneo_planillero'@'%';

FLUSH PRIVILEGES;