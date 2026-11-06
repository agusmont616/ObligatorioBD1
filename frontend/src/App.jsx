import { Navigate, Route, Routes } from "react-router-dom";
import { SesionProvider, useSesion } from "./Sesion.jsx";
import Layout from "./componentes/Layout.jsx";
import Login from "./paginas/Login.jsx";
import Inicio from "./paginas/Inicio.jsx";
import Torneos from "./paginas/Torneos.jsx";
import Jugadores from "./paginas/Jugadores.jsx";
import Equipos from "./paginas/Equipos.jsx";
import EquipoDetalle from "./paginas/EquipoDetalle.jsx";
import Complejos from "./paginas/Complejos.jsx";
import Partidos from "./paginas/Partidos.jsx";
import ProgramarPartido from "./paginas/ProgramarPartido.jsx";
import Sanciones from "./paginas/Sanciones.jsx";
import Configuracion from "./paginas/Configuracion.jsx";
import MisPartidos from "./paginas/MisPartidos.jsx";
import Planilla from "./paginas/Planilla.jsx";
import Reportes from "./paginas/Reportes.jsx";

function Rutas() {
  const { usuario, cargando } = useSesion();

  if (cargando) return <div className="cargando">Cargando...</div>;
  if (!usuario) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  const esAdmin = usuario.rol === "administrador";
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to={esAdmin ? "/inicio" : "/mis-partidos"} replace />} />
        {esAdmin && (
          <>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/torneos" element={<Torneos />} />
            <Route path="/jugadores" element={<Jugadores />} />
            <Route path="/equipos" element={<Equipos />} />
            <Route path="/equipos/:id" element={<EquipoDetalle />} />
            <Route path="/complejos" element={<Complejos />} />
            <Route path="/partidos" element={<Partidos />} />
            <Route path="/partidos/nuevo" element={<ProgramarPartido />} />
            <Route path="/partidos/:id/editar" element={<ProgramarPartido />} />
            <Route path="/planillas" element={<MisPartidos />} />
            <Route path="/sanciones" element={<Sanciones />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </>
        )}
        {!esAdmin && <Route path="/mis-partidos" element={<MisPartidos />} />}
        <Route path="/planilla/:id" element={<Planilla />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <SesionProvider>
      <Rutas />
    </SesionProvider>
  );
}
