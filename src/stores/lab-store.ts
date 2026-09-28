import { create } from "zustand";
import { DEFAULT_PAYLOAD } from "@/lib/lab/content";
import { simulate } from "@/lib/lab/simulate";
import {
  HARDENED_POLICY,
  OPEN_POLICY,
  type Policy,
  type TraceEvent,
} from "@/lib/lab/types";

type Screen = "briefing" | "lab";
export type WorkspaceTab = "inbox" | "agent" | "policy";

type LabState = {
  screen: Screen;
  workspaceTab: WorkspaceTab;
  payloadEnabled: boolean;
  payload: string;
  humanView: boolean;
  selectedEmailId: string;
  policy: Policy;
  events: TraceEvent[];
  runNonce: number;
  enterLab: () => void;
  backToBriefing: () => void;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
  setPayloadEnabled: (v: boolean) => void;
  setPayload: (v: string) => void;
  setHumanView: (v: boolean) => void;
  selectEmail: (id: string) => void;
  setPolicy: (patch: Partial<Policy>) => void;
  applyPreset: (preset: "open" | "hardened") => void;
  run: () => void;
};

export const useLabStore = create<LabState>((set, get) => ({
  screen: "briefing",
  workspaceTab: "inbox",
  payloadEnabled: true,
  payload: DEFAULT_PAYLOAD,
  humanView: true,
  selectedEmailId: "e3",
  policy: OPEN_POLICY,
  events: [],
  runNonce: 0,

  enterLab: () => set({ screen: "lab", workspaceTab: "inbox" }),
  backToBriefing: () => set({ screen: "briefing" }),
  setWorkspaceTab: (tab) => set({ workspaceTab: tab }),
  setPayloadEnabled: (v) => set({ payloadEnabled: v }),
  setPayload: (v) => set({ payload: v }),
  setHumanView: (v) => set({ humanView: v }),
  selectEmail: (id) => set({ selectedEmailId: id }),
  setPolicy: (patch) => set({ policy: { ...get().policy, ...patch } }),
  applyPreset: (preset) =>
    set({ policy: preset === "open" ? OPEN_POLICY : HARDENED_POLICY }),

  run: () => {
    const { policy, payloadEnabled, payload } = get();
    const events = simulate({ policy, payloadEnabled, payload });
    set((s) => ({
      events,
      runNonce: s.runNonce + 1,
      workspaceTab: "agent",
    }));
  },
}));
