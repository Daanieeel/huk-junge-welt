"use client";

import {
  useBedarfscheckStore,
  TOTAL_STEPS,
  type BedarfscheckStep,
} from "@/lib/bedarfscheck-store";
import { useSubmitQuestionnaire, usePutQuestionnaire } from "@/lib/queries";
import { StepIndicator } from "./step-indicator";
import { IntroScreen } from "./intro-screen";
import { StepPersonal } from "./step-personal";
import { StepEmployment } from "./step-employment";
import { StepMobility } from "./step-mobility";
import { StepAddress } from "./step-address";
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

export function BedarfscheckScreen({ userName, hasExistingQuestionnaire = false }: BedarfscheckScreenProps) {
  const {
    step,
    completedSteps,
    formData,
    setStep,
    updateFormData,
    markStepCompleted,
    goToPrevStep,
  } = useBedarfscheckStore();

  const postMutation = useSubmitQuestionnaire();
  const putMutation = usePutQuestionnaire();
  const submitMutation = hasExistingQuestionnaire ? putMutation : postMutation;

  const goToStep = (s: BedarfscheckStep) => setStep(s);
  const DONE_STEP = (TOTAL_STEPS + 1) as BedarfscheckStep;

  // ── Step completion handlers ───────────────────────────────────────────────

  const handleStep1 = (data: { name: string; dateOfBirth: string }) => {
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
    streetName: string;
    streetNumber: string;
    zipcode: string;
    city: string;
    housingType: string;
    housingOwnershipType: string | null;
  }) => {
    updateFormData(data);
    markStepCompleted(4);
    goToStep(5);
  };

  const handleStep5 = (data: {
    relationshipStatus: string;
    childrenCount: number;
  }) => {
    updateFormData(data);
    markStepCompleted(5);
    goToStep(6);
  };

  const handleStep6 = async (data: { goal: string }) => {
    const merged = { ...formData, ...data };
    updateFormData(data);

    const salary =
      merged.salary !== "" ? parseFloat(merged.salary) : null;

    await submitMutation.mutateAsync({
      name: merged.name,
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

    markStepCompleted(6);
    goToStep(DONE_STEP);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step === 0) {
    return <IntroScreen userName={userName} onStart={() => goToStep(1)} />;
  }

  if (step === DONE_STEP) {
    return (
      <div className="h-full px-4 py-6">
        <CompletionScreen userName={userName} />
      </div>
    );
  }

  const currentStep = step as 1 | 2 | 3 | 4 | 5 | 6;

  return (
    <div className="h-full flex flex-col">
      {/* Step indicator header */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-[11px] text-muted-foreground mb-2.5">
          Schritt {currentStep} von {TOTAL_STEPS}
        </p>
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0">
        {currentStep === 1 && (
          <StepPersonal
            defaultName={formData.name}
            defaultDateOfBirth={formData.dateOfBirth}
            onComplete={handleStep1}
            onBack={goToPrevStep}
          />
        )}
        {currentStep === 2 && (
          <StepEmployment
            defaultJobType={formData.jobType}
            defaultJobExpiryDate={formData.jobExpiryDate}
            defaultSalary={formData.salary}
            onComplete={handleStep2}
            onBack={goToPrevStep}
          />
        )}
        {currentStep === 3 && (
          <StepMobility
            defaultVehicleTypes={formData.vehicleTypes}
            onComplete={handleStep3}
            onBack={goToPrevStep}
          />
        )}
        {currentStep === 4 && (
          <StepAddress
            defaultValues={{
              streetName: formData.streetName,
              streetNumber: formData.streetNumber,
              zipcode: formData.zipcode,
              city: formData.city,
              housingType: formData.housingType,
              housingOwnershipType: formData.housingOwnershipType,
            }}
            onComplete={handleStep4}
            onBack={goToPrevStep}
          />
        )}
        {currentStep === 5 && (
          <StepFamily
            defaultRelationshipStatus={formData.relationshipStatus}
            defaultChildrenCount={formData.childrenCount}
            onComplete={handleStep5}
            onBack={goToPrevStep}
          />
        )}
        {currentStep === 6 && (
          <StepGoal
            defaultGoal={formData.goal}
            onComplete={handleStep6}
            onBack={goToPrevStep}
            isLoading={submitMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
