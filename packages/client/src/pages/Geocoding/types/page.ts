/** Page-local types. The engine's own contract lives in `engineTypes.ts`. */

/**
 * Whether the geocoding engine can be reached. Four states rather than two:
 * "no address configured for this deployment" and "configured but not
 * answering" are different problems, and until the service is deployed the
 * first one is the ordinary case.
 */
export type EngineState = "unconfigured" | "checking" | "up" | "down";
