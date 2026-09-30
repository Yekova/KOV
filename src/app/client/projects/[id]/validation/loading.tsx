// L'attente de l'espace de validation.
//
// §70 : une silhouette de la carte, pas un rond qui tourne au centre. La
// différence n'est pas décorative — la silhouette dit où les choses vont
// apparaître, donc l'œil est déjà au bon endroit quand elles arrivent.
// Un spinner central ne dit rien d'autre que « attendez ».

function Block({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`kov-skeleton ${className}`} style={{ borderRadius: "var(--radius-sm)", ...style }} />;
}

export default function ValidationLoading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-8 md:px-10">
      <div className="mb-6">
        <Block className="h-3 w-32" />
        <Block className="mt-4 h-8 w-80" />
        <Block className="mt-4 h-4 w-full max-w-xl" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="kov-card px-4 py-3">
            <Block className="h-2.5 w-24" />
            <Block className="mt-2 h-5 w-12" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* La silhouette de la carte : trois couloirs, comme en vrai. */}
        <div className="kov-card hidden p-6 lg:block" style={{ height: "min(72vh, 680px)" }}>
          <div className="flex h-full flex-col justify-center gap-10">
            {[0, 1, 2].map((lane) => (
              <div key={lane} className="flex items-center gap-8">
                <Block className="h-24 w-40 shrink-0" style={{ borderRadius: "16px" }} />
                <div className="flex flex-col gap-3">
                  <Block className="h-10 w-28" style={{ borderRadius: "16px" }} />
                  <Block className="h-10 w-28" style={{ borderRadius: "16px" }} />
                </div>
                <Block className="h-10 w-28 shrink-0" style={{ borderRadius: "16px" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="kov-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Block className="h-4 w-40" />
              <Block className="ml-auto h-9 w-56" style={{ borderRadius: "var(--radius-pill)" }} />
            </div>
            <Block className="h-[min(52vh,520px)] w-full" style={{ borderRadius: 0 }} />
          </div>

          <div className="kov-card p-4" style={{ height: "min(46vh, 460px)" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="mb-6">
                <Block className="h-3 w-28" />
                <Block className="mt-2 h-4 w-full" />
                <Block className="mt-1.5 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
