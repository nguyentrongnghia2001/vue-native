# Project rule: Review + Phase/Feature logging (mandatory)

This rule applies to the whole `vue-native` workspace.

## Mandatory workflow before any new Feature or Phase

Before implementing a new **Feature** or **Phase**, the agent MUST complete these steps first:

1. **Overview previous work**
   - Summarize what has already been completed in the previous Phase/Feature.
   - Include: objective, files changed, tests run, current status.

2. **Log the overview**
   - Update `docs/PHASE_FEATURE_LOG.md` with a new entry.
   - Every entry must include:
     - Date/time
     - Scope (`Phase` or `Feature`)
     - What was done
     - Validation (tests/typecheck/build)
     - Next scope to implement

3. **Require approval checkpoint in chat**
   - After writing the log entry, present the summary to the user for review.
   - Only proceed to the new Phase/Feature after this checkpoint is shown.

## Log format (required)

Use this structure in `docs/PHASE_FEATURE_LOG.md`:

- `## [YYYY-MM-DD HH:mm] Phase X / Feature Y`
- `### Overview`
- `### Files changed`
- `### Validation`
- `### Decision / Next`

## Quality constraints

- Do not skip the log step when user asks to start a new Phase/Feature.
- Keep entries concise, review-friendly, and in Vietnamese if user communicates in Vietnamese.
- If no prior log exists, create `docs/PHASE_FEATURE_LOG.md` before continuing implementation.
