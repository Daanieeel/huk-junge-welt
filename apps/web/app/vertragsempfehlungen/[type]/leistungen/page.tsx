import { MainShell } from "@/components/layout/main-shell";
import { ProposalLeistungenScreen } from "@/components/proposals/proposal-leistungen-screen";

export default async function ProposalLeistungenPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  return (
    <MainShell>
      <ProposalLeistungenScreen slug={type} />
    </MainShell>
  );
}
