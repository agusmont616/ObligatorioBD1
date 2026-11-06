import { useState } from "react";
import { useSesion } from "../Sesion.jsx";
import { useDatos, Cargando, Barras, Stat, MOTIVOS, TIPOS, ESTADOS_PARTIDO, fechaConDia, hora } from "../componentes/ui.jsx";

const PESTANAS = ["Posiciones", "Goleadores y Fair Play", "Estadísticas de partidos", "Jugadores y sanciones", "Consultas adicionales"];

export default function Reportes() {
  const [pestana, setPestana] = useState(PESTANAS[0]);
  const { torneo } = useSesion();

  return (
    <>
      <div className="gris chico">Reportes</div>
      <h1 className="titulo">Reportes</h1>
      {torneo && <div className="gris chico">Edición {torneo.anio} · {torneo.semestre}° semestre</div>}

      <div className="pestanas">
        {PESTANAS.map((p) => (
          <button key={p} className={p === pestana ? "pestana activa" : "pestana"} onClick={() => setPestana(p)}>
            {p}
          </button>
        ))}
      </div>

      {pestana === PESTANAS[0] && <Posiciones />}
      {pestana === PESTANAS[1] && <Goleadores />}
      {pestana === PESTANAS[2] && <Estadisticas />}
      {pestana === PESTANAS[3] && <JugadoresSanciones />}
      {pestana === PESTANAS[4] && <Adicionales />}
    </>
  );
}

// todos los reportes de la edicion elegida
function useReporte(nombre, extra = "") {
  const { idTorneo } = useSesion();
  return useDatos(idTorneo && `/reportes/${nombre}?id_torneo=${idTorneo}${extra}`);
}

function Posiciones() {
  const [filas, , error] = useReporte("posiciones");
  if (!filas) return <Cargando datos={filas} error={error} />;

  const lider = filas[0];
  const ataque = [...filas].sort((a, b) => b.GF - a.GF)[0];
  const defensa = [...filas].sort((a, b) => a.GC - b.GC)[0];

  return (
    <>
      <div className="tarjeta">
        <h2>Tabla de posiciones</h2>
        <p className="gris chico">Victoria 3 puntos, empate 1. Orden: puntos → diferencia de gol → goles a favor</p>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.id_equipo} className={i === 0 ? "fila-lider" : ""}>
                  <td>{i + 1}</td>
                  <td className="negrita">{f.equipo}</td>
                  <td>{f.PJ}</td><td>{f.PG}</td><td>{f.PE}</td><td>{f.PP}</td>
                  <td>{f.GF}</td><td>{f.GC}</td>
                  <td>{f.DG > 0 ? "+" + f.DG : f.DG}</td>
                  <td className="negrita">{f.PTS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filas.length === 0 && <div className="vacio">Todavía no hay partidos jugados en esta edición.</div>}
      </div>

      {lider && (
        <div className="grilla-3">
          <Stat valor={lider.equipo} texto="Líder" detalle={lider.PTS + " puntos"} />
          <Stat valor={ataque.equipo} texto="Mejor ataque" detalle={ataque.GF + " goles a favor"} />
          <Stat valor={defensa.equipo} texto="Mejor defensa" detalle={defensa.GC + " goles en contra"} />
        </div>
      )}
    </>
  );
}

