# How-To — LienGuard Free

## 1. The command-line calculator

```bash
lienguard --state <XX> --role <role> --first <YYYY-MM-DD> [options]
```

**Required**

| Flag | Meaning |
|---|---|
| `--state` | USPS state code: `CA`, `TX`, or `FL` (Free tier). |
| `--role` | `general-contractor`, `subcontractor`, `sub-subcontractor`, `material-supplier`, or `laborer`. |
| `--first` | First furnishing date (first day you supplied labor/materials). |

**Optional dates** (unlock more deadlines)

| Flag | Meaning |
|---|---|
| `--last` | Last furnishing date. |
| `--completion` | Project completion date. |
| `--noc` | Notice of Completion recording date. |

**Output**

| Flag | Meaning |
|---|---|
| `--json` | Emit the full schedule as JSON (for scripting). |
| `--help` | Usage. |

### Example

```bash
lienguard --state CA --role subcontractor --first 2025-03-03 --completion 2025-06-01
```

```
LienGuard — Deadline Schedule
Jurisdiction: California (CA)
Claimant role: subcontractor
Rule set: 2025.1 | Engine: 1.0.0

DEADLINES (soonest first):
  [CRITICAL] 2025-03-24 (rolled from 2025-03-23) — Serve Preliminary Notice
      Cal. Civ. Code sec. 8200-8204
  [CRITICAL] 2025-09-02 (rolled from 2025-08-30) — Record Mechanics Lien (from completion)
      Cal. Civ. Code sec. 8412, 8414
...
```

Deadlines that fall on a weekend or federal holiday are automatically rolled
forward to the next business day; the original ("raw") date is shown too.

## 2. The REST API

Start it (`npm run start:api`), then:

### `GET /health`
```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### `GET /v1/states` — supported jurisdictions
```bash
curl http://localhost:3000/v1/states
# {"states":["CA","FL","TX"]}
```

### `POST /v1/calculate` — compute a schedule
```bash
curl -X POST http://localhost:3000/v1/calculate \
  -H "content-type: application/json" \
  -d '{"state":"CA","role":"subcontractor","firstFurnishingDate":"2025-03-03"}'
```

Response (abridged):
```json
{
  "state": "CA",
  "stateName": "California",
  "role": "subcontractor",
  "items": [
    {
      "ruleId": "ca-preliminary-notice",
      "title": "Serve Preliminary Notice",
      "dueDate": "2025-03-24",
      "rawDueDate": "2025-03-23",
      "adjustedForNonBusinessDay": true,
      "severity": "critical",
      "statuteCitation": "Cal. Civ. Code sec. 8200-8204"
    }
  ],
  "skipped": [ ... ],
  "disclaimer": "LienGuard provides deadline estimates ... not legal advice ...",
  "meta": { "engineVersion": "1.0.0", "ruleSetVersion": "2025.1" }
}
```

### Error handling

All errors share one envelope:
```json
{ "error": "ValidationError", "message": "...", "issues": [ { "path": "firstFurnishingDate", "message": "Required" } ] }
```

| Status | When |
|---|---|
| `400` | Invalid/missing fields, unknown/unsupported state, unknown extra fields. |
| `429` | Rate limit exceeded (60 requests/minute/IP by default). |

## 3. Interpreting results

- **`severity`** — `critical` deadlines forfeit rights if missed; treat them as hard dates.
- **`adjustedForNonBusinessDay`** — `true` means the statutory date landed on a weekend/holiday and was rolled forward.
- **`skipped`** — deadlines that need a date you didn't provide (e.g. add `--completion` to unlock lien-recording deadlines).
- **Always** confirm against the current statute (see the citation) and your attorney.
