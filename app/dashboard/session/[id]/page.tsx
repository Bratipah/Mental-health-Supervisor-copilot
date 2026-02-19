import SessionDetail from '@/components/analysis/SessionDetail'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SessionDetail sessionId={id} />
}
