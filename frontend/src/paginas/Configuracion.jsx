import { useState } from "react";
import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import { useDatos, Cargando, Encabezado, Error, hora, useFormulario, useAccion } from "../componentes/ui.jsx";

export default function Configuracion() {
  const { usuario } = useSesion();
  const [usuarios, recargarUsuarios, error] = useDatos("/usuarios");
  const [facultades, recargarFacultades] = useDatos("/facultades");
  const [jugadores] = useDatos("/jugadores");
  const [turnos] = useDatos("/turnos");
  const [form, cambiar, setForm] = useFormulario({ correo: "", contrasena: "", rol: "planillero" });
  const [facultad, setFacultad] = useState("");
  const [ejecutar, errorAccion, ocupado] = useAccion();

  async function crearUsuario(e) {
    e.preventDefault();
    if (await ejecutar(() => api("/usuarios", "POST", form))) {
      setForm({ correo: "", contrasena: "", rol: "planillero" });
      recargarUsuarios();
    }
  }

  async function borrarUsuario(u) {
    if (!confirm(`¿Borrar el usuario ${u.correo}?`)) return;
    if (await ejecutar(() => api("/usuarios/" + encodeURIComponent(u.correo), "DELETE"))) recargarUsuarios();
  }

  async function crearFacultad(e) {
    e.preventDefault();
    if (await ejecutar(() => api("/facultades", "POST", { nombre: facultad }))) {
      setFacultad("");
      recargarFacultades();
    }
  }

  const jugadoresDe = (id) => (jugadores || []).filter((j) => j.id_facultad === id).length;

  return (
    <>
      <Encabezado ruta="Administración / Configuración" titulo="Configuración" sub="Usuarios del sistema, facultades y turnos" />
      <Error texto={errorAccion} />

      <div className="grilla-2">
        <div className="tarjeta">
          <h2>Usuarios del sistema</h2>
          <Cargando datos={usuarios} error={error} />
          <table className="tabla">
            <thead><tr><th>Correo</th><th>Rol</th><th></th></tr></thead>
            <tbody>
              {(usuarios || []).map((u) => (
                <tr key={u.correo}>
                  <td>{u.correo}</td>
                  <td><span className={"etiqueta rol-" + u.rol}>{u.rol === "administrador" ? "Administrador" : "Planillero"}</span></td>
                  <td className="derecha">
                    {u.correo !== usuario.correo && (
                      <button className="boton-chico peligro" disabled={ocupado} onClick={() => borrarUsuario(u)}>Borrar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form className="formulario separado" onSubmit={crearUsuario}>
            <h2>Nuevo usuario</h2>
            <div className="fila">
              <label>Correo<input type="email" value={form.correo} onChange={cambiar("correo")} required /></label>
              <label>Contraseña<input type="password" value={form.contrasena} onChange={cambiar("contrasena")} minLength={6} required /></label>
            </div>
            <div className="segmentado">
              {["administrador", "planillero"].map((r) => (
                <button type="button" key={r} className={form.rol === r ? "activo" : ""} onClick={() => setForm({ ...form, rol: r })}>
                  {r === "administrador" ? "Administrador" : "Planillero"}
                </button>
              ))}
            </div>
            <div className="nota">La contraseña se guarda hasheada (SHA-256). El rol define qué usuario de MySQL usa el backend.</div>
            <button className="boton" disabled={ocupado}>Guardar usuario</button>
          </form>
        </div>

        <div>
          <div className="tarjeta">
            <h2>Facultades</h2>
            <table className="tabla">
              <thead><tr><th>Facultad</th><th>Jugadores</th></tr></thead>
              <tbody>
                {(facultades || []).map((f) => (
                  <tr key={f.id_facultad}><td>{f.nombre}</td><td>{jugadoresDe(f.id_facultad)}</td></tr>
                ))}
              </tbody>
            </table>
            <form className="agregar" onSubmit={crearFacultad}>
              <input placeholder="Nueva facultad" value={facultad} onChange={(e) => setFacultad(e.target.value)} required />
              <button className="boton" disabled={ocupado}>+ Agregar</button>
            </form>
          </div>

          <div className="tarjeta">
            <h2>Turnos</h2>
            <p className="chico gris">Turnos de una hora entre las 18:00 y las 23:00.</p>
            <div className="turnos">
              {(turnos || []).map((t, i) => (
                <div key={t.id_turno} className="turno">
                  <div className="negrita">{hora(t.hora_inicio)}</div>
                  <div className="chico">{hora(t.hora_fin)}</div>
                  <div className="chico gris">Turno {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
