import OrderForm from "./OrderForm";

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#f4f7f5] px-4 py-6 text-[#17211b] sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="pt-2 sm:pt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#44735a]">
            Nuevo pedido
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#142018] sm:text-4xl">
            Solicitud de servicio logistico
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#526158]">
            Carga los datos principales del traslado. Al confirmar, el pedido
            quedara preparado para procesarse y enviar la notificacion por mail.
          </p>
        </header>

        <OrderForm />
      </section>
    </main>
  );
}
