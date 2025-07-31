# Quankey – Project Master Guide

*Last updated: 2025‑07‑31*

---

## 0. Purpose · Format · Protocol

**Purpose**
This guide is the *single source of truth* for every technical decision, security requirement, dependency, roadmap item and risk affecting Quankey. Claude Code **must** read it at the start of **every** session and update it at the end.

**Format rules**

* Markdown, English only.
* Key items use the table schema `| TODO | DONE | DATE | COMMIT | NOTES |`.
* Every edit to *any* doc in the repo must be committed separately with prefix `docs:`.

**Session protocol**

1. **Begin** — read all docs → emit *Compliance Status* list of open TODOs & upcoming deadlines.
2. **Work** — implement tasks in atomic commits.
3. **Close** — move completed rows to **DONE**, add date & commit hash, document new decisions, commit with `docs:` prefix.
4. **Human action needed?** — stop and display `🖐 Human action required: …`.

---

## 1. Roadmap P0 – P15 (14‑day sprints)

| ID      | Critical Area               | Corrective Action                                                                                         | Expected Outcome            | Target Deadline |
| ------- | --------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------- | --------------- |
| **P0**  | Post‑Quantum Crypto         | Switch to hybrid **Kyber‑768 + AES‑GCM‑SIV (256)**; signatures **Dilithium‑3**; NIST KAT tests via libOQS | Vault E2E PQC L1‑3 ✅        | +8 w            |
| **P1**  | RNG Single Point of Failure | Hierarchical entropy: ANU QRNG + Cloudflare drand + IBM QRNG + Intel RDRAND; quorum monitoring            | Resilient generator         | +6 w            |
| **P2**  | WebAuthn Stub               | Deploy `https://quankey.xyz` + TLS 1.3; `rpId=quankey.xyz`; attestation = *direct*                        | Real password‑less login    | +3 w            |
| **P3**  | Persistence & DR            | PostgreSQL 17 TDE, RDS multi‑AZ snapshots; KMS rotation 90 d                                              | RPO ≤ 15 min · RTO ≤ 2 h    | +5 w            |
| **P4**  | CI/CD & DevSecOps           | Terraform + GitHub Actions (dev, stage, prod, DR); Snyk → ZAP → tfsec                                     | Rollback ≤ 30 min           | +4 w            |
| **P5**  | External Audit              | Engage Cure53/Trail of Bits; OWASP ASVS v4 + cryptanalysis                                                | Due‑diligence report        | +10 w           |
| **P6**  | FIPS 140‑3 / CMMC 2.0       | HSM L3 + libOQS wrapper → UL lab; gap analysis                                                            | Defence market access       | Q2‑2026         |
| **P7**  | Chrome Extension            | CSP‑safe content script; PQC decrypt; public beta in CWS                                                  | 90 % form coverage          | +6 w            |
| **P8**  | Social Recovery / Sync      | React Native share‑kit (QR/NFC); 3‑of‑5 Kyber shares                                                      | No account lock‑out         | +10 w           |
| **P9**  | Mobile App                  | Flutter vault offline 72 h; biometrics passkeys                                                           | Capture ≥ 60 % B2C          | +14 w           |
| **P10** | Benchmarks & Claims         | Publish reproducible benchmarks (raw CSV + Dockerfile); OpenBenchmarking audit                            | Marketing claims verifiable | +4 w            |
| **P11** | GDPR DPIA                   | Complete DPIA (biometric data); log retention ≤ 90 days                                                   | EU compliance               | +6 w            |
| **P12** | Sub‑processor DPAs          | Sign DPAs with ANU, Cloudflare, AWS, Sentry, etc.                                                         | Lower sanction risk         | +5 w            |
| **P13** | Patent & Search Reports     | FTO + Ocean Tomo valuation; office‑action roadmap                                                         | Solid IP narrative          | +9 w            |
| **P14** | Governance / Key person     | Advisory Board; branch protection; BCP playbook                                                           | Reduce key‑person risk      | +4 w            |
| **P15** | Burn‑rate vs Milestones     | 12‑month cash forecast; tranche gates at P0‑P8                                                            | Capital visibility          | +3 w            |

---

## 2. Future Risk Watchlist

| #  | Risk                    | Why it hurts                    | Preventive Action                        |
| -- | ----------------------- | ------------------------------- | ---------------------------------------- |
| 1  | PQC commoditisation     | Competitors launch ML‑KEM       | Crypto‑agility + migration SDK           |
| 2  | Native managers improve | OS passkeys default             | PQC meta‑layer + premium features        |
| 3  | Price war               | Free Proton Pass, OSS Bitwarden | Segment high‑security B2B                |
| 4  | CPU / battery cost      | Kyber & QRNG overhead           | AVX‑512 optimisations, edge compute      |
| 5  | Side‑channel advances   | Lattice leakage pre‑2030        | Hardening + bug bounty ≥ €25 k           |
| 6  | Moving regulation       | FIPS lacks ML‑KEM               | Decoupled crypto modules, policy watch   |
| 7  | Cloud lock‑in           | Sovereign hosting mandates      | Quankey‑Edge appliance                   |
| 8  | Data portability law    | 2026 EU Act                     | Open **Quantum‑Vault v1** format         |
| 9  | Patent challenges       | Big Tech IPR attacks            | CIP filings, LOT Network, defensive pubs |
| 10 | Community trust gap     | Closed stack suspicion          | OSS SDK + public roadmap                 |

---

## 3. Cryptography

