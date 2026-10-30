# Public source inventory — THREAT_INTELLIGENCE_INDICATOR pilot

Retrieved/read on 2026-10-30. The local private evidence register links each case to the relevant source and records the exact claim and date. These sources document historical reporting; they do not establish current indicator activity.

| Source | Type and date | What it verifies | Scope/limitation |
|---|---|---|---|
| [CISA/NSA/MS-ISAC AA23-025A](https://www.cisa.gov/sites/default/files/2023-02/aa23-025a-protecting-against-malicious-use-of-rmm-software.pdf) | Joint cybersecurity advisory, 2023-01-25 | Five domains and their reported campaign roles/observation dates, including “suspected first-stage” labels and a second-stage malicious-domain label. | Campaign observations from 2022; not a current DNS/reputation statement. TLP:CLEAR; public disclosure allowed subject to standard copyright. |
| [CISA/CGCYBER AA22-174A](https://www.cisa.gov/sites/default/files/publications/AA22-174A_Joint_CSA_Malicious_Cyber_Actors_Exploiting_Log4Shell_in_Unpatched_VMware_Horizon_Systems_FINAL.pdf) | Joint advisory, 2022-06-23 | Four IP observations linked to activity described in the report, preserving qualified language such as “appears to be part of” C2 infrastructure. | Historical incident evidence; no present ownership or reputation check. |
| [FBI/CISA/DC3 AA24-241A](https://www.cisa.gov/sites/default/files/2024-08/aa24-241a-iran-based-cyber-actors-enabling-ransomware-attacks-on-us-organizations_0.pdf) | Joint advisory, 2024-08-28 | Six IP/domain rows and their first-seen/most-recently-observed dates. The advisory explicitly says to vet indicators before action. | Historical observations through August 2024; not a current reputation verdict. |
| [IETF RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) | Informational RFC, 2010-01 | 192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24 are reserved for documentation examples and should not appear on the public Internet. | Establishes special-use address status, not the meaning of a private lab's log entry or reputation-feed output. |

The source documents are authoritative public advisories/specifications. No paid API, credentialed query, active scan, or external submission was used. The dataset does not contain personal data, raw logs, secrets, or live credentials.
