# 🤖 QA Sentinel — Agent Specification & Workflow Protocol

This document details the internal specifications, communication protocols, inputs, outputs, and runtime guardrails for each agent operating under the **QA Sentinel** supervisor.

---

## 📐 Agent Communication Standard

All agents communicate asynchronously through the **Supervisor Agent** using strictly validated JSON schemas. No worker agent communicates directly with peer worker agents.

```
                  ┌────────────────────────┐
                  │    Supervisor Agent    │
                  └───────────┬────────────┘
         ▲                    │                    ▲
         │ (JSON Reply)       │ (JSON Task)        │ (JSON Reply)
         │                    ▼                    │
┌────────┴──────────┐               ┌──────────────┴───────┐
│ Worker Agent A    │               │ Worker Agent B       │
└───────────────────┘               └──────────────────────┘
```

---

## 1. 🎯 Supervisor Agent
- **Archetype:** Orchestrator / State Machine Controller
- **System Objective:** Ingest triggers, evaluate current project state, invoke specialized agents in dependency order, enforce quality gates, and maintain audit trails.
- **Inputs:**
  - Ingestion events (Jira issue, Git diff, QA manual dispatch)
  - Output payloads from worker agents
  - Human review decision signals (`APPROVE`, `MODIFY`, `REJECT`)
- **Outputs:**
  - Dispatched execution plans
  - Dashboard status metrics
  - Alert broadcasts on timeout or budget threshold reach

---

## 2. 📋 Requirements Analyst Agent
- **Archetype:** NLP Parser & Analytical Reasoner
- **System Objective:** Ingest unstructured business specifications or Jira user stories and produce structured, testable acceptance criteria with identified edge cases.
- **Key Capabilities:**
  - Detects underspecified logic (e.g., *"What happens if session expires on step 3?"*)
  - Boundary value discovery (e.g., empty strings, UTF-8 symbols, maximum integer payloads)
  - Eliminates redundant criteria across related user stories
- **Input Payload:**
  ```json
  {
    "source": "jira",
    "issue_id": "AUTH-402",
    "raw_description": "As a user, I should be able to reset my password using my registered email address.",
    "acceptance_criteria": ["Send 6-digit OTP", "OTP valid for 10 minutes"]
  }
  ```
- **Output Payload:**
  ```json
  {
    "testable_criteria": [
      { "id": "TC-01", "intent": "Happy path OTP dispatch to valid registered email" },
      { "id": "TC-02", "intent": "Attempt OTP request with unregistered email" },
      { "id": "TC-03", "intent": "Verify expiration behavior after 10m 01s" }
    ],
    "ambiguity_flags": [
      "Rate-limit policy not specified for repeated OTP requests"
    ]
  }
  ```

---

## 3. 🧪 Test Designer Agent
- **Archetype:** Scenario Modeler & Test Data Synthesizer
- **System Objective:** Translate testable criteria into step-by-step test cases, including mock dataset definitions and priority weightings.
- **Key Capabilities:**
  - Creates positive, negative, and adversarial verification steps
  - Synthesizes realistic test fixtures (e.g., valid email formats, credit card test numbers)
  - Maps requirements to test coverage indices
- **Output Payload:**
  ```json
  {
    "scenario_name": "Password Reset Expiry",
    "priority": "P1",
    "preconditions": ["User account exists in test DB with active status"],
    "steps": [
      { "action": "Navigate to /forgot-password", "expected": "Form displayed" },
      { "action": "Enter registered email and submit", "expected": "Success notification shown" },
      { "action": "Wait for OTP token generation", "expected": "Token recorded in mock mailer" },
      { "action": "Submit token at T+11 minutes", "expected": "Error: 'Token expired' rendered" }
    ]
  }
  ```

---

## 4. 🔍 Explorer Agent
- **Archetype:** Headless Crawler & DOM Mapper
- **System Objective:** Drive headless Playwright browsers against target staging URLs to explore UI hierarchies and capture reliable selectors before tests are authored.
- **Key Capabilities:**
  - Evaluates DOM element accessibility trees (`getByRole`, `getByLabel`, `data-testid`)
  - Identifies dynamic attributes, iframes, and shadow DOM boundaries
  - Compiles a stable UI element directory for the Automation Agent
- **Output:**
  ```json
  {
    "page": "/forgot-password",
    "elements": {
      "email_input": { "locator": "getByRole('textbox', { name: 'Email' })", "confidence": 0.98 },
      "submit_btn": { "locator": "getByRole('button', { name: 'Send Code' })", "confidence": 0.99 }
    }
  }
  ```

---

## 5. ⚙️ Automation Agent
- **Archetype:** Code Synthesizer & Page Object Model Author
- **System Objective:** Ingest human-approved test designs and UI maps to synthesize production-grade TypeScript Playwright tests.
- **Guaranteed Standards:**
  - Strictly typed TypeScript (`.spec.ts`)
  - Complies with Page Object Model (POM) pattern
  - Never uses brittle XPath selectors when accessible semantic locators exist
  - Includes explicit assertions (`expect(locator).toBeVisible()`)

---

## 6. 🔎 Failure Investigator Agent
- **Archetype:** Multimodal Forensic Detective
- **System Objective:** Diagnose test failures by triangulating Playwright artifacts (screenshots, videos, trace files, network HAR, console logs).
- **Failure Taxonomy:**
  1. `PRODUCT_BUG`: Real functional regression or 500 error in application code.
  2. `LOCATOR_CHANGED`: UI changed intentionally, causing timeout on outdated selector.
  3. `TEST_SCRIPT_DEFECT`: Timing flaw or improper assertion in the test code.
  4. `ENVIRONMENT_FAILURE`: Staging server timeout, 502 Bad Gateway, DNS resolution error.
  5. `FLAKY_TEST`: Race condition, animation latency, or non-deterministic third-party dependency.
  6. `DATA_ISSUE`: Pre-seeded test record was deleted or already used.
