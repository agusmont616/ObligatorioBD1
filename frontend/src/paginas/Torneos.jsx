import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import { useDatos, Cargando, Encabezado, Estado, Error, fechaCorta, useFormulario, useAccion } from "../componentes/ui.jsx";

const SIGUIENTE = { inscripcion: "en curso", "en curso": "finalizado" };

export default function Torneos() {
  const { recargarTorneos, setIdTorneo } = useSesion();
  const [torneos, recargar, error] = useDatos("/torneos");
  const [form, cambiar, setForm] = useFormulario({
    nombre: "Interfacultades", anio: new Date().getFullYear() + 1, semestre: "1", fecha_inicio: "", fecha_fin: "",
  });
  const [ejecutar, errorAccion, ocupado] = useAccion();

  async function crear(e) {
    e.preventDefault();
    const ok = await ejecutar(() => api("/torneos", "POST", form));
    if (ok) {
      setForm({ ...form, fecha_inicio: "", fecha_fin: "" });
      recargar();
      recargarTorneos();
    }
  }

  async function avanzar(t) {
    const estado = SIGUIENTE[t.estado];
    if (!confirm(`¿Pasar "${t.nombre} ${t.anio}-${t.semestre}" a ${estado}? No se puede volver atrás.`)) return;
    const ok = await ejecutar(() => api(`/torneos/${t.id_torneo}/estado`, "PUT", { estado }));
    if (ok) {
      recargar();
      recargarTorneos();
    }
  }

  return (
    <>
      <Encabezado ruta="Administración / Torneos" titulo="Torneos" sub="Cada edición corresponde a un semestre" />
      <Error texto={errorAccion} />

      <div className="grilla-lado">
        <div>
          <div className="tarjeta">
            <h2>Ediciones del torneo</h2>
            <Cargando datos={torneos} error={error} />
            {torneos && (
              <table className="tabla">
                <thead>
                  <tr><th>Nombre</th><th>Año</th><th>Sem.</th><th>Inicio</th><th>Fin</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {[...torneos].reverse().map((t) => (
                    <tr key={t.id_torneo}>
                      <td className="negrita">{t.nombre}</td>
                      <td>{t.anio}</td>
                      <td>{t.semestre}°</td>
                      <td>{fechaCorta(t.fecha_inicio)}/{t.fecha_inicio.slice(2, 4)}</td>
                      <td>{fechaCorta(t.fecha_fin)}/{t.fecha_fin.slice(2, 4)}</td>
                      <td><Estado estado={t.estado} /></td>
                      <td className="derecha">
                        <button className="boton-chico" onClick={() => setIdTorneo(t.id_torneo)}>Ver</button>
                        {SIGUIENTE[t.estado] && (
                          <button className="boton-chico" disabled={ocupado} onClick={() => avanzar(t)}>
                            Pasar a {SIGUIENTE[t.estado]}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="tarjeta">
            <h2>Ciclo de vida de una edición</h2>
            <div className="ciclo">
              <div><span className="etiqueta estado-inscripcion">Inscripción</span><p className="chico gris">Alta de equipos y planteles.</p></div>
              <div className="flecha">→</div>
              <div><span className="etiqueta estado-en-curso">En curso</span><p className="chico gris">Fixture, planillas y sanciones. Los planteles quedan bloqueados.</p></div>
              <div className="flecha">→</div>
              <div><span className="etiqueta estado-finalizado">Finalizado</span><p className="chico gris">Solo consulta y reportes históricos.</p></div>
            </div>
            <p className="chico gris">Para pasar a “en curso” cada equipo tiene que tener entre 5 y 10 jugadores y su capitán en el plantel.</p>
          </div>
        </div>

        <form className="tarjeta formulario" onSubmit={crear}>
          <h2>Nueva edición</h2>
          <label>Nombre<input value={form.nombre} onChange={cambiar("nombre")} required /></label>
          <div className="fila">
            <label>Año<input type="number" value={form.anio} onChange={cambiar("anio")} required /></label>
            <label>Semestre
              <select value={form.semestre} onChange={cambiar("semestre")}>
                <option value="1">1° semestre</option>
                <option value="2">2° semestre</option>
              </select>
            </label>
          </div>
          <div className="fila">
            <label>Fecha de inicio<input type="date" value={form.fecha_inicio} onChange={cambiar("fecha_inicio")} required /></label>
            <label>Fecha de fin<input type="date" value={form.fecha_fin} onChange={cambiar("fecha_fin")} required /></label>
          </div>
          <div className="nota">La edición se crea en estado “inscripción”.</div>
          <button className="boton" disabled={ocupado}>Crear edición</button>
        </form>
      </div>
    </>
  );
}
