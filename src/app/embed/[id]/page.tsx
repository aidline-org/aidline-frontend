import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmbedShortLinkPage({ params }: Props) {
  const { id } = await params;
  redirect(`/embed/campaigns/${id}`);
}
