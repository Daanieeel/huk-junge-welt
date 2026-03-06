import { MainShell } from "@/components/layout/main-shell";
import { VertragDetailScreen } from "@/components/vertraege/vertrag-detail-screen";

export default async function VertragDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MainShell>
      <VertragDetailScreen insuranceId={id} />
    </MainShell>
  );
}
