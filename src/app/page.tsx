import Link from "next/link";

const menuItems = [
  { name: "Cerveza pinta", price: "$6.000" },
  { name: "Pizza muzza", price: "$24.000" },
  { name: "Fernet con Coca", price: "$7.000" },
];

const benefits = [
  {
    icon: "📈",
    title: "La segunda ronda ya no se pierde",
    body: "Cuando el cliente puede pedir cuando quiere, sin esperar al mozo, pide más seguido. Esa ronda que antes se olvidaba ahora llega sola desde la mesa.",
  },
  {
    icon: "🙌",
    title: "El equipo hace menos trabajo ingrato",
    body: "Sin tomar pedidos a mano, los mozos se liberan para llevar la comida a tiempo y estar donde hace falta. Más rendimiento, sin sumar personal.",
  },
  {
    icon: "📱",
    title: "El cliente no descarga nada",
    body: "Cámara del celular, QR, carta. Eso es todo. Sin app, sin registro, sin fricción. Funciona en cualquier celular.",
  },
];

const steps = [
  {
    title: "El cliente escanea el QR de la mesa",
    body: "Cada mesa tiene su propio código QR. Lo escanean con la cámara y se abre la carta de La Cuadra en el celular — sin descargar nada.",
  },
  {
    title: "Elige y confirma desde el celular",
    body: "Navegan la carta, agregan lo que quieren y mandan el pedido. En segundos, sin intermediarios.",
  },
  {
    title: "Cocina y mozos lo ven al instante",
    body: "El pedido aparece en pantalla en cocina. Cuando está listo, el mozo lo lleva. Sin papel, sin malentendidos.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">

      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex flex-col leading-none">
          <span className="font-logo text-2xl tracking-wide text-primary">LA CUADRA</span>
          <span className="text-[0.68rem] text-muted-foreground uppercase tracking-widest mt-0.5">
            Pide — sistema de pedidos por QR
          </span>
        </div>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
          Entrar →
        </Link>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 pt-20 pb-16 max-w-2xl mx-auto">
        <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Propuesta para La Cuadra
        </span>
        <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-tight tracking-tight mb-5">
          Casa de amigos.<br />
          <em className="not-italic text-primary">Que pidan como amigos.</em>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Tus clientes escanean el QR de la mesa, eligen de la carta y mandan el pedido desde el celular.
          Sin esperar, sin fricción — y vos vendés más con el mismo equipo.
        </p>
      </section>

      {/* PHONE MOCKUP */}
      <div className="flex justify-center mb-20">
        <div className="bg-gray-900 rounded-[2rem] p-4 w-[220px] shadow-2xl">
          <div className="bg-white rounded-[1.25rem] overflow-hidden">
            <div className="bg-primary px-4 py-3 text-xs font-bold text-primary-foreground">
              🍕 La Cuadra — Mesa 4
            </div>
            {menuItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 text-xs">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">{item.price}</div>
                </div>
                <div className="w-[22px] h-[22px] rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base leading-none">
                  +
                </div>
              </div>
            ))}
            <div className="m-2 bg-gray-900 text-white rounded-xl py-2.5 px-4 text-xs font-semibold text-center">
              Confirmar pedido →
            </div>
          </div>
        </div>
      </div>

      {/* BENEFITS */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Por qué funciona
          </p>
          <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.2rem)] font-extrabold tracking-tight mb-12">
            Más ventas, menos fricción
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {benefits.map((card) => (
              <div key={card.title} className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 max-w-xl mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Cómo funciona en La Cuadra
        </p>
        <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.2rem)] font-extrabold tracking-tight mb-12">
          Tres pasos, y listo
        </h2>
        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base z-10">
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
              </div>
              <div className={i < steps.length - 1 ? "pb-10" : ""}>
                <h4 className="font-bold text-base mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO LINKS */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Probalo en vivo
          </p>
          <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.2rem)] font-extrabold tracking-tight mb-12">
            Entrá a cada pantalla
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/mesa/8d6f4296-b6e4-4ce4-94b5-de300069cd70"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <span className="text-4xl">📱</span>
              <div>
                <h3 className="font-bold text-lg">Vista del cliente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Lo que ve el cliente cuando escanea el QR de la mesa.
                </p>
              </div>
              <span className="text-sm font-semibold text-primary mt-auto">Abrir →</span>
            </Link>
            <Link
              href="/admin"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <span className="text-4xl">⚙️</span>
              <div>
                <h3 className="font-bold text-lg">Panel admin</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestión de mesas, carta y usuarios. Requiere login.
                </p>
              </div>
              <span className="text-sm font-semibold text-primary mt-auto">Abrir →</span>
            </Link>
            <Link
              href="/cocina"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <span className="text-4xl">🍕</span>
              <div>
                <h3 className="font-bold text-lg">Pantalla de la barra</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Lo que ve la barra cuando llega un pedido. Requiere login.
                </p>
              </div>
              <span className="text-sm font-semibold text-primary mt-auto">Abrir →</span>
            </Link>
            <Link
              href="/mozo"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <span className="text-4xl">🛎️</span>
              <div>
                <h3 className="font-bold text-lg">Pantalla del mozo</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Lo que ve el mozo para saber qué llevar a cada mesa. Requiere login.
                </p>
              </div>
              <span className="text-sm font-semibold text-primary mt-auto">Abrir →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="bg-primary text-primary-foreground text-center px-6 py-20">
        <h2 className="font-logo text-[clamp(2rem,5vw,3rem)] tracking-wide mb-4">
          LISTO PARA LA CUADRA.
        </h2>
        <p className="text-base opacity-85 max-w-sm mx-auto">
          Sistema funcionando, carta cargada, mesas con QR. Solo falta ponerlo en marcha.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 text-sm text-muted-foreground border-t border-border">
        © 2026 Pide —{" "}
        <a href="mailto:famicucci@gmail.com" className="hover:underline">
          famicucci@gmail.com
        </a>
      </footer>

    </div>
  );
}
