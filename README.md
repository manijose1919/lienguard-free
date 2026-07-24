# LienGuard Free

**Never miss a construction lien or preliminary-notice deadline.**

LienGuard is a deadline engine for the U.S. construction industry. Contractors,
subcontractors, and material suppliers must serve preliminary notices and record
mechanics liens within rigid, state-specific windows — miss one and you can
**forfeit your legal right to get paid**. LienGuard computes every deadline from
a codified, statute-cited rule set.

This is the **open-source Free tier**: a pure, dependency-free calculation
engine, a command-line tool, and a REST API. It stands entirely on its own.

> ⚖️ **Not legal advice.** LienGuard produces deadline *estimates* from a
> codified rule set. Statutes change and fact patterns vary. Always verify
> against the current governing statute and consult a licensed construction
> attorney.

---

## What's in the Free tier

| Package | What it is |
|---|---|
| `@lienguard/core` | The deadline rules engine — pure, stateless, **zero runtime dependencies**. CA, TX, FL. |
| `@lienguard/cli` | `lienguard` command-line calculator. |
| `@lienguard/api` | Fastify REST API (`POST /v1/calculate`) with rate limiting, CORS allowlist, and strict validation. |

### Tier comparison

| Capability | **Free** | Premium | Pro |
|---|:---:|:---:|:---:|
| Deadline calculator (CA/TX/FL) | ✅ | ✅ | ✅ |
| CLI + REST API | ✅ | ✅ | ✅ |
| Save projects (persistence) | — | ✅ | ✅ |
| PDF notice documents | — | ✅ | ✅ |
| Multi-channel + escalation reminders | — | ✅ | ✅ |
| iCalendar (.ics) export | — | ✅ | ✅ |
| Expanded state coverage (→ 50) | — | — | ✅ |
| Team seats + roles (RBAC) | — | — | ✅ |
| API keys + signed webhooks | — | — | ✅ |
| Recovery Analytics ($ at-risk) | — | — | ✅ |
| Integrations (calendar, PM tasks) | — | — | ✅ |
| AI document intake | — | — | ✅ |

Premium ($39/mo) and Pro ($149/mo) are commercial modules that build on this
core — see the Pro distribution.

---

## Architecture

```
@lienguard/api    Fastify REST server  ─┐
@lienguard/cli    command-line tool    ─┤── both are thin adapters over…
@lienguard/core   ⚙ deadline engine    ─┘   …the pure rules engine (the moat)
```

The engine is **stateless and deterministic**: same input → identical output,
every time. Deadlines are computed in UTC to avoid daylight-saving off-by-one
bugs, and weekend/holiday roll-forward uses the full U.S. federal holiday
calendar (including observed dates).

## Quick start

```bash
npm install
npm run build
npx lienguard --state CA --role subcontractor --first 2025-03-03
```

See **[SETUP.md](./SETUP.md)** to install and run, and **[HOW-TO.md](./HOW-TO.md)**
for CLI and API usage.

## License

MIT — see [LICENSE](./LICENSE). Contributions welcome.
