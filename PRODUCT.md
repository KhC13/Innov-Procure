# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Government innovation / department officers who publish public-sector challenges and drive discovery, evaluation, pilots, and procurement.

**Secondary:** Startup founders who discover challenges, apply with solutions, and participate in pilots.

**Demo audience:** SIH / showcase evaluators reviewing the full challenge-to-procurement workflow; not the primary product user.

Other confirmed roles on the platform: Technical Evaluator, Procurement Officer, Super Admin.

## Product Purpose

InnovProcure is a unified digital platform that enables government departments to discover, evaluate, pilot, procure, and scale innovative startup solutions through a transparent, outcome-driven workflow.

Success means departments can move from a real public need to a validated, procurement-ready solution with measurable pilot outcomes—and startups can participate in that path without navigating opaque traditional procurement alone.

## Positioning

Explainable AI matching plus an end-to-end journey from challenge discovery through evaluation, pilot, and GFR-aligned procurement. Maharashtra is the primary implementation and branding context.

## Operating Context

Core workflow: Government Challenge → Discovery & Eligibility → Expert Evaluation & Scoring → Pilot Sandbox → Milestone-based Procurement → Impact Validation → Scale.

Authenticated workspace surfaces: executive dashboard, government challenges, AI Match Studio, startup directory, screening & review, pilots & KPIs, procurement pipeline, and (admin) audit trail. Public marketing landing and role-based auth precede the workspace.

Demo operation includes seeded personas, password-gated persona switching, and demo data reset. Notifications are polled over REST (no realtime websocket layer).

## Capabilities and Constraints

Confirmed capabilities: outcome-based challenges; startup directory and document upload; proposal apply / shortlist / reject; explainable AI match generation and shortlisting; multi-dimension evaluation; pilot KPI tracking and scale assessment; procurement stage advancement and contracts; audit logs for Super Admin; PDF pilot dossier export; JWT auth with role-based access.

Technical constraints for future UI work: preserve existing `/api` contracts, authentication (JWT in localStorage), and database integrations; do not change backend behavior as a side effect of redesign.

Undecided / out of band for this record: deep-link URL routing and stronger frontend-only role chrome remain product-UX options, not confirmed requirements.

## Brand Commitments

- Product name: **InnovProcure**
- Primary geographic / institutional framing: Government of Maharashtra; tagline cues such as “Innovation for Maharashtra”
- Compliance language tied to GFR 2017 / public procurement policy where the product already surfaces it
- Built by Team DoraX (project attribution)
- Voice: real government digital infrastructure—not generic SaaS dashboard tone

## Evidence on Hand

- Live demo: https://innovprocure-y0ob.onrender.com
- In-product demo stats and seed content (departments, challenges, startups, pilots) used for demonstration
- Role demo accounts (e.g. `@innovprocure.gov.in` / `@innovprocure.com`)
- Documentation under `docs/` (architecture, API, features, deployment)
- Screenshots under `docs/screenshots/`

Future work must not fabricate government partnerships, real agency testimonials, outcome claims, or compliance certifications beyond what the product and docs already state.

## Product Principles

1. Feel like real government digital infrastructure, not a generic SaaS dashboard.
2. Give government departments and startups equal attention in the product story and journey.
3. Make the complete challenge-to-procurement journey easy to understand at every step.
4. Present AI matching as transparent and explainable—never as an unexplained automated decision.
5. Do not fabricate government partnerships, outcomes, or compliance certifications.

## Accessibility & Inclusion

No product-specific accessibility standard was confirmed beyond ordinary web usability expectations for a government-facing platform. Treat WCAG-minded clarity, contrast, and keyboard use as open good practice unless a formal standard is later bound.
