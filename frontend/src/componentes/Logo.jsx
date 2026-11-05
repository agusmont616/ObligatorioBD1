export default function Logo({ chico }) {
  return (
    <div className={chico ? "logo logo-chico" : "logo"}>
      <span className="logo-circulo">U</span>
      <span>UCU</span>
    </div>
  );
}
