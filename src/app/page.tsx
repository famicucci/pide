import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  ClipboardCheck,
  History,
  PackageOpen,
  Settings,
  Smartphone,
} from "lucide-react";

const benefits = [
  {
    icon: Smartphone,
    title: "Carga rápida desde el celular",
    body: "El equipo actualiza cada cantidad en segundos, con una pantalla simple pensada para usar mientras trabaja.",
  },
  {
    icon: History,
    title: "Cada cambio queda registrado",
    body: "Sabés quién actualizó un artículo, cuándo lo hizo y cuál fue la diferencia respecto del valor anterior.",
  },
  {
    icon: BellRing,
    title: "Mínimos según la temporada",
    body: "Definís mínimos para temporada alta y baja. Pide te muestra qué artículos requieren atención cada día.",
  },
];

const steps = [
  "El administrador crea las categorías y los artículos.",
  "El equipo recorre el stock y actualiza las cantidades desde el celular.",
  "El panel detecta faltantes y conserva el historial completo.",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex flex-col leading-none">
            <span className="font-logo text-2xl tracking-wide text-primary">LA CUADRA</span>
            <span className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Pide · Control de stock
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login?access=stock"
              className="text-sm font-semibold text-muted-foreground hover:text-primary"
            >
              <span className="sm:hidden">Stock</span>
              <span className="hidden sm:inline">Cargar stock</span>
            </Link>
            <Link
              href="/login?access=admin"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Administrador
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex rounded-full bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
                Hecho para La Cuadra
              </span>
              <h1 className="mt-6 max-w-3xl text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold leading-[0.98] tracking-tight">
                El stock claro.
                <br />
                <span className="text-primary">Sin más planillas.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Pide convierte el control manual de inventario en una tarea rápida desde el celular.
                Cantidades actualizadas, alertas de mínimos e historial, todo en un solo lugar.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?access=stock"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Cargar stock <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login?access=admin"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-white px-6 font-semibold hover:bg-muted"
                >
                  Panel administrador
                </Link>
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-[2.25rem] bg-neutral-950 p-3 shadow-2xl">
                <div className="overflow-hidden rounded-[1.7rem] bg-muted/50">
                  <div className="border-b bg-white px-5 py-4">
                    <p className="font-logo text-lg text-primary">LA CUADRA</p>
                    <p className="text-xs text-muted-foreground">Actualizar stock</p>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Gin
                    </p>
                    {[
                      { brand: "Beefeater", name: "London Dry", stock: "4" },
                      { brand: "Bombay", name: "Gin", stock: "2" },
                      { brand: "Tanqueray", name: "London Dry", stock: "1", low: true },
                    ].map((item) => (
                      <div
                        key={`${item.brand}-${item.name}`}
                        className={`rounded-2xl border bg-white p-4 ${item.low ? "border-amber-300" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                              {item.brand}
                            </p>
                            <p className="text-sm font-bold">{item.name}</p>
                          </div>
                          {item.low && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">
                              Stock bajo
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <div className="flex h-10 flex-1 items-center justify-center rounded-lg border text-lg font-bold">
                            {item.stock}
                          </div>
                          <div className="flex h-10 items-center rounded-lg bg-primary px-4 text-xs font-bold text-white">
                            Guardar
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/40 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-primary">
              Más simple para el equipo
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              La información que necesitás, sin cambiar toda tu forma de trabajar
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-primary">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Cómo funciona
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                  De la planilla al celular, sin complicaciones
                </h2>
              </div>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <p className="pt-1.5 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-neutral-950 px-5 py-20 text-white sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-red-300">Probalo en vivo</p>
              <h2 className="mt-3 text-3xl font-extrabold">Elegí cómo querés entrar</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Link
                href="/login?access=admin"
                className="group rounded-2xl border border-white/15 bg-white/5 p-7 transition-colors hover:bg-white/10"
              >
                <Settings className="h-8 w-8 text-red-300" />
                <h3 className="mt-5 text-xl font-bold">Panel administrador</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Gestioná artículos, mínimos, temporadas, alertas e historial.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-red-300">
                  Entrar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/login?access=stock"
                className="group rounded-2xl border border-white/15 bg-white/5 p-7 transition-colors hover:bg-white/10"
              >
                <ClipboardCheck className="h-8 w-8 text-red-300" />
                <h3 className="mt-5 text-xl font-bold">Carga de stock</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Actualizá las cantidades de forma rápida desde el celular.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-red-300">
                  Entrar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-5 py-6 text-center text-sm text-muted-foreground">
        <PackageOpen className="mx-auto mb-2 h-5 w-5 text-primary" />
        © 2026 Pide para La Cuadra
      </footer>
    </div>
  );
}
