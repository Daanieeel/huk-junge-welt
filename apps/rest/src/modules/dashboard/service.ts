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
  /**
   * For "recommended" items: the HUK proposal.
   * For "covered" items: an alternative HUK proposal (when isAlternative === true).
   */
  proposal: {
    id: string;
    company: string;
    rate: string;
    interval: string;
    priority: number | null;
    reason: string | null;
  } | null;
  /** True when the user already has this insurance AND there is a goal-relevant HUK alternative. */
  isAlternative: boolean;
  /** Monthly savings if switching to the HUK proposal (positive = user saves money). Null when not applicable. */
  savingsPerMonth: number | null;
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

  types.push(InsuranceType.AUSLANDS_KRANKEN);

  return [...new Set(types)];
}

/**
 * Determines whether a HUK proposal should be shown as a goal-relevant alternative
 * to the user's existing insurance.
 *
 * Rules by goal:
 *  CHEAPEST      → only show if HUK is strictly cheaper
 *  BEST_VALUE    → only show if HUK is cheaper or at most 5 % more expensive
 *  COMPREHENSIVE → show as long as a proposal exists (coverage is the priority)
 *  null          → same as BEST_VALUE
 */
function shouldShowAlternative(
  insurance: Insurance,
  proposal: Proposal,
  goal: string | null
): boolean {
  const proposalRate = Number(proposal.rate);
  const insuranceRate = Number(insurance.rate);

  if (goal === "CHEAPEST") {
    return proposalRate < insuranceRate;
  }

  if (goal === "COMPREHENSIVE") {
    return true;
  }

  // BEST_VALUE or no goal: only worthwhile if HUK isn't significantly more expensive
  return proposalRate <= insuranceRate * 1.05;
}

export function buildCoverageItems(
  insurances: Insurance[],
  proposals: Proposal[],
  recommendedTypes: InsuranceType[],
  goal: string | null = null
): CoverageItem[] {
  const seenTypes = new Set<string>();
  const items: CoverageItem[] = [];

  for (const type of recommendedTypes) {
    seenTypes.add(type);
    const insurance = insurances.find((i: Insurance) => i.type === type) ?? null;
    const proposal = proposals.find((p: Proposal) => p.type === type) ?? null;

    if (insurance) {
      const isAlternative = proposal !== null && shouldShowAlternative(insurance, proposal, goal);
      const savingsPerMonth =
        isAlternative && proposal
          ? Math.round((Number(insurance.rate) - Number(proposal.rate)) * 100) / 100
          : null;

      items.push({
        type,
        status: "covered",
        coverageScore: insurance.coverageScore ?? null,
        insurance: {
          id: insurance.id,
          company: insurance.company,
          rate: insurance.rate.toString(),
          interval: insurance.interval,
        },
        proposal:
          isAlternative && proposal
            ? {
                id: proposal.id,
                company: proposal.company,
                rate: proposal.rate.toString(),
                interval: proposal.interval,
                priority: proposal.priority ?? null,
                reason: proposal.reason ?? null,
              }
            : null,
        isAlternative,
        savingsPerMonth,
      });
    } else {
      items.push({
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
        isAlternative: false,
        savingsPerMonth: null,
      });
    }
  }

  // Include any insurances for types that were not in the recommended list
  for (const insurance of insurances) {
    if (!seenTypes.has(insurance.type)) {
      const proposal = proposals.find((p: Proposal) => p.type === insurance.type) ?? null;
      const isAlternative =
        proposal !== null && shouldShowAlternative(insurance, proposal, goal);
      const savingsPerMonth =
        isAlternative && proposal
          ? Math.round((Number(insurance.rate) - Number(proposal.rate)) * 100) / 100
          : null;

      items.push({
        type: insurance.type,
        status: "covered",
        coverageScore: insurance.coverageScore ?? null,
        insurance: {
          id: insurance.id,
          company: insurance.company,
          rate: insurance.rate.toString(),
          interval: insurance.interval,
        },
        proposal:
          isAlternative && proposal
            ? {
                id: proposal.id,
                company: proposal.company,
                rate: proposal.rate.toString(),
                interval: proposal.interval,
                priority: proposal.priority ?? null,
                reason: proposal.reason ?? null,
              }
            : null,
        isAlternative,
        savingsPerMonth,
      });
    }
  }

  return items;
}

export function computeInsuranceScore(insurances: Insurance[], items: CoverageItem[]): number {
  const covered = items.filter((i: CoverageItem) => i.status === "covered").length;
  const total = items.length;
  if (total === 0) return 0;

  if (covered === 0) return 0;

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
