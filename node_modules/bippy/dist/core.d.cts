import { A as ReactRenderer, E as ReactDevToolsGlobalHook, a as ContextDependency, d as FiberRoot, t as Unsubscribe, u as Fiber, v as MemoizedState } from "./unsubscribe.cjs";
import * as React from "react";

//#region src/rdt-hook.d.ts
declare const version: string | undefined;
declare const BIPPY_INSTRUMENTATION_STRING: string;
declare const isRealReactDevtools: (rdtHook?: ReactDevToolsGlobalHook | undefined | null) => boolean;
declare const isReactRefresh: (rdtHook?: ReactDevToolsGlobalHook | undefined | null) => boolean;
declare const _onActiveListeners: Set<() => unknown>;
declare const _renderers: Set<ReactRenderer>;
/**
 * Subscribes to future renderer injections into the DevTools hook. The
 * single shared inject wrapper lets multiple consumers (override methods,
 * react-refresh, user code) observe renderers without stacking patches
 * whose restore order matters. Returns an unsubscribe function.
 */
declare const onRendererInject: (listener: (renderer: ReactRenderer) => void) => Unsubscribe;
declare const installRDTHook: (onActive?: () => unknown) => ReactDevToolsGlobalHook;
declare const patchRDTHook: (onActive?: () => unknown) => void;
declare const hasRDTHook: () => boolean;
/**
 * Returns the current React DevTools global hook.
 */
declare const getRDTHook: (onActive?: () => unknown) => ReactDevToolsGlobalHook;
declare const isClientEnvironment: () => boolean;
/**
 * Usually used purely for side effect
 */
declare const safelyInstallRDTHook: () => void;
//#endregion
//#region src/core.d.ts
declare const FunctionComponentTag = 0;
declare const ClassComponentTag = 1;
declare const HostRootTag = 3;
declare const HostPortalTag = 4;
declare const HostComponentTag = 5;
declare const HostTextTag = 6;
declare const FragmentTag = 7;
declare const ContextConsumerTag = 9;
declare const ForwardRefTag = 11;
declare const SuspenseComponentTag = 13;
declare const MemoComponentTag = 14;
declare const SimpleMemoComponentTag = 15;
declare const LazyComponentTag = 16;
declare const DehydratedSuspenseComponentTag = 18;
declare const SuspenseListComponentTag = 19;
declare const OffscreenComponentTag = 22;
declare const LegacyHiddenComponentTag = 23;
declare const HostHoistableTag = 26;
declare const HostSingletonTag = 27;
declare const ActivityComponentTag = 28;
declare const ViewTransitionComponentTag = 30;
declare const CONCURRENT_MODE_NUMBER = 60111;
declare const ELEMENT_TYPE_SYMBOL_STRING = "Symbol(react.element)";
declare const TRANSITIONAL_ELEMENT_TYPE_SYMBOL_STRING = "Symbol(react.transitional.element)";
declare const CONCURRENT_MODE_SYMBOL_STRING = "Symbol(react.concurrent_mode)";
declare const DEPRECATED_ASYNC_MODE_SYMBOL_STRING = "Symbol(react.async_mode)";
declare const CONCURRENT_MODE_SYMBOL_DESCRIPTION = "react.concurrent_mode";
declare const DEPRECATED_ASYNC_MODE_SYMBOL_DESCRIPTION = "react.async_mode";
/**
 * Returns `true` if object is a React Element.
 *
 * @see https://react.dev/reference/react/isValidElement
 */
declare const isValidElement: (element: unknown) => element is React.ReactElement;
/**
 * Returns `true` if object is a React Fiber.
 */
declare const isValidFiber: (fiber: unknown) => fiber is Fiber;
/**
 * Returns `true` if fiber is a host fiber. Host fibers are DOM nodes in react-dom, `View` in react-native, etc.
 *
 * @see https://reactnative.dev/architecture/glossary#host-view-tree-and-host-view
 */
declare const isHostFiber: (fiber: Fiber) => boolean;
/**
 * Returns `true` if fiber is a composite fiber. Composite fibers are fibers that can render (like functional components, class components, etc.)
 *
 * @see https://reactnative.dev/architecture/glossary#react-composite-components
 */
