#!/usr/bin/env node
/**
 * The only place that binds CLI logic to real process I/O.
 * Keeps `runCli` pure and testable; this wrapper stays trivially correct.
 */
import { runCli } from "./run.js";

const result = runCli(process.argv.slice(2));
if (result.stdout) process.stdout.write(result.stdout + "\n");
if (result.stderr) process.stderr.write(result.stderr + "\n");
process.exit(result.exitCode);
