/**
 * Human-readable rendering of a DeadlineSchedule for the terminal.
 * Pure string production — no console access — so it is trivially testable.
 */
import type { DeadlineSchedule } from "@lienguard/core";

const SEVERITY_LABEL: Record<string, string> = {
  critical: "CRITICAL",
  important: "IMPORTANT",
  informational: "INFO",
};

export function formatScheduleText(schedule: DeadlineSchedule): string {
  const lines: string[] = [];
  lines.push(`LienGuard — Deadline Schedule`);
  lines.push(`Jurisdiction: ${schedule.stateName} (${schedule.state})`);
  lines.push(`Claimant role: ${schedule.role}`);
  lines.push(`Rule set: ${schedule.meta.ruleSetVersion} | Engine: ${schedule.meta.engineVersion}`);
  lines.push("");

  if (schedule.items.length === 0) {
    lines.push("No deadlines could be computed from the dates provided.");
  } else {
    lines.push("DEADLINES (soonest first):");
    for (const item of schedule.items) {
      const tag = SEVERITY_LABEL[item.severity] ?? item.severity.toUpperCase();
      const adj = item.adjustedForNonBusinessDay ? ` (rolled from ${item.rawDueDate})` : "";
      lines.push(`  [${tag}] ${item.dueDate}${adj} — ${item.title}`);
      lines.push(`      ${item.statuteCitation}`);
    }
  }

  if (schedule.skipped.length > 0) {
    lines.push("");
    lines.push("NOT COMPUTED (missing input dates):");
    for (const s of schedule.skipped) {
      lines.push(`  - ${s.title}: ${s.reason}`);
    }
  }

  lines.push("");
  lines.push("DISCLAIMER:");
  lines.push(wrap(schedule.disclaimer, 76, "  "));
  return lines.join("\n");
}

/** Simple word-wrap so the disclaimer reads well in a terminal. */
function wrap(text: string, width: number, indent: string): string {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = indent;
  for (const word of words) {
    if (line.length + word.length + 1 > width && line !== indent) {
      out.push(line);
      line = indent + word;
    } else {
      line = line === indent ? indent + word : `${line} ${word}`;
    }
  }
  if (line !== indent) out.push(line);
  return out.join("\n");
}
