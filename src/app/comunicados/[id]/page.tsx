import ComunicadoDetalheClient from './ComunicadoDetalheClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ComunicadoDetalhePage({ params }: Props) {
  const { id } = await params
  return <ComunicadoDetalheClient id={id} />
}
