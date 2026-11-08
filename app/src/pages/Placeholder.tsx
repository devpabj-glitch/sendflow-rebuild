export default function Placeholder({ title, note, locked }: { title: string; note: string; locked?: boolean }) {
  return (
    <div className="ov">
      <section className="ov-card ov-slot" style={{ minHeight: 420 }}>
        <header><h2>{title}</h2></header>
        <p>{locked ? 'Este recurso ainda não está liberado no plano atual.' : 'Nenhum registro encontrado'}</p>
        <p className="ov-meta" style={{ textAlign: 'center' }}>{note}</p>
      </section>
    </div>
  )
}
