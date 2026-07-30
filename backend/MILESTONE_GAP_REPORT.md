# Milestone Gap Report

## Summary
This report maps the current backend repository to the requested milestone plan and identifies missing pieces.

## Milestone 1: Week 1 & 2
### Present
- Auth system
  - `AuthController`, `AuthPublicController`, `AuthService`
  - JWT login/register
  - Password reset support with token storage and email service
- Profile / user management
  - `ProfileController`
  - `User`, `Employee`, `EmployeeSkill`, `Department`
- Competency framework
  - `CompetencyController`, `CompetencyService`, `Competency` entity
- Employee profile and skill inventory
  - `Employee` and `EmployeeSkill` entities
  - `SkillService` and related repository support likely exist
- Basic backend setup
  - Spring Boot project with JPA, security, mail dependency
  - PostgreSQL datasource and JWT config

### Missing or partial
- No frontend implementation in this repository
  - No React/Vite app source folder present
  - No UI pages for login, forgot-password, reset-password, gap dashboard
- No explicit architecture or workflow design artifacts
  - No design docs, wireframes, or schema diagrams in repo
- No documented milestone plan or feature roadmap beyond `be.md` / `HELP.md`

## Milestone 2: Week 3 & 4
### Present
- Gap analysis backend
  - `GapAnalysisController`, `GapAnalysisService`
  - `GapAnalysis` entity and service logic to compute gaps
- Recommendation / learning path backend logic
  - `AIService` with `analyzeGaps` and `generateLearningPath`
  - DTOs: `SkillGapDTO`, `LearningPathDTO`, `RecommendedResourceDTO`
- Competency-to-required-skill mapping
  - `RequiredSkill` entity and repository
- Recommendation controller/service structure exists
  - `RecommendationController`, `RecommendationService`, `RecommendationRepository`

### Missing or partial
- No frontend visualization
  - Heatmap or analytics visualization not implemented
  - No dashboards or charts in repo
- No external learning catalog integration
  - No connectors or service clients for outside catalogs
- No true AI/LLM model integration
  - `AIService` is local rule-based logic, not connected to external LLM APIs
- No real-time analysis / streaming support
  - No websocket, event, or realtime UI layer present

## Key gaps to fill next
1. Add frontend app folder and UI flows for:
   - login/register
   - forgot password / reset password
   - employee profile
   - skill inventory
   - gap analysis dashboard
   - recommendations and learning paths
2. Add design and architecture artifacts:
   - wireframes or UI mockups
   - data model/schema diagram
   - milestone/task plan document
3. Implement visualization components:
   - heatmap view
   - gap severity charts
   - recommendation panel
4. Integrate external catalogs and AI services:
   - external learning provider API integration
   - LLM recommendation enhancements
   - recommendation scoring and benchmarking logic

## File-level mapping to milestone tasks

### Auth and profile
- `src/main/java/com/orgkgi/controller/AuthController.java`
- `src/main/java/com/orgkgi/controller/AuthPublicController.java`
- `src/main/java/com/orgkgi/service/AuthService.java`
- `src/main/java/com/orgkgi/controller/ProfileController.java`
- `src/main/java/com/orgkgi/entity/User.java`
- `src/main/java/com/orgkgi/entity/Employee.java`
- `src/main/java/com/orgkgi/entity/EmployeeSkill.java`
- `src/main/java/com/orgkgi/repository/UserRepository.java`
- `src/main/java/com/orgkgi/repository/EmployeeRepository.java`
- `src/main/java/com/orgkgi/repository/EmployeeSkillRepository.java`

### Competency framework
- `src/main/java/com/orgkgi/controller/CompetencyController.java`
- `src/main/java/com/orgkgi/service/CompetencyService.java`
- `src/main/java/com/orgkgi/entity/Competency.java`
- `src/main/java/com/orgkgi/repository/CompetencyRepository.java`
- `src/main/java/com/orgkgi/entity/RequiredSkill.java`
- `src/main/java/com/orgkgi/repository/RequiredSkillRepository.java`

### Gap analysis
- `src/main/java/com/orgkgi/controller/GapAnalysisController.java`
- `src/main/java/com/orgkgi/service/GapAnalysisService.java`
- `src/main/java/com/orgkgi/entity/GapAnalysis.java`
- `src/main/java/com/orgkgi/repository/GapAnalysisRepository.java`

### Recommendation and learning paths
- `src/main/java/com/orgkgi/service/AIService.java`
- `src/main/java/com/orgkgi/recommendation/RecommendationController.java`
- `src/main/java/com/orgkgi/recommendation/RecommendationService.java`
- `src/main/java/com/orgkgi/recommendation/RecommendationResponse.java`
- `src/main/java/com/orgkgi/repository/RecommendationRepository.java`
- `src/main/java/com/orgkgi/dto/SkillGapDTO.java`
- `src/main/java/com/orgkgi/dto/LearningPathDTO.java`
- `src/main/java/com/orgkgi/dto/LearningPathStepDTO.java`
- `src/main/java/com/orgkgi/dto/RecommendedResourceDTO.java`

## Notes
- The repo currently has the strongest support for backend core services and domain model logic.
- The biggest missing parts are frontend/UI and explicit product design/workflow artifacts.
- If you want, I can also add a separate `MILESTONE_IMPLEMENTATION_MAP.md` that includes the exact missing frontend and design deliverables.
