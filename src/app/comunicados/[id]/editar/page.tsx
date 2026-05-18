import ComunicadoEditor from '../../_components/ComunicadoEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarComunicadoPage({ params }: Props) {
  const { id } = await params
  return <ComunicadoEditor comunicadoId={id} />
}
