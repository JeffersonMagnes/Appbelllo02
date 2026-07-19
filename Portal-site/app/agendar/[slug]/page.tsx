import { redirect } from 'next/navigation';

export default function Page({ params }: { params: { slug: string } }) {
  redirect(`/p/${params.slug}?tab=agendar`);
}
