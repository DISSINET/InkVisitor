import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

/**
 * Prepares the renderer's worker, and keeps it alive between maps.
 *
 * Every request the map makes — the style, its tile index, glyphs, sprites and
 * the tiles themselves — is issued from a worker, so a worker that is missing or
 * dead produces a map that fails in the most misleading way available: the style
 * parses, the source resolves, every layer and control is present, and the
 * canvas stays empty. Nothing is logged and nothing appears on the network,
 * because the thread that would have made the request is not running.
 *
 * Two separate things are needed for that not to happen.
 *
 * `setWorkerUrl` gives an explicit address. The renderer otherwise resolves the
 * worker relative to its own module URL, which holds only while the module sits
 * beside the worker file — a bundler that rewrites either one breaks it.
 * `?worker&url` emits the worker together with the runtime it imports as one
 * self-contained asset, so the address stays resolvable from a built site.
 *
 * `prewarm` holds a reference to the shared worker pool for the life of the
 * page. The pool is shared by every map and terminates itself the moment no map
 * is using it — and removing a map, then creating another, does exactly that:
 * the second map acquires the pool while the first one's termination is still
 * pending, and the workers it is now using are killed underneath it. React
 * mounts effects twice in development for precisely this reason, to surface
 * setup that cannot survive being torn down and redone.
 *
 * A CALL rather than a bare `import "./maplibreWorker"`: a module whose only
 * statement is a void call is exactly what tree-shaking removes.
 */
export const registerMaplibreWorker = (): void => {
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
  maplibregl.prewarm();
};
