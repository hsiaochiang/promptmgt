<!--
Sync Impact Report - Constitution v1.1.0

VERSION CHANGE: 1.0.0 → 1.1.0
REASON: Added Principle V (Language & Documentation Standards) requiring Traditional Chinese for all specifications, plans, and user-facing documentation

PRINCIPLES ADDED:
  5. Language & Documentation Standards - Mandates Traditional Chinese (zh-TW) for all specifications, plans, and user-facing documentation

PRINCIPLES MODIFIED:
  3. User Experience Consistency - Updated internationalization bullet to align with new Principle V

SECTIONS MODIFIED:
  - Core Principles (4 → 5 principles)
  - Development Standards - Quality gates updated to reference language compliance

TEMPLATES STATUS:
  ✅ plan-template.md - Already language-agnostic structure, compatible with zh-TW content
  ✅ spec-template.md - Already language-agnostic structure, compatible with zh-TW content
  ✅ tasks-template.md - Already language-agnostic structure, compatible with zh-TW content
  ⚠ AGENTS.md - Already specifies Traditional Chinese preference, now formalized in constitution

FOLLOW-UP TODOS: None - all placeholders filled
-->

# PromptMgt Constitution

## Core Principles

### I. Code Quality First

All code contributions MUST adhere to the following non-negotiable quality standards:

- **Maintainability**: Code must be self-documenting with clear naming conventions; complex
  logic requires inline comments explaining the "why," not the "what"
- **Consistency**: Follow established patterns within the codebase; use linters and
  formatters (configured in project); style guide violations block merge
- **Modularity**: Functions/methods have single responsibility; maximum complexity threshold
  enforced (e.g., cyclomatic complexity < 10)
- **Code Review**: All changes require peer review; reviewer must verify adherence to
  constitution principles before approval

**Rationale**: Technical debt compounds exponentially. Enforcing quality at entry prevents
costly refactoring and ensures long-term project sustainability.

### II. Testing Standards (NON-NEGOTIABLE)

Testing discipline is mandatory and follows a strict Test-Driven Development (TDD) approach:

- **Test-First Workflow**: Tests MUST be written before implementation; tests MUST fail
  initially, then pass after implementation (Red-Green-Refactor cycle)
- **Coverage Requirements**: Minimum 80% code coverage for unit tests; critical paths
  require 100% coverage
- **Test Pyramid**: Unit tests (70%) → Integration tests (20%) → E2E tests (10%); each
  layer tests different concerns
- **Contract Testing**: All public APIs/interfaces require contract tests validating
  inputs, outputs, and error conditions
- **Regression Prevention**: Bug fixes MUST include regression tests demonstrating the
  bug and validating the fix

**Rationale**: TDD ensures code correctness from the start, catches regressions early,
and provides living documentation of expected behavior. Non-compliance introduces undetected
defects and erodes user trust.

### III. User Experience Consistency

User-facing features MUST deliver consistent, intuitive, and accessible experiences:

- **Interface Consistency**: UI/CLI patterns must be consistent across features; reuse
  established components; document deviations in design decisions
- **Accessibility**: WCAG 2.1 AA compliance for web interfaces; CLI tools must support
  standard input/output conventions; error messages must be actionable
- **Validation Feedback**: User input validation provides immediate, specific feedback;
  errors indicate what went wrong and how to fix it
- **Documentation**: User-facing features require quickstart guides and acceptance
  scenarios; examples must be tested and kept current
- **Internationalization**: All user-facing interfaces must support localization (see 
  Principle V for documentation language requirements)

**Rationale**: Inconsistent UX creates cognitive load, reduces adoption, and increases
support burden. Accessibility and clear feedback are fundamental to user respect and
inclusivity.

### IV. Performance Requirements

System performance is quantified, measured, and enforced:

- **Response Time**: API/CLI operations MUST complete within defined SLAs (e.g., p95 < 
  200ms for interactive operations, p99 < 1s for batch operations)
- **Resource Constraints**: Memory usage limits per operation defined and monitored;
  excessive resource consumption requires architectural review
- **Scalability Targets**: System must handle defined load targets (e.g., concurrent
  users, requests per second, data volume) without degradation
