# Phase 1B intent proposal review — draft only

**Status:** Internal proposal notes for possible Telegraph review. These concepts are not canonical, are not implemented, and must not be added to either miner manifest. No proposal has been submitted.

## Registry review

The live registry at <https://devnode.telegraphprotocol.com/engine/v1/intents> returned 134 entries on 2026-10-19. Exact-name searches found no entries matching any of the six proposed identifiers. The following nearest canonical capabilities were compared by registry descriptions:

| Proposed concept | Closest current canonical capabilities | Assessment |
| --- | --- | --- |
| `PROMPT_INJECTION_DETECTION` | `SECURITY_REVIEW` (code, dependencies, endpoints/configuration security findings); `CONTENT_MODERATION` (content policy classification) | No direct duplicate. A distinct proposal can focus on hostile instruction attempts in untrusted retrieved content, with quoted spans and no execution. |
| `AI_AGENT_ACTION_AUDIT` | `TASK_EXECUTION_QUALITY` (actual agent/job output against task, rubric, schema); `AGENT_TASK` (agent behavior/mechanics or autonomous-task requests) | No exact duplicate. Scope must be action-trace authorization/policy conformance, not general task quality or agent explanations. |
| `SOFTWARE_DEPENDENCY_RISK` | `SECURITY_REVIEW` explicitly covers known dependency CVEs, leaked credentials, and configuration; `CVE_LOOKUP`, `VULNERABILITY_TRIAGE` | High overlap. A proposal is defensible only if it focuses on dependency provenance, publisher/maintainer, transitive graph, and release integrity beyond vulnerability lookup, with suitable data sources. |
| `CLAIM_PROVENANCE_GRAPH` | `FACT_CHECK`, `CONTENT_VERIFICATION`, `RESEARCH_SYNTHESIS` | Partial overlap in evidence gathering and claim support. A graph of explicit claim/source edges, quotations, contradictions, and unknowns could be distinct if it does not turn provenance into a truth verdict. |
| `API_CONTRACT_CONFORMANCE` | `API_HEALTH_CHECK` explicitly verifies REST/GraphQL responsiveness, JSON schema payload structure, and status; `REGRESSION_VERIFY` runs checks and assertions against APIs | Strong duplicate risk. Do not propose under this name without Telegraph identifying a meaningful uncovered conformance scope. |
| `CROSS_SOURCE_CONSISTENCY` | `FACT_CHECK` evaluates claims using supporting evidence; `CONTENT_VERIFICATION` checks supplied content integrity/provenance; `RESEARCH_SYNTHESIS` combines evidence | Strong overlap. Defer unless the evaluator requires source-to-source comparison as a distinct task and supplies an objective comparison contract. |

## Drafts recommended for possible review

These are use-case drafts only. Telegraph would need to confirm or assign canonical names and schemas before any implementation or manifest change.

### PROMPT_INJECTION_DETECTION

- **Use case:** Given a retrieved page, document excerpt, or tool output, identify text that attempts to override system/developer instructions, exfiltrate secrets, or redirect an agent's task.
- **Draft input:** `{ content, source_id?, source_url? }`, where content is bounded supplied text and URL fetching is a separate explicitly authorized safe step.
- **Draft output:** candidate spans with character offsets, attack-pattern category, short explanation, and an uncertainty field; do not provide or execute instructions embedded in the source.
- **Evidence/evaluation:** return verbatim source spans; evaluate against human-labeled adversarial and benign imperative/document examples, with false-positive reporting and held-out attack patterns. Avoid claiming detection completeness.
- **Safety boundary:** detection only; no tool invocation, secret access, or automatic blocking. Treat source text as untrusted data.
- **Example:** “Does this retrieved page contain an instruction attempting to override the assistant's task? Quote the relevant span.”

### AI_AGENT_ACTION_AUDIT

- **Use case:** Compare a proposed or completed agent action trace with the task, explicit authorization, and policy provided by the caller.
- **Draft input:** `{ task, authorization_policy, action_trace[] }`, each action carrying a tool name and bounded arguments/result reference.
- **Draft output:** per-action `allowed`, `disallowed`, or `uncertain`, linked to exact task/policy/action evidence and missing authorization context.
- **Evidence/evaluation:** human-reviewed action traces with explicit policy clauses and expected per-action outcomes; measure false accusations and missed unauthorized actions separately. Do not infer hidden user authorization.
- **Safety boundary:** audit only; never execute, repeat, or modify actions. Redact credentials and private action payloads.
- **Example:** “Did this agent's three tool calls stay within the read-only access granted by this task?”

### CLAIM_PROVENANCE_GRAPH

- **Use case:** Map a caller-supplied set of claims to caller-supplied or safely retrieved sources, preserving support, contradiction, and unresolved relationships.
- **Draft input:** `{ claims[], sources[] }`, with each source identified by a URL or stable ID and attributable text/content.
- **Draft output:** graph nodes for claims/sources and edges `supports`, `contradicts`, or `mentions`, with exact quotation/span, source timestamp, and unresolved status.
- **Evidence/evaluation:** expert-labeled claim/source-edge graphs with exact-span checks, source identity checks, and separate precision/recall for support and contradiction. No edge should be invented when a source does not substantiate it.
- **Safety boundary:** provenance is not truth; report source independence and time limits, and do not let an LLM-generated citation count as evidence.
- **Example:** “Build a source map for these three claims and show which supplied articles support or contradict each one.”

## Deferred or duplicate-risk concepts

- `API_CONTRACT_CONFORMANCE`: defer because `API_HEALTH_CHECK` already names schema-payload and HTTP-status verification, with `REGRESSION_VERIFY` covering executable assertions. Seek protocol guidance before proposing any narrower new name.
- `CROSS_SOURCE_CONSISTENCY`: defer because `FACT_CHECK` and evidence synthesis already overlap heavily. A separate canonical task needs a clear evaluator distinction from claim truth-checking.
- `SOFTWARE_DEPENDENCY_RISK`: hold for a focused overlap decision. `SECURITY_REVIEW` already covers dependency CVEs, but supply-chain provenance could be a distinct use case if reliable registry, release-signing, maintainer, and transitive-dependency evidence can be named and evaluated.

## Decision and next gate

Only the three drafts above are recommended for possible human review, and none is ready for submission without product/evaluation agreement. The live registry comparison is evidence of current names/descriptions only; it does not establish Telegraph's willingness to accept a proposal. Obtain Telegraph review and exact canonical spelling/schema before implementing any proposal. Do not put these names in `miner.yaml`, `miner.yaml.template`, or the runtime supported-intent catalogue before that confirmation.
