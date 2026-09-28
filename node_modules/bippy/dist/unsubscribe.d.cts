import { ReactNode } from "react";

//#region src/types.d.ts
type BundleType = 0 | 1;
type Flags = number;
type Lanes = number;
type TypeOfMode = number;
type RootTag = 0 | 1 | 2;
type LanePriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
type WorkTag = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31;
type HookType = "useState" | "useReducer" | "useContext" | "useRef" | "useEffect" | "useLayoutEffect" | "useCallback" | "useMemo" | "useImperativeHandle" | "useDebugValue" | "useDeferredValue" | "useTransition" | "useMutableSource" | "useOpaqueIdentifier" | "useCacheRefresh";
type FiberRoot = any;
type MutableSource = any;
type OpaqueHandle = any;
type OpaqueRoot = any;
type React$AbstractComponent<_Config, _Instance = unknown> = any;
type HostConfig = Record<string, any>;
interface Source {
  fileName: string;
  lineNumber: number;
}
interface RefObject {
  current: any;
}
interface Thenable<T> {
  then(resolve: () => T, reject?: () => T): T;
}
interface ReactContext<T> {
  $$typeof: symbol | number;
  Consumer: ReactContext<T>;
  Provider: ReactProviderType<T>;
  _calculateChangedBits: ((a: T, b: T) => number) | null;
  _currentValue: T;
  _currentValue2: T;
  _threadCount: number;
  _currentRenderer?: Record<string, any> | null;
  _currentRenderer2?: Record<string, any> | null;
  displayName?: string;
}
interface ReactProviderType<T> {
  $$typeof: symbol | number;
  _context: ReactContext<T>;
}
interface ReactProvider<T> {
  $$typeof: symbol | number;
  type: ReactProviderType<T>;
  key: null | string;
  ref: null;
  props: {
    value: T;
    children?: ReactNode;
  };
}
interface ReactConsumer<T> {
  $$typeof: symbol | number;
  type: ReactContext<T>;
  key: null | string;
  ref: null;
  props: {
    children: (value: T) => ReactNode;
    unstable_observedBits?: number;
  };
}
interface ReactPortal {
  $$typeof: symbol | number;
  key: null | string;
  containerInfo: any;
  children: ReactNode;
  implementation: any;
}
interface ComponentSelector {
  $$typeof: symbol | number;
  value: React$AbstractComponent<never, unknown>;
}
interface HasPseudoClassSelector {
  $$typeof: symbol | number;
  value: Selector[];
}
interface RoleSelector {
  $$typeof: symbol | number;
  value: string;
}
interface TextSelector {
  $$typeof: symbol | number;
  value: string;
}
interface TestNameSelector {
  $$typeof: symbol | number;
  value: string;
}
type Selector = ComponentSelector | HasPseudoClassSelector | RoleSelector | TextSelector | TestNameSelector;
interface DevToolsConfig<Instance = any, TextInstance = any, RendererInspectionConfig = any> {
  bundleType: BundleType;
  version: string;
  rendererPackageName: string;
  findFiberByHostInstance?: (instance: Instance | TextInstance) => ReactFiber | null;
  rendererConfig?: RendererInspectionConfig;
}
interface SuspenseHydrationCallbacks<SuspenseInstance = unknown> {
  onHydrated?: (suspenseInstance: SuspenseInstance) => void;
  onDeleted?: (suspenseInstance: SuspenseInstance) => void;
}
interface TransitionTracingCallbacks {
  onTransitionStart?: (transitionName: string, startTime: number) => void;
  onTransitionProgress?: (transitionName: string, startTime: number, currentTime: number, pending: Array<{
    name: null | string;
  }>) => void;
  onTransitionIncomplete?: (transitionName: string, startTime: number, deletions: Array<{
    type: string;
    name?: string;
    newName?: string;
    endTime: number;
  }>) => void;
  onTransitionComplete?: (transitionName: string, startTime: number, endTime: number) => void;
  onMarkerProgress?: (transitionName: string, marker: string, startTime: number, currentTime: number, pending: Array<{
    name: null | string;
  }>) => void;
  onMarkerIncomplete?: (transitionName: string, marker: string, startTime: number, deletions: Array<{
    type: string;
    name?: string;
    newName?: string;
    endTime: number;
  }>) => void;
  onMarkerComplete?: (transitionName: string, marker: string, startTime: number, endTime: number) => void;
}
interface ReactFiber {
  tag: WorkTag;
  key: null | string;
  elementType: any;
  type: any;
  stateNode: any;
  return: ReactFiber | null;
  child: ReactFiber | null;
  sibling: ReactFiber | null;
  index: number;
  ref: null | (((handle: unknown) => void) & {
    _stringRef?: string | null;
  }) | RefObject;
  pendingProps: any;
  memoizedProps: any;
  updateQueue: unknown;
  memoizedState: any;
  dependencies: Dependencies | null;
  mode: TypeOfMode;
  flags: Flags;
  subtreeFlags: Flags;
  deletions: ReactFiber[] | null;
  nextEffect: ReactFiber | null;
  firstEffect: ReactFiber | null;
  lastEffect: ReactFiber | null;
  lanes: Lanes;
  childLanes: Lanes;
  alternate: ReactFiber | null;
  actualDuration?: number;
  actualStartTime?: number;
  selfBaseDuration?: number;
  treeBaseDuration?: number;
  _debugID?: number;
  _debugSource?: Source | null;
  _debugOwner?: ReactFiber | null;
  _debugIsCurrentlyTiming?: boolean;
  _debugNeedsRemount?: boolean;
  _debugHookTypes?: HookType[] | null;
}
interface ContextDependency<T> {
  context: ReactContext<T>;
  memoizedValue: T;
  next: ContextDependency<unknown> | null;
  observedBits: number;
}
interface Dependencies {
  firstContext: ContextDependency<unknown> | null;
  lanes: Lanes;
}
interface Effect {
  [key: string]: unknown;
  create: (...args: unknown[]) => unknown;
  deps: null | unknown[];
  destroy: ((...args: unknown[]) => unknown) | null;
  next: Effect | null;
  tag: number;
}
interface Family {
  current: unknown;
}
/**
 * React 19 flight metadata for a server component owner (ReactComponentInfo).
 * Unlike client owners it has no `tag`; the owner chain continues via `owner`.
 */
