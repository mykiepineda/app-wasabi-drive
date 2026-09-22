## Current task

The active task is:

**Phase 6 Task 6C — Normalize deployment commands**

Use branch:

`ci/frontend-deploy-commands`

The backend already has supported `deploy:test` and `deploy:prd` Serverless
scripts. Do not change the backend.

For the frontend:

- retain Firebase Hosting;
- retain repository-local `firebase-tools`;
- add an explicit `prd` Firebase project alias for the existing production
  Firebase project while retaining the existing `default` alias;
- add a supported `npm run deploy:prd` command;
- the production command must perform a fresh `npm run build` before invoking
  Firebase Hosting deployment;
- use the local `firebase` executable through the npm script;
- deploy Hosting only;
- document the supported command and its build-time configuration prerequisite.

Do NOT add `deploy:test` yet.

There is no approved stable frontend test Firebase target yet. Establishing one
belongs to Phase 6 Task 6F.

Do not:

- deploy while implementing this task;
- invoke the production deployment merely as validation;
- change Firebase Hosting architecture;
- configure CI deployment;
- add Google credentials;
- add Workload Identity Federation;
- change Entra redirect URIs;
- change application source;
- change authentication;
- change dependencies;
- remove aws-sdk;
- modify frontend PR CI.

Validation for this task is static/local only:

- inspect the resulting package script;
- run `npm run build`;
- optionally verify the local Firebase CLI with `npx firebase --version` or the
  equivalent repository-local invocation;
- do not execute `npm run deploy:prd`.

Stop after Task 6C.