import { useSyncExternalStore } from "react";

import { getState, subscribe, type DemoState } from "./store";

/** Subscribe to the demo store. Re-renders on every mutation. */
export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getState, getState);
}
