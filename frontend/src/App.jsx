import { Navigate, Route, Routes } from "react-router-dom";
import { SesionProvider, useSesion } from "./Sesion.jsx";
import Layout from "./componentes/Layout.jsx";
import Login from "./paginas/Login.jsx";
import Reportes from "./paginas/Reportes.jsx";
import Pendiente from "./paginas/Pendiente.jsx";

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
            <Route path="/inicio" element={<Pendiente titulo="Inicio" />} />
            <Route path="/torneos" element={<Pendiente titulo="Torneos" />} />
            <Route path="/jugadores" element={<Pendiente titulo="Jugadores" />} />
            <Route path="/equipos" element={<Pendiente titulo="Equipos y planteles" />} />
            <Route path="/complejos" element={<Pendiente titulo="Complejos y canchas" />} />
            <Route path="/partidos" element={<Pendiente titulo="Partidos / Fixture" />} />
            <Route path="/planillas" element={<Pendiente titulo="Planillas" />} />
            <Route path="/sanciones" element={<Pendiente titulo="Sanciones" />} />
            <Route path="/configuracion" element={<Pendiente titulo="Configuración" />} />
          </>
        )}
        <Route path="/mis-partidos" element={<Pendiente titulo="Mis partidos" />} />
        <Route path="/registrar-planilla" element={<Pendiente titulo="Registro de planilla" />} />
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
