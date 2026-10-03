import Link from 'next/link';

import { Container } from '@/components/ui/Container';

export default function NotFound() {
  return (
    <Container className="pt-20">
      <p className="kicker">Not found</p>
      <h1 className="mt-3 text-[2.5rem]">There is no record at this address</h1>
      <p className="mt-4">The campaign or page may have moved, or the link may be mistyped.</p>
      <Link href="/campaigns" className="btn btn-primary mt-8">
        Browse campaigns
      </Link>
    </Container>
  );
}
