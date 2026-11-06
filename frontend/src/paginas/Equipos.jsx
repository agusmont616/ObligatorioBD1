import { useState } from "react";
import { Link } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import { useDatos, Cargando, Encabezado, Error, useFormulario, useAccion } from "../componentes/ui.jsx";

const COLORES = ["#1d4ed8", "#ea7a0c", "#c2410c", "#15803d", "#7c3aed", "#db2777", "#0e7490", "#4d7c0f"];

export function colorEquipo(id) {
  return COLORES[id % COLORES.length];
}

export default function Equipos() {
  const { torneo, idTorneo } = useSesion();
  const [equipos, recargar, error] = useDatos(idTorneo && "/equipos?id_torneo=" + idTorneo);
  const [facultades] = useDatos("/facultades");
  const [jugadores] = useDatos(idTorneo && "/jugadores?id_torneo=" + idTorneo);
  const [creando, setCreando] = useState(false);
  const [form, cambiar, setForm] = useFormulario({ nombre: "", id_facultad: "", ci_capitan: "", numero_camiseta: "1" });
  const [ejecutar, errorAccion, ocupado] = useAccion();

  const enInscripcion = torneo?.estado === "inscripcion";
  const libres = (jugadores || []).filter((j) => !j.id_equipo && j.id_facultad === Number(form.id_facultad));

  async function crear(e) {
    e.preventDefault();
    const ok = await ejecutar(() => api("/equipos", "POST", { ...form, id_torneo: idTorneo }));
    if (ok) {
      setCreando(false);
      setForm({ nombre: "", id_facultad: "", ci_capitan: "", numero_camiseta: "1" });
      recargar();
    }
  }

  return (
    <>
      <Encabezado ruta="Gestión / Equipos" titulo="Equipos y planteles"
        sub={torneo ? `Edición ${torneo.anio} · ${torneo.semestre}° semestre` : ""}>
        {enInscripcion && <button className="boton" onClick={() => setCreando(!creando)}>+ Nuevo equipo</button>}
      </Encabezado>

      {!enInscripcion && torneo && (
        <div className="alerta alerta-amarilla">
          La edición está {torneo.estado}: los planteles no pueden modificarse (solo consulta).
        </div>
      )}

      {creando && (
        <form className="tarjeta formulario formulario-ancho" onSubmit={crear}>
          <h2>Nuevo equipo</h2>
          <div className="fila">
            <label>Nombre<input value={form.nombre} onChange={cambiar("nombre")} required /></label>
            <label>Facultad
              <select value={form.id_facultad} onChange={(e) => setForm({ ...form, id_facultad: e.target.value, ci_capitan: "" })} required>
                <option value="">Elegir...</option>
                {(facultades || []).map((f) => <option key={f.id_facultad} value={f.id_facultad}>{f.nombre}</option>)}
              </select>
            </label>
            <label>Capitán
              <select value={form.ci_capitan} onChange={cambiar("ci_capitan")} required disabled={!form.id_facultad}>
                <option value="">{form.id_facultad ? "Elegir..." : "Primero la facultad"}</option>
                {libres.map((j) => <option key={j.ci} value={j.ci}>{j.nombre} {j.apellido} ({j.ci})</option>)}
              </select>
            </label>
            <label>N° camiseta<input type="number" min="1" max="99" value={form.numero_camiseta} onChange={cambiar("numero_camiseta")} required /></label>
          </div>
          <div className="nota">El capitán queda inscripto en el plantel. Solo aparecen jugadores de la facultad sin equipo en esta edición.</div>
          <Error texto={errorAccion} />
          <div className="acciones">
            <button type="button" className="boton boton-blanco" onClick={() => setCreando(false)}>Cancelar</button>
            <button className="boton" disabled={ocupado}>Crear equipo</button>
          </div>
        </form>
      )}

      <Cargando datos={equipos} error={error} />
      <div className="grilla-equipos">
        {(equipos || []).map((e) => (
          <div key={e.id_equipo} className="tarjeta equipo">
            <div className="equipo-cabeza" style={{ background: colorEquipo(e.id_equipo) }}>
              <div className="equipo-escudo">{e.nombre.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="negrita">{e.nombre}</div>
                <div className="chico">{e.facultad}</div>
              </div>
            </div>
            <div className="equipo-cuerpo">
              <div className="chico">Capitán: <b>{e.capitan_nombre} {e.capitan_apellido}</b></div>
              <Medidor texto="Plantel" valor={e.jugadores} maximo={10} minimo={5} />
              <Medidor texto="Docentes / funcionarios" valor={e.docentes_funcionarios} maximo={2} />
              <div className="chico">
                {e.jugadores >= 5
                  ? <span className="texto-verde">✓ Plantel válido</span>
                  : <span className="texto-rojo">✗ Faltan {5 - e.jugadores} jugadores</span>}
              </div>
              <Link className="boton boton-blanco boton-bloque" to={"/equipos/" + e.id_equipo}>Ver plantel</Link>
            </div>
          </div>
        ))}
      </div>
      {equipos && equipos.length === 0 && <div className="tarjeta vacio">Esta edición todavía no tiene equipos.</div>}
    </>
  );
}

function Medidor({ texto, valor, maximo, minimo }) {
  const malo = minimo && valor < minimo;
  return (
    <div className="medidor">
      <div className="medidor-texto chico">
        <span>{texto}</span>
        <span>{valor}/{maximo}</span>
      </div>
      <div className="barra-pista">
        <div className={"barra" + (malo ? " barra-roja" : "")} style={{ width: (valor / maximo) * 100 + "%" }} />
      </div>
    </div>
  );
}
