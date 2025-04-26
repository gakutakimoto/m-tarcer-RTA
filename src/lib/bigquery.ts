// src/lib/bigquery.ts

import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.BQ_PROJECT_ID;
const keyJson   = process.env.BQ_KEY_JSON;

if (!projectId) {
  throw new Error("Missing BQ_PROJECT_ID in .env.local");
}
if (!keyJson) {
  throw new Error("Missing BQ_KEY_JSON in .env.local");
}

let credentials;
try {
  credentials = JSON.parse(keyJson);
} catch (e) {
  throw new Error("Failed to parse BQ_KEY_JSON");
}

export const bigquery = new BigQuery({
  projectId,
  credentials,
});
