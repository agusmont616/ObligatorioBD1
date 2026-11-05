USE torneo;


-- 1. Tabla de posiciones de una edicion

SELECT r.equipo,
       COUNT(*) AS PJ,
       SUM(CASE WHEN r.gf > r.gc THEN 1 ELSE 0 END) AS PG,
       SUM(CASE WHEN r.gf = r.gc THEN 1 ELSE 0 END) AS PE,
       SUM(CASE WHEN r.gf < r.gc THEN 1 ELSE 0 END) AS PP,
       SUM(r.gf) AS GF,
       SUM(r.gc) AS GC,
       SUM(r.gf) - SUM(r.gc) AS DG,
       SUM(CASE WHEN r.gf > r.gc THEN 3 WHEN r.gf = r.gc THEN 1 ELSE 0 END) AS PTS
FROM (
   SELECT e.id_equipo, e.nombre AS equipo, p.id_partido,
          (SELECT COUNT(*)
           FROM gol g
           JOIN planilla_partido pp ON pp.id_partido = g.id_partido AND pp.ci_jugador = g.ci_jugador
           WHERE g.id_partido = p.id_partido
             AND ((pp.id_equipo = e.id_equipo AND g.autogol = FALSE)
               OR (pp.id_equipo <> e.id_equipo AND g.autogol = TRUE))) AS gf,
          (SELECT COUNT(*)
           FROM gol g
           JOIN planilla_partido pp ON pp.id_partido = g.id_partido AND pp.ci_jugador = g.ci_jugador
           WHERE g.id_partido = p.id_partido
             AND ((pp.id_equipo <> e.id_equipo AND g.autogol = FALSE)
               OR (pp.id_equipo = e.id_equipo AND g.autogol = TRUE))) AS gc
   FROM equipo e
   JOIN partido p ON e.id_equipo = p.id_equipo_local OR e.id_equipo = p.id_equipo_visitante
   WHERE p.estado = 'jugado' AND p.id_torneo = 1
) r
GROUP BY r.id_equipo, r.equipo
ORDER BY PTS DESC, DG DESC, GF DESC;


-- 2. Tabla de goleadores (los 10 con mas goles)

SELECT j.nombre, j.apellido, COUNT(*) AS goles
FROM gol g
JOIN jugador j ON j.ci = g.ci_jugador
WHERE g.autogol = FALSE
GROUP BY j.ci, j.nombre, j.apellido
ORDER BY goles DESC
LIMIT 10;


-- 3. Fair play por equipo (amarilla 1 punto, roja 3, gana el de menor puntaje)

SELECT e.nombre AS equipo,
       SUM(CASE WHEN t.color = 'amarilla' THEN 1 ELSE 0 END) AS amarillas,
       SUM(CASE WHEN t.color = 'roja' THEN 1 ELSE 0 END) AS rojas,
       SUM(CASE WHEN t.color = 'amarilla' THEN 1
                WHEN t.color = 'roja' THEN 3
                ELSE 0 END) AS puntaje
FROM equipo e
LEFT JOIN planilla_partido pp ON pp.id_equipo = e.id_equipo
LEFT JOIN tarjeta t ON t.id_partido = pp.id_partido AND t.ci_jugador = pp.ci_jugador
WHERE e.id_torneo = 1
GROUP BY e.id_equipo, e.nombre
ORDER BY puntaje;


-- 4. Promedio de goles por partido en cada fecha

SELECT p.numero_fecha,
       COUNT(DISTINCT p.id_partido) AS partidos,
       COUNT(g.id_gol) AS goles,
       COUNT(g.id_gol) / COUNT(DISTINCT p.id_partido) AS promedio
FROM partido p
LEFT JOIN gol g ON g.id_partido = p.id_partido
WHERE p.estado = 'jugado' AND p.id_torneo = 1
GROUP BY p.numero_fecha
ORDER BY p.numero_fecha;

-- 4b. Promedio de goles por partido en toda la edicion

SELECT COUNT(DISTINCT p.id_partido) AS partidos,
       COUNT(g.id_gol) AS goles,
       COUNT(g.id_gol) / COUNT(DISTINCT p.id_partido) AS promedio
