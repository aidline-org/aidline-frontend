import { Container } from '@/components/ui/Container';

export default function Loading() {
  return (
    <Container className="pt-12">
      <p className="kicker">Loading</p>
      <div className="mt-6 h-10 max-w-xl animate-pulse bg-rule" />
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse bg-rule" />
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading
      </span>
    </Container>
  );
}
