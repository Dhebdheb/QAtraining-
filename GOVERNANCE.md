# 🛡️ QA Sentinel — Governance & Operational Control Manual

This document details the strict governance policies, human-in-the-loop checkpoints, and cost-control guardrails enforced in QA Sentinel.

---

## 🛑 Fundamental Design Axiom

> **QA Sentinel is an on-demand instrument, never an autonomous daemon.**  
> It does not run background LLM loops without explicit invocation. If the QA team turns it off, consumption drops to zero.

---

## 1. 🎛️ On/Off Controls & Trigger Policies

### 1.1 Master System Switch
- **Status Options:** `ENABLED` | `PAUSED` | `DISABLED`
- Setting the system to `DISABLED` terminates all active browser sessions, clears the task queue, and rejects all incoming webhooks from Git or Jira with a `423 Locked` status.

### 1.2 Granular Agent Toggles
Each agent can be individually toggled depending on team preference:

| Agent Toggle | Default | Recommended Scenario |
|---|:---:|---|
| `enable_requirements_analyst` | ON | Keep ON to streamline ticket breakdown. |
| `enable_test_designer` | ON | Keep ON for automated test scenario drafting. |
| `enable_explorer` | ON | Toggle OFF if your application runs in an isolated VPN requiring manual setup. |
| `enable_automation_agent` | ON | Toggle OFF if your team only wants manual test cases generated. |
| `enable_failure_investigator` | ON | Highly recommended ON; saves hours of manual triage. |

---

## 2. 💰 Token & Cost Guardrails

To prevent surprise billing from cloud LLM providers, QA Sentinel enforces hard programmatic caps:

```
                    ┌────────────────────────────┐
                    │    Incoming AI Request     │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │   Daily Quota Exceeded?    │
                    └──────┬──────────────┬──────┘
                       YES │              │ NO
                           ▼              ▼
                 [ Freeze & Notify ]  [ Execute Request ]
```

1. **Daily Token Cap:** Hard limit (e.g., max 500,000 tokens / 24 hours). Once reached, all LLM calls freeze until reset or manual administrative override.
2. **Per-Run Budget Limit:** Set a maximum dollar ceiling per suite execution (e.g., max \$2.50 per regression run).
3. **Model Tiering:**
   - Lightweight models (GPT-4o-mini / Claude 3.5 Haiku) for parsing and task planning.
   - Frontier models (GPT-4o / Claude 3.5 Sonnet) reserved exclusively for complex script generation and failure vision forensics.

---

## 3. 👤 Human-in-the-Loop Quality Gates

QA Sentinel implements two mandatory human approval checkpoints where the workflow will halt indefinitely until a human engineer responds:

### Checkpoint A: Test Design Sign-Off (Pre-Automation)
- **When:** After the Test Designer produces test cases, but *before* the Automation Agent writes any Playwright code.
- **Why:** Prevents AI from automating flawed, incorrect, or hallucinated scenarios.
- **Options for QA Engineer:**
  - `Approve`: Dispatches automation generation immediately.
  - `Edit In-Place`: Modify assertions or test steps directly in the web UI.
  - `Reject`: Instructs agent to discard and replan.

### Checkpoint B: Defect Triage Sign-Off (Post-Execution)
- **When:** After a test fails and the Failure Investigator recommends a root cause.
- **Why:** Prevents filing false-positive bug tickets to developer backlogs.
- **Options for QA Engineer:**
  - `Confirm Bug`: Auto-publishes a detailed defect report to Jira.
  - `Mark as Script Issue`: Dispatches self-healing loop to update the test script.
  - `Ignore`: Marks failure as an accepted transient environment blip.