FROM partido p
LEFT JOIN gol g ON g.id_partido = p.id_partido
WHERE p.estado = 'jugado' AND p.id_torneo = 1;


-- 5. Canchas mas utilizadas

SELECT c.nombre AS complejo, p.nombre_cancha, COUNT(*) AS partidos
FROM partido p
JOIN complejo c ON c.id_complejo = p.id_complejo
WHERE p.estado IN ('jugado', 'programado')
GROUP BY c.nombre, p.nombre_cancha
ORDER BY partidos DESC;

-- 5b. Turnos mas utilizados

SELECT t.hora_inicio, t.hora_fin, COUNT(*) AS partidos
FROM partido p
JOIN turno t ON t.id_turno = p.id_turno
WHERE p.estado IN ('jugado', 'programado')
GROUP BY t.id_turno, t.hora_inicio, t.hora_fin
ORDER BY partidos DESC;


-- 6. Cantidad de jugadores por facultad y por tipo

SELECT f.nombre AS facultad, j.tipo, COUNT(*) AS jugadores
FROM jugador j
JOIN facultad f ON f.id_facultad = j.id_facultad
GROUP BY f.nombre, j.tipo
ORDER BY f.nombre, j.tipo;


-- 7. Jugadores inscriptos en un plantel que nunca figuraron en una planilla

SELECT j.ci, j.nombre, j.apellido, e.nombre AS equipo
FROM equipo_jugador_torneo ejt
JOIN jugador j ON j.ci = ejt.ci_jugador
JOIN equipo e ON e.id_equipo = ejt.id_equipo
WHERE ejt.ci_jugador NOT IN (SELECT pp.ci_jugador FROM planilla_partido pp)
ORDER BY e.nombre, j.apellido;


-- 8. Cantidad de sanciones por equipo y por motivo

SELECT e.nombre AS equipo, s.motivo, COUNT(*) AS sanciones
FROM sancion_jugador s
JOIN equipo_jugador_torneo ejt ON ejt.ci_jugador = s.ci_jugador AND ejt.id_torneo = s.id_torneo
JOIN equipo e ON e.id_equipo = ejt.id_equipo
GROUP BY e.nombre, s.motivo
ORDER BY e.nombre, s.motivo;


-- 9. Porcentaje de partidos jugados vs postergados y cancelados

SELECT estado,
       COUNT(*) AS partidos,
       COUNT(*) * 100 / (SELECT COUNT(*) FROM partido WHERE id_torneo = 1) AS porcentaje
FROM partido
WHERE id_torneo = 1
GROUP BY estado
ORDER BY partidos DESC;


-- 10. Fixture de una fecha: quien juega, donde y a que hora

SELECT p.numero_fecha, p.dia, t.hora_inicio,
       el.nombre AS local, ev.nombre AS visitante,
       p.nombre_cancha, c.nombre AS complejo, p.estado
FROM partido p
JOIN equipo el ON el.id_equipo = p.id_equipo_local
JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante
JOIN turno t ON t.id_turno = p.id_turno
JOIN complejo c ON c.id_complejo = p.id_complejo
WHERE p.id_torneo = 1 AND p.numero_fecha = 1
ORDER BY p.dia, t.hora_inicio;


-- 11. Jugadores con mas tarjetas

SELECT j.nombre, j.apellido,
       SUM(CASE WHEN t.color = 'amarilla' THEN 1 ELSE 0 END) AS amarillas,
       SUM(CASE WHEN t.color = 'roja' THEN 1 ELSE 0 END) AS rojas,
       COUNT(*) AS total
FROM tarjeta t
JOIN jugador j ON j.ci = t.ci_jugador
GROUP BY j.ci, j.nombre, j.apellido
ORDER BY total DESC
LIMIT 5;


-- 12. Cantidad de jugadores en el plantel de cada equipo

SELECT e.nombre AS equipo, COUNT(ejt.ci_jugador) AS jugadores
FROM equipo e
LEFT JOIN equipo_jugador_torneo ejt ON ejt.id_equipo = e.id_equipo
WHERE e.id_torneo = 1
GROUP BY e.id_equipo, e.nombre
ORDER BY jugadores DESC;
