import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('runtime is non-root standalone and excludes local secrets from Docker context', () => {
  const docker = read('Dockerfile');
  const runtime = docker.split('AS runtime')[1];
  assert.match(docker, /node scripts\/package-connector.mjs && npm run build/);
  assert.match(docker, /FROM gcr\.io\/distroless\/nodejs22-debian13:nonroot AS runtime/);
  assert.match(runtime, /USER 65532:65532/);
  assert.match(runtime, /CMD \["server.js"\]/);
  assert.doesNotMatch(runtime, /COPY \.|npm ci|RUN /);
  assert.match(read('.dockerignore'), /^\.env\*$/m);
  assert.match(read('next.config.mjs'), /output: 'standalone'/);
});

test('the scanned image, not a subsequent rebuild, is published and unfixed findings stay visible', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.match(workflow, /docker build --pull --no-cache/);
  assert.match(workflow, /severity: HIGH,CRITICAL/);
  assert.match(workflow, /ignore-unfixed: false/);
  assert.match(workflow, /exit-code: '1'/);
  assert.match(workflow, /docker tag headless-candidate:/);
  assert.doesNotMatch(workflow, /continue-on-error|docker\/build-push-action/);
});
