import { NavLink, Outlet } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import Logo from "./Logo.jsx";

const MENU_ADMIN = [
  ["/inicio", "Inicio"],
  ["/torneos", "Torneos"],
  ["/jugadores", "Jugadores"],
  ["/equipos", "Equipos y planteles"],
  ["/complejos", "Complejos y canchas"],
  ["/partidos", "Partidos / Fixture"],
  ["/planillas", "Planillas"],
  ["/sanciones", "Sanciones"],
  ["/reportes", "Reportes"],
  ["/configuracion", "Configuración"],
];

const MENU_PLANILLERO = [
  ["/mis-partidos", "Mis partidos"],
  ["/reportes", "Reportes"],
];

export const ESTADOS_TORNEO = { inscripcion: "Inscripción", "en curso": "En curso", finalizado: "Finalizado" };

export default function Layout() {
  const { usuario, salir, torneos, torneo, idTorneo, setIdTorneo } = useSesion();
  const esAdmin = usuario.rol === "administrador";
  const menu = esAdmin ? MENU_ADMIN : MENU_PLANILLERO;
  const nombre = usuario.correo.split("@")[0];

  return (
    <div className="app">
      <aside className="lateral">
        <div className="lateral-titulo">{esAdmin ? "Administración" : "Planillero"}</div>
        <nav>
          {menu.map(([ruta, texto]) => (
            <NavLink key={ruta} to={ruta} className="lateral-link">
              {texto}
            </NavLink>
          ))}
        </nav>
        <button className="lateral-salir" onClick={salir}>
          Cerrar sesión
        </button>
      </aside>

      <div className="principal">
        <header className="encabezado">
          <div className="encabezado-marca">
            <Logo chico />
            <div>
              <div className="encabezado-titulo">Torneo Interfacultades</div>
              <div className="encabezado-sub">Fútbol 5 · Gestión del torneo</div>
            </div>
          </div>

          <div className="encabezado-derecha">
            <select value={idTorneo ?? ""} onChange={(e) => setIdTorneo(Number(e.target.value))}>
              {torneos.map((t) => (
                <option key={t.id_torneo} value={t.id_torneo}>
                  Edición {t.anio} · {t.semestre}° semestre
                </option>
              ))}
            </select>
            {torneo && (
              <span className={"etiqueta estado-" + torneo.estado.replace(" ", "-")}>
                {ESTADOS_TORNEO[torneo.estado]}
              </span>
            )}
            <div className="usuario">
              <div className="avatar">{nombre.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="usuario-nombre">{nombre}</div>
                <div className="usuario-rol">{usuario.rol}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