function Goleadores() {
  const [goleadores, , e1] = useReporte("goleadores");
  const [fairPlay, , e2] = useReporte("fair-play");
  if (!goleadores || !fairPlay) return <Cargando datos={null} error={e1 || e2} />;
  const maximo = Math.max(1, ...goleadores.map((g) => g.goles));

  return (
    <div className="grilla-2">
      <div className="tarjeta">
        <h2>Tabla de goleadores</h2>
        <p className="gris chico">Los 10 jugadores con más goles (sin contar goles en contra)</p>
        <table className="tabla">
          <thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>Goles</th></tr></thead>
          <tbody>
            {goleadores.map((g, i) => (
              <tr key={g.ci}>
                <td>{i + 1}</td>
                <td className="negrita">{g.nombre} {g.apellido}</td>
                <td>{g.equipo}</td>
                <td className="celda-barra" title={`${g.goles} goles`}>
                  <span className="negrita">{g.goles}</span>
                  <div className="barra" style={{ width: (g.goles / maximo) * 100 + "%" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {goleadores.length === 0 && <div className="vacio">Todavía no hay goles.</div>}
      </div>

      <div className="tarjeta">
        <h2>Fair Play por equipo</h2>
        <p className="gris chico">Amarilla 1 punto, roja 3 · gana el de menor puntaje</p>
        <table className="tabla">
          <thead><tr><th>#</th><th>Equipo</th><th>Amarillas</th><th>Rojas</th><th>Puntos</th></tr></thead>
          <tbody>
            {fairPlay.map((f, i) => (
              <tr key={f.equipo} className={i === 0 ? "fila-lider" : ""}>
                <td>{i + 1}</td>
                <td className="negrita">{f.equipo}</td>
                <td><span className="tarjeta-color amarilla" /> {f.amarillas}</td>
                <td><span className="tarjeta-color roja" /> {f.rojas}</td>
                <td className="negrita">{f.puntaje}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {fairPlay[0] && (
          <div className="alerta alerta-amarilla">🏆 Premio Fair Play (parcial): <b>{fairPlay[0].equipo}</b> con {fairPlay[0].puntaje} puntos</div>
        )}
      </div>
    </div>
  );
}

function Estadisticas() {
  const [porFecha, , e1] = useReporte("promedio-goles-fecha");
  const [total] = useReporte("promedio-goles-torneo");
  const [estados] = useReporte("estados");
  const [canchas] = useReporte("canchas");
  const [turnos] = useReporte("turnos");
  if (!porFecha || !total || !estados || !canchas || !turnos) return <Cargando datos={null} error={e1} />;
  const general = total[0] || { promedio: 0, partidos: 0, goles: 0 };

  return (
    <div className="grilla-2">
      <div className="tarjeta">
        <h2>Promedio de goles por partido</h2>
        <p className="gris chico">
          Por fecha · promedio de la edición: <b>{Number(general.promedio || 0).toFixed(2)}</b> ({general.goles} goles en {general.partidos} partidos)
        </p>
        <Barras filas={porFecha} etiqueta={(f) => "Fecha " + f.numero_fecha} valor={(f) => Number(f.promedio)}
          formato={(v) => v.toFixed(2)} unidad=" goles por partido" />
      </div>

      <div className="tarjeta">
        <h2>Estado de los partidos</h2>
        <p className="gris chico">Jugados vs. postergados y cancelados</p>
        <Barras filas={estados} etiqueta={(f) => ESTADOS_PARTIDO[f.estado]} valor={(f) => Number(f.porcentaje)}
          formato={(v) => v.toFixed(0) + "%"} />
        <div className="chico gris">{estados.map((e) => `${ESTADOS_PARTIDO[e.estado]}: ${e.partidos}`).join(" · ")}</div>
      </div>

      <div className="tarjeta">
        <h2>Canchas más utilizadas</h2>
        <p className="gris chico">Partidos jugados o programados por cancha</p>
        <Barras filas={canchas} etiqueta={(f) => `${f.complejo} · ${f.nombre_cancha}`} valor={(f) => f.partidos} unidad=" partidos" />
      </div>

      <div className="tarjeta">
        <h2>Turnos más utilizados</h2>
        <p className="gris chico">Partidos por franja horaria</p>
        <Barras filas={turnos} etiqueta={(f) => `${hora(f.hora_inicio)}–${hora(f.hora_fin)}`} valor={(f) => f.partidos} unidad=" partidos" />
      </div>
    </div>
  );
}

function JugadoresSanciones() {
  const [porFacultad, , e1] = useDatos("/reportes/jugadores-facultad");
  const [sinPlanilla] = useReporte("sin-planilla");
  const [sanciones] = useReporte("sanciones");
  if (!porFacultad || !sinPlanilla || !sanciones) return <Cargando datos={null} error={e1} />;

  // paso de filas (facultad, tipo) a una tabla facultad x tipo
  const facultades = [...new Set(porFacultad.map((f) => f.facultad))];
  const cantidad = (fac, tipo) => porFacultad.find((f) => f.facultad === fac && f.tipo === tipo)?.jugadores || 0;
  const equipos = [...new Set(sanciones.map((s) => s.equipo))];
  const sancionesDe = (eq, motivo) => sanciones.find((s) => s.equipo === eq && s.motivo === motivo)?.sanciones || 0;

  return (
    <div className="grilla-2">
      <div className="tarjeta">
        <h2>Jugadores por facultad y tipo</h2>
        <p className="gris chico">Todos los jugadores registrados</p>
        <table className="tabla">
          <thead>
            <tr><th>Facultad</th>{Object.values(TIPOS).map((t) => <th key={t}>{t}</th>)}<th>Total</th></tr>
          </thead>
          <tbody>
            {facultades.map((fac) => (
              <tr key={fac}>
                <td className="negrita">{fac}</td>
                {Object.keys(TIPOS).map((t) => <td key={t}>{cantidad(fac, t)}</td>)}
                <td className="negrita">{Object.keys(TIPOS).reduce((s, t) => s + cantidad(fac, t), 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tarjeta">
        <h2>Nunca figuraron en planilla</h2>
        <p className="gris chico">Inscriptos en un plantel de la edición que no jugaron ningún partido</p>
        <table className="tabla">
          <thead><tr><th>Jugador</th><th>Equipo</th></tr></thead>
          <tbody>
            {sinPlanilla.map((j) => (
              <tr key={j.ci}><td>{j.nombre} {j.apellido}</td><td>{j.equipo}</td></tr>
            ))}
          </tbody>
        </table>
        {sinPlanilla.length === 0 && <div className="vacio">Todos los inscriptos jugaron al menos un partido.</div>}
        <div className="nota">{sinPlanilla.length} jugadores sin minutos en la edición</div>
      </div>

      <div className="tarjeta">
        <h2>Sanciones por equipo y motivo</h2>
        <table className="tabla">
          <thead>
            <tr><th>Equipo</th>{Object.values(MOTIVOS).map((m) => <th key={m}>{m}</th>)}<th>Total</th></tr>
          </thead>
          <tbody>
            {equipos.map((eq) => (
              <tr key={eq}>
                <td className="negrita">{eq}</td>
                {Object.keys(MOTIVOS).map((m) => <td key={m}>{sancionesDe(eq, m)}</td>)}
                <td className="negrita">{Object.keys(MOTIVOS).reduce((s, m) => s + sancionesDe(eq, m), 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {equipos.length === 0 && <div className="vacio">No hay sanciones en esta edición.</div>}
      </div>
    </div>
  );
}

function Adicionales() {
  const [numero, setNumero] = useState(1);
  const [fixture, , e1] = useReporte("fixture", "&numero_fecha=" + numero);
  const [tarjetas] = useReporte("tarjetas-jugador");
  const [planteles] = useReporte("tamano-planteles");

  return (
    <div className="grilla-2">
      <div className="tarjeta">
        <div className="pagina-encabezado">
          <h2>Fixture de una fecha</h2>
          <label className="check">Fecha
            <input type="number" min="1" value={numero} onChange={(e) => setNumero(Number(e.target.value) || 1)} className="input-chico" />
          </label>
        </div>
        <p className="gris chico">Quién juega, dónde y a qué hora</p>
        <Cargando datos={fixture} error={e1} />
        {fixture && (
          <table className="tabla">
            <thead><tr><th>Día</th><th>Hora</th><th>Partido</th><th>Cancha</th><th>Estado</th></tr></thead>
            <tbody>
              {fixture.map((p, i) => (
                <tr key={i}>
                  <td>{fechaConDia(p.dia)}</td>
                  <td>{hora(p.hora_inicio)}</td>
                  <td className="negrita">{p.local} vs {p.visitante}</td>
                  <td className="chico">{p.complejo} · {p.nombre_cancha}</td>
                  <td>{ESTADOS_PARTIDO[p.estado]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {fixture && fixture.length === 0 && <div className="vacio">No hay partidos en esa fecha.</div>}
      </div>

      <div className="tarjeta">
        <h2>Jugadores más amonestados</h2>
        <p className="gris chico">Los 5 con más tarjetas en la edición</p>
        <table className="tabla">
          <thead><tr><th>Jugador</th><th>Amarillas</th><th>Rojas</th><th>Total</th></tr></thead>
          <tbody>
            {(tarjetas || []).map((t, i) => (
              <tr key={i}>
                <td className="negrita">{t.nombre} {t.apellido}</td>
                <td><span className="tarjeta-color amarilla" /> {t.amarillas}</td>
                <td><span className="tarjeta-color roja" /> {t.rojas}</td>
                <td className="negrita">{t.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tarjeta">
        <h2>Tamaño de los planteles</h2>
        <p className="gris chico">Jugadores inscriptos por equipo (mínimo 5, máximo 10)</p>
        <Barras filas={planteles || []} etiqueta={(f) => f.equipo} valor={(f) => f.jugadores} unidad=" jugadores" />
      </div>
    </div>
  );
}
