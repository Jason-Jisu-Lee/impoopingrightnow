export type SessionFlowStage = "landing" | "active";

export type SessionFlowNotice = {
  title: string;
  body: string;
};

export type SessionFlowState = {
  stage: SessionFlowStage;
  startedAt: string | null;
  retroactiveStub: SessionFlowNotice | null;
};

const retroactiveSessionStub: SessionFlowNotice = {
  title: "I Pooped",
  body: "Coming soon. Retroactive logging stays stubbed for V1.",
};

export function createSessionFlowState(): SessionFlowState {
  return {
    stage: "landing",
    startedAt: null,
    retroactiveStub: null,
  };
}

export function startLiveSession(now: Date = new Date()): SessionFlowState {
  return {
    stage: "active",
    startedAt: now.toISOString(),
    retroactiveStub: null,
  };
}

export function openRetroactiveSessionStub(
  state: SessionFlowState,
): SessionFlowState {
  if (state.stage === "active") {
    return state;
  }

  return {
    ...state,
    retroactiveStub: retroactiveSessionStub,
  };
}

export function dismissRetroactiveSessionStub(
  state: SessionFlowState,
): SessionFlowState {
  if (!state.retroactiveStub) {
    return state;
  }

  return {
    ...state,
    retroactiveStub: null,
  };
}
