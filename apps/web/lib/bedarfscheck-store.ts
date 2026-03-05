"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type BedarfscheckFormData = {
  // Step 1 – Persönliche Daten
  name: string;
  dateOfBirth: string; // ISO date: "YYYY-MM-DD"

  // Step 2 – Beruf & Gehalt
  jobType: string | null;
  jobExpiryDate: string | null; // ISO date, only for STUDENT/APPRENTICE
  salary: string; // numeric string, empty = not provided

  // Step 3 – Mobilität
  vehicleTypes: string[]; // VehicleType enum values

  // Step 4 – Adresse & Wohnen
  streetName: string;
  streetNumber: string;
  zipcode: string;
  city: string;
  housingType: string | null; // HousingType enum
  housingOwnershipType: string | null; // HousingOwnershipType enum, null for SHARED_ROOM

  // Step 5 – Familienstand
  relationshipStatus: string | null; // RelationshipStatus enum
  childrenCount: number;

  // Step 6 – Dein Ziel
  goal: string | null; // GoalType enum
};

/** 0 = intro, 1-6 = questionnaire steps, 7 = completed */
export type BedarfscheckStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const TOTAL_STEPS = 6;

const INITIAL_FORM_DATA: BedarfscheckFormData = {
  name: "",
  dateOfBirth: "",
  jobType: null,
  jobExpiryDate: null,
  salary: "",
  vehicleTypes: [],
  streetName: "",
  streetNumber: "",
  zipcode: "",
  city: "",
  housingType: null,
  housingOwnershipType: null,
  relationshipStatus: null,
  childrenCount: 0,
  goal: null,
};

// ============================================================================
// Store
// ============================================================================

type BedarfscheckStore = {
  step: BedarfscheckStep;
  completedSteps: number[];
  formData: BedarfscheckFormData;
  // Actions
  setStep: (step: BedarfscheckStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  updateFormData: (data: Partial<BedarfscheckFormData>) => void;
  markStepCompleted: (step: number) => void;
  reset: () => void;
};

export const useBedarfscheckStore = create<BedarfscheckStore>()(
  persist(
    (set, get) => ({
      step: 0,
      completedSteps: [],
      formData: INITIAL_FORM_DATA,

      setStep: (step) => set({ step }),

      goToNextStep: () => {
        const next = Math.min(TOTAL_STEPS + 1, get().step + 1) as BedarfscheckStep;
        set({ step: next });
      },

      goToPrevStep: () => {
        const prev = Math.max(0, get().step - 1) as BedarfscheckStep;
        set({ step: prev });
      },

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      reset: () =>
        set({ step: 0, completedSteps: [], formData: INITIAL_FORM_DATA }),
    }),
    { name: "bedarfscheck-progress" }
  )
);
