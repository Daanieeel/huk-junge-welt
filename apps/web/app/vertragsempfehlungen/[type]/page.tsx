import { MainShell } from "@/components/layout/main-shell";
import { ProposalDetailScreen } from "@/components/proposals/proposal-detail-screen";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  return (
    <MainShell>
      <ProposalDetailScreen slug={type} />
    </MainShell>
  );
}
