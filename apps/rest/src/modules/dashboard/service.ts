import {
  InsuranceType,
  VehicleType,
  type Insurance,
  type Proposal,
  type Questionnaire,
} from "@repo/database";

// ============================================================================
// Types
// ============================================================================

export type CoverageStatus = "covered" | "recommended" | "not_covered";

export type CoverageItem = {
  type: string;
  status: CoverageStatus;
  coverageScore: number | null;
  insurance: { id: string; company: string; rate: string; interval: string } | null;
  proposal: {
    id: string;
    company: string;
    rate: string;
    interval: string;
    priority: number | null;
    reason: string | null;
  } | null;
};

// ============================================================================
// Service
// ============================================================================

/**
 * Derives which insurance types are recommended for a user based on their
 * questionnaire profile. Returns a deduplicated ordered array.
 */
export function deriveRecommendedTypes(questionnaire: Questionnaire | null): InsuranceType[] {
  const types: InsuranceType[] = [
    InsuranceType.PRIVATHAFTPFLICHT,
    InsuranceType.ZAHNZUSATZ,
    InsuranceType.RECHTSSCHUTZ,
  ];

  if (!questionnaire) return types;

  const hasVehicle = questionnaire.vehicleTypes.some(
    (v: VehicleType) => v !== VehicleType.NONE && v !== VehicleType.PUBLIC_TRANSPORT
  );
  if (hasVehicle) types.push(InsuranceType.KFZ);

  if (questionnaire.housingType === "APARTMENT" || questionnaire.housingType === "HOUSE") {
    types.push(InsuranceType.HAUSRAT);
  }

  if (questionnaire.jobType === "EMPLOYEE" || questionnaire.jobType === "APPRENTICE") {
    types.push(InsuranceType.BERUFSUNFAEHIGKEIT);
  }

  if (questionnaire.relationshipStatus === "MARRIED" || questionnaire.childrenCount > 0) {
    types.push(InsuranceType.UNFALL);
    types.push(InsuranceType.PFLEGE);
  }

  const ageMs = Date.now() - new Date(questionnaire.dateOfBirth).getTime();
  const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365));
  if (age >= 25) types.push(InsuranceType.KRANKENZUSATZ);

  return [...new Set(types)];
}

export function buildInsuranceItem(type: InsuranceType, insurance: Insurance): CoverageItem {
  return {
    type,
    status: "covered",
    coverageScore: insurance.coverageScore ?? null,
    insurance: {
      id: insurance.id,
      company: insurance.company,
      rate: insurance.rate.toString(),
      interval: insurance.interval,
    },
    proposal: null,
  };
}

export function buildProposalItem(type: InsuranceType, proposal: Proposal | null): CoverageItem {
  return {
    type,
    status: proposal ? "recommended" : "not_covered",
    coverageScore: null,
    insurance: null,
    proposal: proposal
      ? {
          id: proposal.id,
          company: proposal.company,
          rate: proposal.rate.toString(),
          interval: proposal.interval,
          priority: proposal.priority ?? null,
          reason: proposal.reason ?? null,
        }
      : null,
  };
}

export function buildCoverageItems(
  insurances: Insurance[],
  proposals: Proposal[],
  recommendedTypes: InsuranceType[]
): CoverageItem[] {
  const seenTypes = new Set<string>();
  const items: CoverageItem[] = [];

  for (const type of recommendedTypes) {
    seenTypes.add(type);
    const insurance = insurances.find((i: Insurance) => i.type === type) ?? null;
    const proposal = proposals.find((p: Proposal) => p.type === type) ?? null;
    items.push(insurance ? buildInsuranceItem(type, insurance) : buildProposalItem(type, proposal));
  }

  for (const insurance of insurances) {
    if (!seenTypes.has(insurance.type)) {
      items.push(buildInsuranceItem(insurance.type as InsuranceType, insurance));
    }
  }

  return items;
}

export function computeInsuranceScore(insurances: Insurance[], items: CoverageItem[]): number {
  const covered = items.filter((i: CoverageItem) => i.status === "covered").length;
  const total = items.length;
  if (total === 0) return 0;

  const coverageRatio = covered / total;
  const scored = insurances.filter((i: Insurance) => i.coverageScore !== null);
  const avgQuality =
    scored.length > 0
      ? scored.reduce((sum: number, i: Insurance) => sum + (i.coverageScore ?? 70), 0) /
        scored.length
      : 70;

  return Math.round(coverageRatio * 70 + (avgQuality / 100) * 30);
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Sehr gut";
  if (score >= 65) return "Gut";
  if (score >= 45) return "Ausbaufähig";
  return "Lückenhaft";
}
