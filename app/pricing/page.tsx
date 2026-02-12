import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PricingPageProps {
  searchParams: Promise<{ canceled?: string }>;
}

/** Redirect /pricing to /premium (canonical Premium page). */
export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { canceled } = await searchParams;
  const params = new URLSearchParams();
  if (canceled === 'true') params.set('canceled', 'true');
  const qs = params.toString();
  redirect(qs ? `/premium?${qs}` : '/premium');
}
