import { MainShell } from "@/components/layout/main-shell";
import { ProposalMehrInfosScreen } from "@/components/proposals/proposal-mehr-infos-screen";

export default async function ProposalMehrInfosPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  return (
    <MainShell>
      <ProposalMehrInfosScreen slug={type} />
    </MainShell>
  );
}
