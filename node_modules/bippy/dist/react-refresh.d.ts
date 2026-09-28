import { d as FiberRoot, t as Unsubscribe, u as Fiber } from "./unsubscribe.js";

//#region src/react-refresh/index.d.ts
interface ReactRefreshUpdate {
  /**
   * hot-updated source file paths reported by the bundler's HMR transport
   * (auto-detected: Next.js webpack, Metro, Vite). Best-effort: empty when
   * the bundler does not expose a transport (e.g. Turbopack) or when the
   * transport message has not arrived yet (e.g. Metro delivers updates on
   * an independent socket).
   */
  filePaths: string[];
  root: FiberRoot;
  /** new component types that were remounted, losing state */
  staleComponents: unknown[];
  /** mounted fibers whose component types were remounted */
  staleFibers: Fiber[];
  /** new component types that re-rendered preserving state */
  updatedComponents: unknown[];
  /** mounted fibers whose component types re-rendered preserving state */
  updatedFibers: Fiber[];
}
interface ReactRefreshHandler {
  (update: ReactRefreshUpdate): void;
}
interface ReactRefreshInstrumentationOptions {
  onRefresh?: ReactRefreshHandler;
}
/**
 * Subscribes to react-refresh (fast refresh) updates by wrapping
 * `scheduleRefresh` on every renderer injected into the React DevTools
 * global hook. The react-refresh runtime calls `scheduleRefresh` after each
 * hot update, so this works with any bundler that uses react-refresh (Vite,
 * Next.js webpack, Next.js Turbopack, Metro) without bundler-specific code.
 * Returns an unsubscribe function (a no-op in non-client environments like
 * SSR, so callers never need an environment check). The returned function
 * is also a `Disposable`, so it composes with other bippy subscriptions
 * through `using`.
 *
 * The bundler's HMR transport is auto-detected and each refresh update is
 * augmented with the hot-updated source file paths it reported.
 *
 * The handler runs after React has re-rendered with the new component
 * types, so the refreshed root's fiber tree already carries them;
 * `updatedFibers`/`staleFibers` are the mounted fibers matching the
 * hot-swapped component types.
 *
 * @example
 * ```ts
 * const unsubscribe = instrumentReactRefresh({
 *   onRefresh(update) {
 *     for (const fiber of update.updatedFibers) {
 *       console.log("hot updated:", getDisplayName(fiber.type));
 *     }
 *     console.log("changed files:", update.filePaths);
 *   },
 * });
 * unsubscribe();
 * ```
 *
 * Pair with `getSource(fiber)` from `bippy/source` to symbolicate the
 * source locations of `updatedFibers` when needed.
 */
declare const instrumentReactRefresh: (options: ReactRefreshInstrumentationOptions) => Unsubscribe;
//#endregion
export { ReactRefreshHandler, ReactRefreshInstrumentationOptions, ReactRefreshUpdate, instrumentReactRefresh };