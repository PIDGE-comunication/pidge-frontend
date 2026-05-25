import PresencasClient from './PresencasClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PresencasPage({ params }: Props) {
  const { id } = await params
  return <PresencasClient id={id} />
}