declare const isCompositeFiber: (fiber: Fiber) => boolean;
/**
 * Returns `true` if the object is a {@link Fiber}
 */
declare const isFiber: (maybeFiber: unknown) => maybeFiber is Fiber;
/**
 * Traverses up or down a {@link Fiber}'s contexts, return `true` to stop and select the current and previous context value.
 */
declare const traverseContexts: (fiber: Fiber, selector: (nextValue: ContextDependency<unknown> | null | undefined, prevValue: ContextDependency<unknown> | null | undefined) => boolean | void) => boolean;
/**
 * Traverses up or down a {@link Fiber}'s states, return `true` to stop and select the current and previous state value. This stores both state values and effects.
 */
declare const traverseState: (fiber: Fiber, selector: (nextValue: MemoizedState | null | undefined, prevValue: MemoizedState | null | undefined) => boolean | void) => boolean;
/**
 * Traverses up or down a {@link Fiber}'s props, return `true` to stop and select the current and previous props value.
 */
declare const traverseProps: (fiber: Fiber, selector: (propName: string, nextValue: unknown, prevValue: unknown) => boolean | void) => boolean;
/**
 * Returns `true` if the {@link Fiber} has rendered. Note that this does not mean the fiber has rendered in the current commit, just that it has rendered in the past.
 */
declare const didFiberRender: (fiber: Fiber) => boolean;
/**
 * Returns `true` if the {@link Fiber} has committed. Note that this does not mean the fiber has committed in the current commit, just that it has committed in the past.
 */
declare const didFiberCommit: (fiber: Fiber) => boolean;
/**
 * Returns all host {@link Fiber}s that have committed and rendered.
 */
declare const getMutatedHostFibers: (fiber: Fiber) => Fiber[];
/**
 * Returns the stack of {@link Fiber}s from the current fiber to the root fiber.
 *
 * @example
 * ```ts
 * [fiber, fiber.return, fiber.return.return, ...]
 * ```
 */
declare const getFiberStack: (fiber: Fiber) => Fiber[];
/**
 * Returns the nearest host {@link Fiber} to the current {@link Fiber}.
 */
declare const getNearestHostFiber: (fiber: Fiber, ascending?: boolean) => Fiber | null;
/**
 * Returns all host {@link Fiber}s in the tree that are associated with the current {@link Fiber}.
 */
declare const getNearestHostFibers: (fiber: Fiber) => Fiber[];
/**
 * Traverses up or down a {@link Fiber}, return `true` to stop and select a node.
 */
declare function traverseFiber(fiber: Fiber | null, selector: (node: Fiber) => boolean | void, ascending?: boolean): Fiber | null;
declare function traverseFiber(fiber: Fiber | null, selector: (node: Fiber) => Promise<boolean | void>, ascending?: boolean): Promise<Fiber | null>;
/**
 * Returns the timings of the {@link Fiber}.
 *
 * @example
 * ```ts
 * const { selfTime, totalTime } = getTimings(fiber);
 * console.log(selfTime, totalTime);
 * ```
 */
declare const getTimings: (fiber?: Fiber | null) => {
  selfTime: number;
  totalTime: number;
};
/**
 * Returns `true` if the {@link Fiber} uses React Compiler's memo cache.
 */
declare const hasMemoCache: (fiber: Fiber) => boolean;
/**
 * Returns the type (e.g. component definition) of the {@link Fiber}
 */
declare const getType: (type: unknown) => null | React.ComponentType<unknown>;
/**
 * Returns the display name of the {@link Fiber} type.
 */
declare const getDisplayName: (type: unknown) => null | string;
/**
 * Returns the build type of the React renderer.
 */
declare const detectReactBuildType: (renderer: ReactRenderer) => "development" | "production";
/**
 * Returns `true` if bippy's instrumentation is active.
 */
declare const isInstrumentationActive: () => boolean;
declare const _fiberRoots: Set<any>;
/**
 * Returns the latest fiber (since it may be double-buffered).
 */
declare const getLatestFiber: (fiber: Fiber) => Fiber;
type RenderHandler = <S>(fiber: Fiber, phase: RenderPhase, state?: S) => unknown;
type RenderPhase = "mount" | "unmount" | "update";
declare const setFiberId: (fiber: Fiber, id?: number) => void;
declare const getFiberId: (fiber: Fiber) => number;
/**
 * Creates a fiber visitor function. Must pass a fiber root and a render handler.
 * @example
 * traverseRenderedFibers(root, (fiber, phase) => {
 *   console.log(phase)
 * })
 */