interface ServerComponentInfo {
  name?: string;
  env?: string;
  owner?: Fiber | ServerComponentInfo | null;
  debugStack?: Error | null;
}
interface RendererRefreshUpdate {
  staleFamilies: Set<Family>;
  updatedFamilies: Set<Family>;
}
/**
 * Represents a react-internal Fiber node.
 */
type Fiber<T = any> = Omit<ReactFiber, "alternate" | "child" | "dependencies" | "memoizedProps" | "memoizedState" | "pendingProps" | "return" | "sibling" | "stateNode" | "updateQueue"> & {
  _debugInfo?: Array<{
    debugLocation?: unknown;
    env?: string;
    name?: string;
  }>;
  _debugOwner?: Fiber;
  _debugSource?: {
    columnNumber?: number;
    fileName: string;
    lineNumber: number;
  };
  _debugStack?: Error & {
    stack: string;
  };
  alternate: Fiber | null;
  child: Fiber | null;
  dependencies: Dependencies | null;
  memoizedProps: Props;
  memoizedState: MemoizedState;
  pendingProps: Props;
  return: Fiber | null;
  sibling: Fiber | null;
  stateNode: T;
  updateQueue: {
    [key: string]: unknown;
    lastEffect: Effect | null;
  };
};
interface MemoizedState {
  [key: string]: unknown;
  memoizedState: unknown;
  next: MemoizedState | null;
}
interface Props {
  [key: string]: unknown;
}
interface ReactDevToolsGlobalHook {
  _instrumentationIsActive?: boolean;
  _instrumentationSource?: string;
  checkDCE: (fn: unknown) => void;
  hasUnsupportedRendererAttached: boolean;
  inject: (renderer: ReactRenderer) => number;
  on: () => void;
  onCommitFiberRoot: (rendererID: number, root: FiberRoot, priority: number | void) => void;
  onCommitFiberUnmount: (rendererID: number, fiber: Fiber) => void;
  onPostCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
  onScheduleFiberRoot?: (rendererID: number, root: FiberRoot, children: ReactNode) => void;
  renderers: Map<number, ReactRenderer>;
  supportsFiber: boolean;
  supportsFlight: boolean;
}
interface ReactRenderer {
  bundleType: 0 | 1;
  currentDispatcherRef: any;
  findFiberByHostInstance?: (hostInstance: unknown) => Fiber | null;
  getCurrentFiber?: (fiber: Fiber) => Fiber | null;
  overrideContext?: (fiber: Fiber, contextType: unknown, path: string[], value: unknown) => void;
  overrideHookState?: (fiber: Fiber, id: string, path: string[], value: unknown) => void;
  overrideHookStateDeletePath?: (fiber: Fiber, id: number, path: Array<number | string>) => void;
  overrideHookStateRenamePath?: (fiber: Fiber, id: number, oldPath: Array<number | string>, newPath: Array<number | string>) => void;
  overrideProps?: (fiber: Fiber, path: string[], value: unknown) => void;
  overridePropsDeletePath?: (fiber: Fiber, path: Array<number | string>) => void;
  overridePropsRenamePath?: (fiber: Fiber, oldPath: Array<number | string>, newPath: Array<number | string>) => void;
  reconcilerVersion: string;
  rendererPackageName: string;
  scheduleRefresh?: (root: FiberRoot, update: RendererRefreshUpdate) => void;
  scheduleRoot?: (root: FiberRoot, element: React.ReactNode) => void;
  scheduleUpdate?: (fiber: Fiber) => void;
  setErrorHandler?: (newShouldErrorImpl: (fiber: Fiber) => boolean) => void;
  setRefreshHandler?: (handler: ((fiber: Fiber) => Family | null) | null) => void;
  setSuspenseHandler?: (newShouldSuspendImpl: (suspenseInstance: unknown) => void) => void;
  version: string;
}
declare global {
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevToolsGlobalHook | undefined;
}
//#endregion
//#region src/unsubscribe.d.ts
interface Unsubscribe extends Disposable {
  (): void;
}
/**
 * Wraps a teardown callback so it is both callable and a `Disposable`,
 * letting subscriptions compose through explicit resource management:
 *
 * @example
 * ```ts
 * using instrumentation = instrument({ onCommitFiberRoot });
 * using refresh = instrumentReactRefresh({ onRefresh: handleRefresh });
 * // both torn down automatically at scope exit
 * ```
 */
declare const toUnsubscribe: (dispose: () => void) => Unsubscribe;
//#endregion
export { ReactRenderer as A, TextSelector as B, React$AbstractComponent as C, ReactPortal as D, ReactDevToolsGlobalHook as E, Selector as F, TransitionTracingCallbacks as H, ServerComponentInfo as I, Source as L, RendererRefreshUpdate as M, RoleSelector as N, ReactProvider as O, RootTag as P, SuspenseHydrationCallbacks as R, Props as S, ReactContext as T, TypeOfMode as U, Thenable as V, WorkTag as W, Lanes as _, ContextDependency as a, OpaqueHandle as b, Effect as c, FiberRoot as d, Flags as f, LanePriority as g, HostConfig as h, ComponentSelector as i, RefObject as j, ReactProviderType as k, Family as l, HookType as m, toUnsubscribe as n, Dependencies as o, HasPseudoClassSelector as p, BundleType as r, DevToolsConfig as s, Unsubscribe as t, Fiber as u, MemoizedState as v, ReactConsumer as w, OpaqueRoot as x, MutableSource as y, TestNameSelector as z };