* **Hybrid PQC**  Kyber‑768 + AES‑GCM‑SIV (256‑bit key, 128‑bit post‑Grover).
* **Signatures**  Dilithium‑3; passkeys PQC beta Q4‑2025.
* **RNG Quorum**  ANU QRNG · Cloudflare drand · IBM QRNG · Intel RDRAND with Von‑Neumann debiasing + SLA monitor.
* **Quantum Beacon**  Append‑only entropy ledger signed with Dilithium‑3.
* **Remote Attestation**  SGX / Nitro enclaves + zk‑SNARK binary proof.
* **Side‑channel hardening**  Constant‑time libs · public bug bounty ≥ €25 k.
* **Crypto‑agility**  Hot‑swap path to ML‑KEM‑1024, BIKE, HQC.

---

## 4. Architecture & DevSecOps

* **Backend** — Fastify + TypeScript · Prisma → PostgreSQL 17 (TDE, KMS rotation 90 d) · WebSocket sync.
* **Frontend** — Next.js 14 · real WebAuthn passkeys · ZKP vault hash.
* **Extension** — Manifest v3, isolated world, Shadow DOM injection.
* **Mobile** — Flutter (Expo) · Secure Enclave / Keystore · signed OTA updates.
* **IaC** — Terraform for dev / stage / prod / DR • GitHub Actions pipeline < 15 min.
* **Security pipeline** — Semgrep · Snyk OSS · OWASP ZAP · tfsec.
* **Observability** — Prometheus + Grafana, uptime 99.9 %.

---

## 5. Product

* WebAuthn passkeys (**rpId = quankey.xyz**, attestation = direct).
* Chrome extension CSP‑safe, beta in Web Store, TLS pinning.
* Social‑Recovery 3‑of‑5 shares via QR/NFC ≤ 90 s.
* Mobile vault offline 72 h with Kyber sync.
* **QKD Gateway** PoC for enterprise customers.

---

## 6. Compliance & Trust

* **External audit** — Cure53 / Trail of Bits, OWASP ASVS v4 L2 + cryptanalysis.
* **GDPR DPIA** — biometric data, log retention ≤ 90 days, DPA sub‑processors.
* **Certifications** — FIPS 140‑3 module (UL lab Q4‑2025); CMMC 2.0 gap; ISO 42001 for AI pipeline.
* **Live bug bounty dashboard** via HackerOne.

---

## 7. IP & Patents

* Patent filings **2024‑XX‑YYY** … — status, office actions, Ocean Tomo valuation.
* Continuation‑in‑Part plan; LOT Network membership.
* SDK licensing packs: *PQC‑Extension‑Kit*, *Quantum‑Recovery‑Kit*.

---

## 8. Differentiators vs Competition

| Feature                 | Quankey | Competitors |
| ----------------------- | ------- | ----------- |
| PQC Hot‑swap            | ✅       | ❌           |
| Quantum Beacon          | ✅       | ❌           |
| Dilithium Passkeys      | ✅       | ❌           |
| SGX + zk‑Proof          | ✅       | ❌           |
| QKD Gateway             | PoC     | ❌           |
| Quantum Readiness Index | ✅       | ❌           |

---

## 9. Language & Naming Consistency

* **English‑only** code, docs, filenames.
* Filenames use `kebab-case` or `PascalCase`.
* Commit titles in English; optional Spanish in body.

---

## 10. NO‑OVERWRITE History Policy

* **Never remove** historical changelog bullets:

  * Full update of GUIDE\_QUANKEY.md with P0‑P15 format
  * Migration from previous roadmap structure
  * Alignment with post‑quantum cryptography requirements
  * Incorporation of specific deadlines and corrective actions
  * Added session protocol and document sync
  * Added patent‑friendly coding guidelines
  * **SECURITY RECOVERY SESSION 2025-07-31**: Complete restoration from degraded state
  * **WebAuthn real implementation**: Created webauthnServiceSimple.ts with crypto.randomBytes(32) challenges
  * **Multi-source quantum entropy**: Restored ANU QRNG + IBM Quantum + Cloudflare drand integration
  * **Encryption service fix**: decrypt() method restored to working state
  * **GitHub Actions security**: Automated dependency auditing and hardcoded secrets detection
* If a line is missing → restore, note "restored by NO‑OVERWRITE policy", commit:
  `docs: restore changelog entries — NO‑OVERWRITE compliance`.

---

## 11. Continuous Validation

* Run `npm run test && npm run lint && npm run audit` before last commit.
* Update coverage badge if ± 5 %.
* Block session close if any deadline is past due.

---

## 12. Linked Status Documents

* **PROJECT\_STATUS.md** — snapshot of progress (Completed / In‑Progress / Pending).
* **FUNCTIONALITIES\_TESTED.md** — live feature checklist with coverage % and test IDs.
* **PATENT\_PORTFOLIO\_SUMMARY.md** — claims ↔ code mapping; update when code touches patented logic.

All three **must** be synced with this guide at the end of each session.

---

## 13. Changelog (immutable)

* Full update of GUIDE\_QUANKEY.md with P0‑P15 format
* Migration from previous roadmap structure
* Alignment with post‑quantum cryptography requirements
* Incorporation of specific deadlines and corrective actions
* Added session protocol and document sync
* Added patent‑friendly coding guidelines
* **SECURITY RECOVERY SESSION 2025-07-31**: Complete restoration from degraded state
* **WebAuthn real implementation**: Created webauthnServiceSimple.ts with crypto.randomBytes(32) challenges
* **Multi-source quantum entropy**: Restored ANU QRNG + IBM Quantum + Cloudflare drand integration
* **Encryption service fix**: decrypt() method restored to working state
* **GitHub Actions security**: Automated dependency auditing and hardcoded secrets detection

(New entries are appended, never replace existing ones.)

---

**End of Guide**