declare const traverseRenderedFibers: (root: FiberRoot, onRender: RenderHandler) => void;
declare const overrideProps: (fiber: Fiber, partialValue: Record<string, unknown>) => void;
declare const overrideHookState: (fiber: Fiber, id: number, partialValue: unknown) => void;
declare const overrideContext: (fiber: Fiber, contextType: unknown, partialValue: unknown) => void;
interface InstrumentationOptions {
  name?: string;
  onActive?: () => unknown;
  onCommitFiberRoot?: (rendererID: number, root: FiberRoot, priority: number | void) => unknown;
  onCommitFiberUnmount?: (rendererID: number, fiber: Fiber) => unknown;
  onPostCommitFiberRoot?: (rendererID: number, root: FiberRoot) => unknown;
  onScheduleFiberRoot?: (rendererID: number, root: FiberRoot, children: React.ReactNode) => unknown;
}
/**
 * Instruments the DevTools hook. Each hook event is patched once and
 * dispatches to a set of listeners, so multiple `instrument` calls compose
 * without stacking patches. Returns an unsubscribe function that removes
 * exactly the handlers this call registered.
 * The returned function is also a `Disposable`, so it composes with other
 * bippy subscriptions through `using`.
 * @example
 * const unsubscribe = instrument({
 *   onActive() {
 *     console.log('initialized');
 *   },
 *   onCommitFiberRoot(rendererID, root) {
 *     console.log('fiberRoot', root.current)
 *   },
 * });
 * unsubscribe();
 */
declare const instrument: (options: InstrumentationOptions) => Unsubscribe;
declare const getFiberFromHostInstance: <T>(hostInstance: T) => Fiber | null;
//#endregion
export { isValidFiber as $, TRANSITIONAL_ELEMENT_TYPE_SYMBOL_STRING as A, getLatestFiber as B, MemoComponentTag as C, SimpleMemoComponentTag as D, RenderPhase as E, didFiberRender as F, getType as G, getNearestHostFiber as H, getDisplayName as I, isCompositeFiber as J, hasMemoCache as K, getFiberFromHostInstance as L, _fiberRoots as M, detectReactBuildType as N, SuspenseComponentTag as O, didFiberCommit as P, isValidElement as Q, getFiberId as R, LegacyHiddenComponentTag as S, RenderHandler as T, getNearestHostFibers as U, getMutatedHostFibers as V, getTimings as W, isHostFiber as X, isFiber as Y, isInstrumentationActive as Z, HostRootTag as _, isRealReactDevtools as _t, ClassComponentTag as a, traverseFiber as at, InstrumentationOptions as b, safelyInstallRDTHook as bt, DEPRECATED_ASYNC_MODE_SYMBOL_STRING as c, traverseState as ct, ForwardRefTag as d, _renderers as dt, overrideContext as et, FragmentTag as f, getRDTHook as ft, HostPortalTag as g, isReactRefresh as gt, HostHoistableTag as h, isClientEnvironment as ht, CONCURRENT_MODE_SYMBOL_STRING as i, traverseContexts as it, ViewTransitionComponentTag as j, SuspenseListComponentTag as k, DehydratedSuspenseComponentTag as l, BIPPY_INSTRUMENTATION_STRING as lt, HostComponentTag as m, installRDTHook as mt, CONCURRENT_MODE_NUMBER as n, overrideProps as nt, ContextConsumerTag as o, traverseProps as ot, FunctionComponentTag as p, hasRDTHook as pt, instrument as q, CONCURRENT_MODE_SYMBOL_DESCRIPTION as r, setFiberId as rt, DEPRECATED_ASYNC_MODE_SYMBOL_DESCRIPTION as s, traverseRenderedFibers as st, ActivityComponentTag as t, overrideHookState as tt, ELEMENT_TYPE_SYMBOL_STRING as u, _onActiveListeners as ut, HostSingletonTag as v, onRendererInject as vt, OffscreenComponentTag as w, LazyComponentTag as x, version as xt, HostTextTag as y, patchRDTHook as yt, getFiberStack as z };