"use client";

import { useEffect } from "react";
import { useBedarfscheckStore, TOTAL_STEPS, type BedarfscheckStep } from "@/lib/bedarfscheck-store";
import { useSubmitQuestionnaire, usePutQuestionnaire, useQuestionnaireQuery } from "@/lib/queries";
import { StepIndicator } from "./step-indicator";
import { StepNavBar } from "./step-nav-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { IntroScreen } from "./intro-screen";
import { StepPersonal } from "./step-personal";
import { StepEmployment } from "./step-employment";
import { StepMobility } from "./step-mobility";
import { StepFamily } from "./step-family";
import { StepGoal } from "./step-goal";
import { CompletionScreen } from "./completion-screen";

// ============================================================================
// Component
// ============================================================================

interface BedarfscheckScreenProps {
  userName: string | null;
  hasExistingQuestionnaire?: boolean;
}

export function BedarfscheckScreen({
  userName,
  hasExistingQuestionnaire = false,
}: BedarfscheckScreenProps) {
  const {
    step,
    completedSteps,
    formData,
    setStep,
    updateFormData,
    markStepCompleted,
    goToPrevStep,
    prefillFromQuestionnaire,
  } = useBedarfscheckStore();

  const postMutation = useSubmitQuestionnaire();
  const putMutation = usePutQuestionnaire();
  const submitMutation = hasExistingQuestionnaire ? putMutation : postMutation;

  const { data: questionnaireData, isLoading: isLoadingQuestionnaire } = useQuestionnaireQuery();

  // Auto-prefill when the user has existing questionnaire data and lands on the intro screen
  useEffect(() => {
    if (step === 0 && questionnaireData) {
      prefillFromQuestionnaire(questionnaireData);
    }
  }, [step, questionnaireData, prefillFromQuestionnaire]);

  const goToStep = (s: BedarfscheckStep) => setStep(s);
  const DONE_STEP = (TOTAL_STEPS + 1) as BedarfscheckStep;

  // ── Step completion handlers ───────────────────────────────────────────────

  const handleStep1 = (data: {
    dateOfBirth: string;
    streetName: string;
    streetNumber: string;
    zipcode: string;
    city: string;
    housingType: string;
    housingOwnershipType: string | null;
  }) => {
    updateFormData(data);
    markStepCompleted(1);
    goToStep(2);
  };

  const handleStep2 = (data: {
    jobType: string;
    jobExpiryDate: string | null;
    salary: string;
  }) => {
    updateFormData(data);
    markStepCompleted(2);
    goToStep(3);
  };

  const handleStep3 = (data: { vehicleTypes: string[] }) => {
    updateFormData(data);
    markStepCompleted(3);
    goToStep(4);
  };

  const handleStep4 = (data: {
    relationshipStatus: string;
    childrenCount: number;
  }) => {
    updateFormData(data);
    markStepCompleted(4);
    goToStep(5);
  };

  const handleStep5 = async (data: { goal: string }) => {
    const merged = { ...formData, ...data };
    updateFormData(data);

    const salary = merged.salary !== "" ? Number.parseFloat(merged.salary) : null;

    await submitMutation.mutateAsync({
      dateOfBirth: merged.dateOfBirth,
      jobType: merged.jobType!,
      jobExpiryDate: merged.jobExpiryDate ?? null,
      salary,
      vehicleTypes: merged.vehicleTypes,
      streetName: merged.streetName || null,
      streetNumber: merged.streetNumber || null,
      zipcode: merged.zipcode || null,
      city: merged.city || null,
      housingType: merged.housingType ?? null,
      housingOwnershipType: merged.housingOwnershipType ?? null,
      relationshipStatus: merged.relationshipStatus!,
      childrenCount: merged.childrenCount,
      goal: data.goal,
    });

    markStepCompleted(5);
    goToStep(DONE_STEP);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step === 0) {
    // Show skeleton while we wait to see if there's existing data to prefill
    if (hasExistingQuestionnaire && isLoadingQuestionnaire) {
      return (
        <div className="px-5 pt-6 flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-64" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      );
    }
    return <IntroScreen userName={userName} onStart={() => goToStep(1)} />;
  }

  if (step === DONE_STEP) {
    return (
      <div className="h-full px-4 py-6">
        <CompletionScreen userName={userName} />
      </div>
    );
  }

  const currentStep = step as 1 | 2 | 3 | 4 | 5;

  return (
    <div>
      {/* Step indicator header */}
      <div className="px-4 pt-4 pb-3">
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      {/* Step content */}
      {currentStep === 1 && (
        <StepPersonal
          defaultDateOfBirth={formData.dateOfBirth}
          defaultValues={{
            streetName: formData.streetName,
            streetNumber: formData.streetNumber,
            zipcode: formData.zipcode,
            city: formData.city,
            housingType: formData.housingType,
            housingOwnershipType: formData.housingOwnershipType,
          }}
          onComplete={handleStep1}
        />
      )}
      {currentStep === 2 && (
        <StepEmployment
          defaultJobType={formData.jobType}
          defaultJobExpiryDate={formData.jobExpiryDate}
          defaultSalary={formData.salary}
          onComplete={handleStep2}
        />
      )}
      {currentStep === 3 && (
        <StepMobility
          defaultVehicleTypes={formData.vehicleTypes}
          onComplete={handleStep3}
        />
      )}
      {currentStep === 4 && (
        <StepFamily
          defaultRelationshipStatus={formData.relationshipStatus}
          defaultChildrenCount={formData.childrenCount}
          onComplete={handleStep4}
        />
      )}
      {currentStep === 5 && (
        <StepGoal
          defaultGoal={formData.goal}
          onComplete={handleStep5}
        />
      )}

      {/* Nav bar — sticky so it's always visible above bottom nav */}
      <StepNavBar
        onBack={currentStep > 1 ? goToPrevStep : undefined}
        isLastStep={currentStep === TOTAL_STEPS}
        isLoading={submitMutation.isPending}
      />
    </div>
  );
}