- **Performance Testing**: Load tests required for features handling user concurrency or
  large datasets; performance regressions block deployment
- **Monitoring**: Production metrics captured for response times, error rates, and
  resource utilization; alerts configured for threshold breaches

**Rationale**: Performance issues erode user experience and trust. Defining and enforcing
performance standards prevents degradation and ensures consistent delivery at scale.

### V. Language & Documentation Standards (NON-NEGOTIABLE)

All specifications, plans, and user-facing documentation MUST be written in Traditional 
Chinese (zh-TW):

- **Feature Specifications**: All documents in `specs/` directory (spec.md, plan.md, 
  data-model.md, quickstart.md, research.md) MUST be written in Traditional Chinese
- **Task Definitions**: All task lists (tasks.md) MUST be written in Traditional Chinese
- **User-Facing Documentation**: All documentation intended for end users (README files, 
  quickstart guides, user manuals, API documentation) MUST be written in Traditional Chinese
- **Code Comments**: Comments explaining business logic, user-facing behavior, or 
  architectural decisions MUST be written in Traditional Chinese; implementation-level 
  comments (e.g., algorithm explanations) MAY be in English if referencing technical literature
- **Agent Instructions**: All slash command prompts and agent guidance in `.github/prompts/` 
  MUST include Traditional Chinese language requirements
- **English Exceptions**: Technical specifications referencing English-only standards (RFCs, 
  academic papers) MAY include English terms with Traditional Chinese explanations; 
  code identifiers (variable names, function names) follow language conventions (typically English)
- **Consistency**: Mixed-language documents are prohibited except where explicitly justified 
  by technical necessity (e.g., code examples with Chinese comments)

**Rationale**: Language consistency ensures accessibility for the primary development team 
and user base. Traditional Chinese is the project's established working language per 
AGENTS.md. Standardizing documentation language reduces cognitive load, prevents 
miscommunication, and ensures all stakeholders can fully participate in requirements, 
planning, and quality review processes.

## Development Standards

### Quality Gates

All code changes MUST pass the following gates before merge:

1. **Constitution Compliance**: Reviewer verifies adherence to all five core principles
2. **Language Compliance**: All specifications, plans, and user-facing documentation in 
   Traditional Chinese (zh-TW) per Principle V
3. **Linting & Formatting**: Automated checks pass (no warnings)
4. **Test Suite**: All tests pass; new features include tests; coverage thresholds met
5. **Performance Validation**: Performance tests pass for affected components
6. **Documentation**: Changes include updated documentation if user-facing or API changes

### Code Review Process

- **Mandatory Review**: No self-merge; minimum one approving review required
- **Review Checklist**: Reviewers use `.specify/templates/checklist-template.md` to
  verify quality, testing, UX, and performance standards
- **Complexity Justification**: Complexity that violates simplicity principles requires
  written justification in plan documentation (see `plan-template.md` Complexity Tracking)

## Compliance & Monitoring

### Enforcement Mechanisms

- **Automated Checks**: CI/CD pipeline enforces linting, testing, and coverage gates
- **Performance Monitoring**: Production metrics tracked; regressions trigger alerts and
  require hotfix or rollback
- **Constitution Reviews**: Quarterly review of adherence; violations documented and
  addressed

### Violation Handling

- **Blocking Issues**: Constitution violations block merge; must be resolved before
  proceeding
- **Retrospectives**: Significant violations trigger team retrospective to identify root
  cause and prevent recurrence

## Governance

This constitution supersedes all other development practices. Changes to principles or
standards require:

1. **Amendment Proposal**: Documented rationale with impact analysis
2. **Team Consensus**: Review and approval by maintainers
3. **Migration Plan**: Existing code alignment plan (if applicable)
4. **Version Update**: Constitution version incremented per semantic versioning:
   - **MAJOR**: Backward incompatible changes (principle removal/redefinition)
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, wording improvements, non-semantic refinements

All development workflows (spec creation, task planning, implementation) MUST reference
and comply with this constitution. Runtime guidance for AI agents is maintained in
`AGENTS.md` and MUST align with these principles.

**Version**: 1.1.0 | **Ratified**: 2025-12-19 | **Last Amended**: 2025-12-19
