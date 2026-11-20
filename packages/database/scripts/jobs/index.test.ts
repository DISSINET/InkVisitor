import { test } from "node:test";
import assert from "node:assert/strict";
import addGeocodingSourcesJob, { addGeocodingSourcesPgJob } from "./add-geocoding-sources";
import alljobs, { pgJobs } from "./index";
import nestGeocodingAccuracyJob, { nestGeocodingAccuracyPgJob } from "./nest-geocoding-accuracy";

// the importer offers a job on a PostgreSQL target only under a name that is in
// both lists, so a key missing from either hides the job without an error
test("every PostgreSQL job is offered under a name of the job list", () => {
  for (const name of Object.keys(pgJobs)) {
    assert.ok(alljobs[name], `${name} is not in the job list`);
  }
});

test("the geocoding jobs are offered under their own names on both databases", () => {
  assert.equal(alljobs.nestGeocodingAccuracyJob, nestGeocodingAccuracyJob);
  assert.equal(pgJobs.nestGeocodingAccuracyJob, nestGeocodingAccuracyPgJob);
  assert.equal(alljobs.addGeocodingSourcesJob, addGeocodingSourcesJob);
  assert.equal(pgJobs.addGeocodingSourcesJob, addGeocodingSourcesPgJob);
});
