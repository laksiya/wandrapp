import TripClient from './TripClient'

interface TripPageProps {
  params: Promise<{ tripId: string }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { tripId } = await params

  return <TripClient tripId={tripId} />
}
