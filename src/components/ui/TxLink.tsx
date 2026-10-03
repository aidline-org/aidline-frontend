import { explorer } from '@/lib/config';

export function TxLink({
  hash,
  children = 'View transaction',
}: {
  hash: string;
  children?: React.ReactNode;
}) {
  return (
    <a href={explorer.tx(hash)} target="_blank" rel="noreferrer" className="link text-[0.8125rem]">
      {children}
    </a>
  );
}
