import { u as Fiber } from "./unsubscribe.cjs";
//#region src/source/parse-stack.d.ts
interface StackFrame {
  args?: unknown[];
  columnNumber?: number;
  lineNumber?: number;
  enclosingLineNumber?: number;
  enclosingColumnNumber?: number;
  fileName?: string;
  functionName?: string;
  source?: string;
  isServer?: boolean;
  isSymbolicated?: boolean;
  isIgnoreListed?: boolean;
}
interface ParseOptions {
  slice?: number | [number, number];
  allowEmpty?: boolean;
  includeInElement?: boolean;
}
declare const parseStack: (stackString: string, options?: ParseOptions) => StackFrame[];
//#endregion
//#region src/source/owner-stack.d.ts
declare const hasDebugStack: (fiber: Fiber) => fiber is Fiber & {
  _debugStack: NonNullable<Fiber["_debugStack"]>;
};
/**
 * takes Error.stack and formats it to only the React owner stack
 *
 * before:
 * ```
 * Error: react-stack-top-frame
 * at fakeJSXCallSite (http://localhost:3000/_next/static/chunks/<chunk-name>._.js:17665:16)
 * at TodoItem (rsc://React/Server/file:///path/to/project/.next/server/chunks/ssr/<chunk-name>._.js)
 * at react-stack-bottom-frame (http://localhost:3000/_next/static/chunks/<chunk-name>._.js:17984:89)
 * ```
 *
 * after:
 * ```
 * at TodoItem (rsc://React/Server/file:///path/to/project/.next/server/chunks/ssr/<chunk-name>._.js)
 * ```
 *
 * @see https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/backend/shared/DevToolsOwnerStack.js#L12
 */
declare const formatOwnerStack: (stack: string) => string;
/**
 * Returns a stack of ALL ancestor components in the render tree (the fiber's
 * `return` chain), including wrappers that render `{children}` without having
 * created this fiber's JSX. Locations come from re-invoking each component
 * with a throwing dispatcher; server frames are enriched from debug stacks by
 * name matching. Works on every React version.
 */
declare const getParentStack: (fiber: Fiber, shouldCache?: boolean, fetchFunction?: (url: string) => Promise<Response>) => Promise<StackFrame[]>;
/**
 * Returns the stack of components that CREATED this fiber's JSX (the
 * `_debugOwner` chain), with exact creation-site locations from React 19's
 * `_debugStack` errors - including server component owners. Wrappers that
 * merely render `{children}` do not appear; use {@link getParentStack} for
 * the full render-tree ancestry. Falls back to {@link getParentStack} on
 * React <19, when no trusted debug stacks exist, or when the owner chain
 * yields no locatable frames (so callers always get the most useful stack
 * available).
 */
declare const getOwnerStack: (fiber: Fiber, shouldCache?: boolean, fetchFunction?: (url: string) => Promise<Response>) => Promise<StackFrame[]>;
//#endregion
//#region src/source/types.d.ts
interface FiberSource {
  columnNumber?: number;
  fileName: string;
  lineNumber?: number;
  functionName?: string;
}
//#endregion
//#region src/source/get-source.d.ts
/**
 * Returns the source of where the component is used. Available only in dev, for composite {@link Fiber}s.
 *
 * Resolution order:
 * 1. `_debugSource` (react <19, requires the JSX source babel transform)
 * 2. the fiber's own `_debugStack` (react 19) - the exact JSX creation site
 * 3. an owned child's `_debugStack` bottom frame (react 19) - a location
 *    inside the component's own body; works for components that the throwing
 *    trick cannot locate (no hooks, no props access)
 * 4. the legacy owner-stack path (throwing trick re-invocation)
 *
 * @example
 * ```ts
 * function Parent() {
 *   const data = useData();
 *   return <Child name={data.name} />; // <-- captures THIS line
 * }
 *
 * function Child({ name }) {
 *   return <div>{name}</div>;
 * }
 *
 * const source = await getSource(fiber);
 * console.log(source.fileName, source.lineNumber);
 * ```
 */
declare const getSource: (fiber: Fiber, cache?: boolean, fetchFn?: (url: string) => Promise<Response>) => Promise<FiberSource | null>;
declare const normalizeFileName: (fileName: string) => string;
declare const isSourceFile: (fileName: string) => boolean;
//#endregion
//#region ../../node_modules/@jridgewell/sourcemap-codec/types/sourcemap-codec.d.mts
type SourceMapSegment = [number] | [number, number, number, number] | [number, number, number, number, number];
//#endregion
//#region src/source/symbolication.d.ts
interface DecodedSourceMapSection {
  map: {
    file?: string;
    ignoredSourceIndices?: Set<number>;
    mappings: SourceMapSegment[][];
    names?: string[];
    sourceRoot?: string;
    sources: string[];
    sourcesContent?: string[];
    version: 3;
  };
  offset: {
    column: number;
    line: number;
  };
}
interface IndexSourceMap {
  file?: string;
  sections: Array<{
    map: StandardSourceMap;
    offset: {
      column: number;
      line: number;
    };
  }>;
  version: 3;
}
type RawSourceMap = IndexSourceMap | StandardSourceMap;
interface SourceMap {
  file?: string;
  ignoredSourceIndices?: Set<number>;
  mappings: SourceMapSegment[][];
  names?: string[];
  sections?: DecodedSourceMapSection[];
  sourceRoot?: string;
  sources: string[];
  sourcesContent?: string[];
  version: 3;
}
interface StandardSourceMap {
  file?: string;
  ignoreList?: number[];
  mappings: string;
  names?: string[];
  sourceRoot?: string;
  sources: string[];
  sourcesContent?: string[];
  version: 3;
  x_google_ignoreList?: number[];
}
declare const getSourceFromSourceMap: (sourceMap: SourceMap, line: number, column: number) => StackFrame | null;
declare const getSourceMap: (file: string, useCache?: boolean, fetchFn?: (url: string) => Promise<Response>) => Promise<null | SourceMap>;
declare const symbolicateStack: (stack: StackFrame[], cache?: boolean, fetchFn?: (url: string) => Promise<Response>) => Promise<StackFrame[]>;
//#endregion
//#region src/source/get-display-name-from-source.d.ts
declare const getDisplayNameFromSource: (fiber: Fiber, cache?: boolean, fetchFn?: (url: string) => Promise<Response>) => Promise<string | null>;
//#endregion
//#region src/source/inspect-hooks.d.ts
interface HookSource {
  lineNumber: number | null;
  columnNumber: number | null;
  fileName: string | null;
  functionName: string | null;
}
interface HooksNode {
  id: number | null;
  isStateEditable: boolean;
  name: string;
  value: unknown;
  subHooks: HooksNode[];
  hookSource: HookSource | null;
}
interface HooksTree extends Array<HooksNode> {}
declare const getFiberHooks: (fiber: Fiber) => HooksTree;
//#endregion
//#region src/source/parse-hook-names.d.ts
interface HookNames extends Map<string, string> {}
declare const parseHookNames: (hooksTree: HooksTree, fetchFn?: (url: string) => Promise<Response>) => Promise<HookNames>;
//#endregion
export { type DecodedSourceMapSection, type FiberSource, type HookNames, type HookSource, type HooksNode, type HooksTree, type IndexSourceMap, type ParseOptions, type RawSourceMap, type SourceMap, type StackFrame, type StandardSourceMap, formatOwnerStack, getDisplayNameFromSource, getFiberHooks, getOwnerStack, getParentStack, getSource, getSourceFromSourceMap, getSourceMap, hasDebugStack, isSourceFile, normalizeFileName, parseHookNames, parseStack, symbolicateStack };