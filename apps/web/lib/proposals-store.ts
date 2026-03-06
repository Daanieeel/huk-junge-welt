"use client";

import { create } from "zustand";

interface ProposalsStore {
  isRegenerating: boolean;
  setRegenerating: (v: boolean) => void;
}

export const useProposalsStore = create<ProposalsStore>((set) => ({
  isRegenerating: false,
  setRegenerating: (v) => set({ isRegenerating: v }),
}));
