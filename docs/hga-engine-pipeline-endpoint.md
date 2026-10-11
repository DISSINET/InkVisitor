# Proposal: `GET /pipeline` on the HGA engine

The geocoding page can say what each source is (`GET /suggesters`) but not how a
query moves through the engine, why a suggestion scored what it did, or what each
context weight does. Those explanations are written by hand in
[geocoding.md](geocoding.md) and in client strings, and go stale whenever the
engine changes a stage, a multiplier or a default.

## What already answers part of this

- `GET /suggesters` — per source: description, licence, coverage, limitations,
  size, default weight. Covers "what is this source", not "how is it used".
- `signals` on every suggestion — the numbers behind one score (`convergence`,
  `matchScore`, `candidateDiversity`, `candidateScore`, `evidence`, and the
  multipliers `contextGate`, `candidatePrior`, `offRegionFactor`). Covers "what
  were the values", not "what does each one mean".
- `sources[]` outcomes on a response — what each source did on one request.

Nothing publishes the meaning of a signal, the order of the stages or the effect of
a context dimension. Those are the gap.

## Proposal

A static, cacheable `GET /pipeline` describing the engine as it is configured,
independent of any query. Same style as `/suggesters`: prose written by the engine's
authors next to the code that implements it, so a change to one is a change to
the other.

```jsonc
{
  "version": "0.2.0",
  "stages": [
    {
      "id": "augment",
      "order": 1,
      "title": "Understand the question",
      "description": "…what the language model adds, when it is skipped…",
      "optional": true,
      "skippedWhen": "the request asks for no language-model stages"
    }
    // …one entry per stage, in execution order
  ],
  "contextDimensions": [
    {
      "id": "region",
      "title": "Region",
      "description": "…what it filters and what it scores…",
      "weight": { "default": 2, "min": 0, "max": 10 },
      "measured": true,
      "veto": "A source covering none of the regions is not asked.",
      "zeroWeightEffect": "Every source runs on every request; slower."
    }
    // period, language, placeType
  ],
  "signals": [
    {
      "id": "contextGate",
      "title": "Context gate",
      "kind": "multiplier",
      "range": [0, 1],
      "description": "…",
      "comparableAcrossQueries": false
    }
    // one entry per field of `signals` on a suggestion
  ],
  "score": {
    "formula": "evidence × contextGate × candidatePrior × offRegionFactor",
    "description": "Orders suggestions within one query.",
    "comparableAcrossQueries": false
  }
}
```

The client reads it the same way it reads `/suggesters`: one request an hour,
shared by every consumer, absent when the engine is unreachable.

## What the client would do with it

- Replace the hand-written weight tooltips on the Suggestions panel with the
  dimension descriptions, and the default shown on the slider with `weight.default`.
- Explain each number in a suggestion's score breakdown from `signals[]`.
- Show the stages in the progress strip's hover, next to the source tags.

## Invariants

1. Every field of `Suggestion.signals` has an entry in `signals[]`, and a test in
   the engine fails when one is added without it.
2. Every context dimension the request accepts has an entry in
   `contextDimensions[]`, with the same default the engine applies.
3. The response does not depend on the request, so it is cacheable without a key.
4. A client that cannot reach the endpoint loses explanations only; no setting,
   request or result depends on it.
5. The text is written for a researcher, not for an engineer: no field names in
   `description`, no slugs, no unit abbreviations.
