# Manual Verification — Cloud Run Doctor

**Project:** `pawpass-gdg-demo` | **Branch:** `004-cloud-run-doctor-diagnosis`

## 1. IAM Audit (T081)

Runtime `cloud-run-doctor-sa@pawpass-gdg-demo.iam.gserviceaccount.com` must have only:

- `roles/run.viewer`
- `roles/logging.viewer`
- `roles/mcp.toolUser`
- `roles/aiplatform.user`

Or custom minimal equivalents. Prohibited: `roles/owner`, `roles/editor`, `roles/run.admin`, `roles/logging.admin`, `roles/mcp.admin`, `roles/aiplatform.admin`.

Command:

```bash
DOCTOR_SA="cloud-run-doctor-sa@pawpass-gdg-demo.iam.gserviceaccount.com"
gcloud projects get-iam-policy pawpass-gdg-demo \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${DOCTOR_SA}" \
  --format="table(bindings.role,bindings.members)"
```

If available, also check effective bindings via Cloud Asset Inventory / Policy Analyzer. Document limitation if not available. **Stop checkpoint if admin/wide write found.**

Operator human gets `roles/run.invoker` via `DEMO_OPERATOR_EMAIL` (shell placeholder, not runtime var). Deploy via operator/Cloud Build.

**Result:** _pending — run after offline verify_

## 2. MCP Discovery

```bash
gcloud auth application-default login
pnpm exec tsx scripts/list-mcp-tools.ts
```

Record `verifiedOn` `YYYY-MM-DD` UTC, server, name, description in `docs/mcp-tools-observed.md`. Populate `src/mcp/allowlist.ts`. No fallback to old names.

## 3. Argument Verification (T082)

```bash
pnpm exec tsx scripts/verify-mcp-arguments.ts
```

Manual only, outside `pnpm verify`/`verify:full`/CI. Checks project/region/service/filter/window/limit from `InvestigationScope`.

## 4. Integration

```bash
pnpm dev
curl -N -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"hello","locale":"es"}'
```

Verify SSE `investigation-started` first, `tool-start`/`tool-result-summary` from Evidence, `text-delta`, `done`.

## 5. Docker

```bash
pnpm build
docker build -t cloud-run-doctor:local .
docker run --rm -d -p 8080:8080 --name doctor-local cloud-run-doctor:local
curl -fsS http://localhost:8080/es >/dev/null
docker exec doctor-local whoami # nextjs
docker stop doctor-local
```

## 6. Deploy (T074)

```bash
gcloud run deploy cloud-run-doctor \
  --source . \
  --project=pawpass-gdg-demo \
  --region=us-central1 \
  --service-account=cloud-run-doctor-sa@pawpass-gdg-demo.iam.gserviceaccount.com \
  --timeout=300 --max-instances=2 --min-instances=0 \
  --ingress=all --no-allow-unauthenticated \
  --set-env-vars=GOOGLE_GENAI_USE_ENTERPRISE=TRUE,GOOGLE_CLOUD_PROJECT=pawpass-gdg-demo,GOOGLE_CLOUD_LOCATION=global,DOCTOR_MODEL=gemini-3.7-flash,DOCTOR_THINKING_LEVEL=LOW,PAWPASS_SERVICE=pawpass,PAWPASS_REGION=us-central1,MCP_CLOUD_RUN_URL=https://run.googleapis.com/mcp,MCP_LOGGING_URL=https://logging.googleapis.com/mcp,MONITORING_MCP_ENABLED=false,LOG_DEFAULT_WINDOW_MIN=60,LOG_MAX_ENTRIES=20,SESSION_LOG_WINDOW_MIN=1440,SESSION_LOG_MAX_ENTRIES=100
```

Operator:

```bash
DEMO_OPERATOR_EMAIL="usuario@example.com"
gcloud run services add-iam-policy-binding cloud-run-doctor --project=pawpass-gdg-demo --region=us-central1 --member="user:${DEMO_OPERATOR_EMAIL}" --role="roles/run.invoker"
gcloud run services get-iam-policy cloud-run-doctor --project=pawpass-gdg-demo --region=us-central1
gcloud run services proxy cloud-run-doctor --project=pawpass-gdg-demo --region=us-central1 --port=8080
```

Anonymous should get 401/403.

## 7. Linguistic Review (T083)

All code symbols, files, variables, functions, types, comments, JSDoc, test titles in English; visible texts ES/EN via `messages/es.json`/`en.json`.

Check with:

```bash
grep -R "TODO" src/ --include="*.ts" --include="*.tsx" | head
```

_Review pending_

## 8. Logs

```bash
gcloud logging read 'resource.type="cloud_run_revision" resource.labels.service_name="cloud-run-doctor"' --freshness=5m --limit=5 --project=pawpass-gdg-demo
```

Logs must contain `doctorRequestId`/`supportId`/`investigationId` with `===` and only Evidence/summaries.
