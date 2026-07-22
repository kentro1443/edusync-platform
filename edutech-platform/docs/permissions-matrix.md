# EduTech Permission Matrix

## Purpose

This matrix defines the initial capability baseline for server-side authorization. It is not a substitute for resource ownership, school policy, privacy rules, or workflow state validation.

Phase 2 enforces platform and school administration only through shared
server-side guards. UI visibility is derived from the same typed registry and is
never treated as an authorization boundary. Later-domain capabilities remain a
design baseline until their services ship.

A check succeeds only when:

1. The actor has the capability through an active role in the current school.
2. The target record belongs to the current school.
3. The actor can access the target under resource visibility rules.
4. The requested state transition is valid.
5. Any school policy or approval condition is satisfied.

## Role Keys

| Key | Vietnamese label | Scope |
| --- | --- | --- |
| `PLATFORM_SUPER_ADMIN` | Quản trị nền tảng | Platform |
| `SCHOOL_ADMIN` | Quản trị trường | School |
| `TEACHER_STAFF` | Giáo viên / nhân viên | School |
| `MENTOR_COUNSELOR` | Cố vấn / tư vấn viên | School |
| `STUDENT` | Học sinh | School |
| `PARENT_GUARDIAN` | Phụ huynh / người giám hộ | School |
| `CLUB_LEADER` | Trưởng câu lạc bộ | School |
| `APPROVER_REVIEWER` | Người phê duyệt / thẩm định | School |

## Platform Capabilities

| Capability | Platform super-admin | School admin | Other school roles |
| --- | ---: | ---: | ---: |
| `platform:school:create` | Yes | No | No |
| `platform:school:read` | Yes | No | No |
| `platform:school:update` | Yes | No | No |
| `platform:school:suspend` | Yes | No | No |
| `platform:school:restore` | Yes | No | No |
| `platform:plan:manage` | Yes | No | No |
| `platform:feature-flag:manage` | Yes | No | No |
| `platform:health:read` | Yes | No | No |
| `platform:audit:read-cross-tenant` | Yes, metadata only | No | No |
| `platform:support-session:start` | Yes, explicit and audited | No | No |

Platform capabilities do not grant unrestricted school-content access. Support access must establish a separate, time-limited, audited context.

## School Administration

| Capability | School admin | Teacher/staff | Mentor | Approver | Club leader | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `school:settings:read` | Yes | No | No | No | No | No | No |
| `school:settings:update` | Yes | No | No | No | No | No | No |
| `school:academic-structure:manage` | Yes | No | No | No | No | No | No |
| `school:policy:manage` | Yes | No | No | No | No | No | No |
| `school:retention:manage` | Yes | No | No | No | No | No | No |
| `school:user:read` | Yes | No | No | No | No | No | No |
| `school:user:invite` | Yes | No | No | No | No | No | No |
| `school:user:import` | Yes | No | No | No | No | No | No |
| `school:user:update` | Yes | No | No | No | No | No | No |
| `school:user:suspend` | Yes | No | No | No | No | No | No |
| `school:role:assign` | Yes | No | No | No | No | No | No |
| `school:report:read` | Yes | No | No | No | No | No | No |
| `school:audit:read` | Yes | No | No | No | No | No | No |

### Phase 2 enforcement invariants

- Platform roles do not inherit school permissions.
- School roles do not inherit platform permissions.
- Every school service receives an authorization context containing `schoolId`;
  every target query includes that tenant key.
- Every school route requires an active membership in an active school.
- School A identifiers return a safe not-found/validation result when used from
  School B, rather than disclosing record existence.
- Parent access requires an active same-school `ParentStudentLink`; the link does
  not grant private counseling-note access.
- Only `SCHOOL_ADMIN` can list, invite, update, suspend, or assign school members
  in Phase 2.

## Mentoring

| Capability | School admin | Teacher/staff | Mentor | Approver | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `mentor:directory:read` | Yes | Yes | Yes | Yes | Yes | Policy-dependent |
| `mentor:profile:create` | No | No | Own profile | No | No | No |
| `mentor:profile:update` | Yes | Own profile | Own profile | No | No | No |
| `mentor:profile:verify` | Yes | Assigned moderation | No | Assigned queue | No | No |
| `mentor:availability:manage` | Yes | Own availability | Own availability | No | No | No |
| `mentor:appointment:create` | Yes | Policy-dependent | Yes | Policy-dependent | Yes | Policy-dependent |
| `mentor:appointment:read` | School scope | Assigned scope | Assigned appointments | Queue scope | Own appointments | Linked student, policy |
| `mentor:appointment:approve` | Yes | Assigned queue | Policy-dependent | Assigned queue | No | Consent only |
| `mentor:appointment:reschedule` | Policy-dependent | Assigned scope | Own appointments | Assigned queue | Own requests | Linked student, policy |
| `mentor:appointment:cancel` | Policy-dependent | Assigned scope | Own appointments | Assigned queue | Own requests | Linked student, policy |
| `mentor:session:conduct` | No | Policy-dependent | Assigned session | No | No | No |
| `mentor:session:notes:write` | Policy-dependent | Policy-dependent | Assigned session | No | No | No |
| `mentor:session:notes:read` | Explicit privacy policy | Explicit privacy policy | Own authored notes | Assigned decision context only | Never private notes | Never private notes |
| `mentor:feedback:create` | Yes | Yes | No | Yes | Yes | Policy-dependent |

## Resources

| Capability | School admin | Teacher/staff | Mentor | Approver | Club leader | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `resource:read` | School scope | School scope | School scope | Assigned scope | Public/club scope | Approved scope | Approved scope |
| `resource:create` | Yes | Yes | Policy-dependent | No | Policy-dependent | Policy-dependent | No |
| `resource:update` | Yes | Author/assigned | Author/assigned | No | Author/club scope | Own draft | No |
| `resource:submit-review` | Yes | Yes | Policy-dependent | No | Policy-dependent | Policy-dependent | No |
| `resource:review` | Yes | Assigned moderation | Assigned moderation | Assigned queue | No | No | No |
| `resource:approve` | Yes | Assigned moderation | Assigned moderation | Assigned queue | No | No | No |
| `resource:reject` | Yes | Assigned moderation | Assigned moderation | Assigned queue | No | No | No |
| `resource:version:create` | Yes | Authorized author | Authorized author | No | Authorized author | Own draft | No |
| `resource:version:rollback` | Yes | Authorized owner | Authorized owner | No | Authorized owner | No | No |
| `resource:download` | Authorized visibility | Authorized visibility | Authorized visibility | Authorized visibility | Authorized visibility | Authorized visibility | Authorized visibility |
| `resource:comment:create` | Yes | Yes | Yes | Yes | Yes | Approved resources | Policy-dependent |
| `resource:report:create` | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `resource:analytics:read` | School scope | Assigned scope | Own scope | Queue scope | Club scope | Own activity | Linked student scope |

## Scheduling

| Capability | School admin | Teacher/staff | Mentor | Approver | Club leader | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `calendar:school:manage` | Yes | No | No | No | No | No | No |
| `calendar:availability:manage` | Yes | Own | Own | No | Own club scope | No | No |
| `calendar:event:create` | Yes | Assigned scope | Assigned scope | Policy-dependent | Club scope | Policy-dependent | No |
| `calendar:event:read` | School scope | Assigned scope | Assigned scope | Queue scope | Club scope | Authorized scope | Linked scope |
| `calendar:event:update` | Yes | Owner/assigned | Owner/assigned | Assigned queue | Club owner | Own event/request | Own request |
| `calendar:event:cancel` | Yes | Owner/assigned | Owner/assigned | Assigned queue | Club owner | Own request | Own request |
| `calendar:waitlist:manage` | Yes | Assigned scope | Assigned scope | Assigned scope | Club scope | Own entries | Linked scope |
| `calendar:attendance:record` | Yes | Assigned scope | Session scope | Assigned scope | Club event scope | No | No |
| `calendar:export` | Own scope | Own scope | Own scope | Own scope | Club scope | Own scope | Own scope |

## Forms and Workflows

| Capability | School admin | Teacher/staff | Mentor | Approver | Club leader | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `workflow:template:create` | Yes | Policy-dependent | No | Policy-dependent | No | No | No |
| `workflow:template:read` | School scope | School scope | Assigned scope | Assigned scope | Assigned scope | Published scope | Published scope |
| `workflow:template:update-draft` | Yes | Owner/policy | No | Owner/policy | No | No | No |
| `workflow:template:publish` | Yes | Authorized | No | Authorized | No | No | No |
| `workflow:template:retire` | Yes | Authorized | No | Authorized | No | No | No |
| `workflow:template:read-history` | Yes | Authorized | Authorized | Assigned scope | Assigned scope | Own submission version | Linked submission |
| `workflow:submission:create` | Yes | Yes | Yes | Policy-dependent | Yes | Yes | Yes |
| `workflow:submission:read` | School policy | Assigned scope | Assigned scope | Assigned scope | Club scope | Own submissions | Own/linked submissions |
| `workflow:submission:update` | Policy-dependent | Owner/assigned | Owner/assigned | Assigned queue | Owner/club | Draft/returned own | Draft/returned own |
| `workflow:submission:withdraw` | Policy-dependent | Owner/assigned | Owner/assigned | Policy-dependent | Owner/club | Own submission | Own submission |
| `workflow:submission:approve` | Yes | Assigned queue | Assigned queue | Assigned queue | Assigned queue | No | Consent-only |
| `workflow:submission:reject` | Yes | Assigned queue | Assigned queue | Assigned queue | Assigned queue | No | Consent-only |
| `workflow:submission:request-changes` | Yes | Assigned queue | Assigned queue | Assigned queue | Assigned queue | No | No |
| `workflow:submission:delegate` | Yes | Policy-dependent | Policy-dependent | Policy-dependent | No | No | No |
| `workflow:submission:comment` | Yes | Assigned scope | Assigned scope | Assigned scope | Assigned scope | Own/authorized | Own/linked |
| `workflow:analytics:read` | School scope | Assigned scope | Assigned scope | Queue scope | Club scope | Own scope | Linked scope |

## Clubs and Events

| Capability | School admin | Teacher/staff | Club leader | Approver | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `club:create` | Yes | Yes | Policy-dependent | No | Policy-dependent | No |
| `club:read` | School scope | School scope | School scope | School scope | Visible clubs | Visible clubs |
| `club:update` | Yes | Assigned club | Owned club | No | No | No |
| `club:approve` | Yes | Assigned queue | No | Assigned queue | No | No |
| `club:membership:apply` | No | Policy-dependent | No | No | Yes | Policy-dependent |
| `club:membership:review` | Yes | Assigned club | Owned club | Assigned queue | No | No |
| `club:membership:manage` | Yes | Assigned club | Owned club | Assigned queue | No | No |
| `club:announcement:create` | Yes | Assigned club | Owned club | No | Policy-dependent | No |
| `club:event:create` | Yes | Assigned club | Owned club | No | Policy-dependent | No |
| `club:event:approve` | Yes | Assigned queue | No | Assigned queue | No | Consent-only |
| `club:event:register` | Yes | Yes | Yes | Yes | Yes | Policy-dependent |
| `club:event:attendance` | Yes | Assigned club | Owned club | Assigned queue | No | No |
| `club:budget:submit` | Yes | Assigned club | Owned club | Assigned queue | No | No |
| `club:budget:approve` | Yes | Assigned queue | No | Assigned queue | No | No |
| `club:report:submit` | Yes | Assigned club | Owned club | Assigned queue | No | No |

## Messaging, Comments, and Notifications

| Capability | School admin | Teacher/staff | Mentor | Approver | Club leader | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `message:conversation:create` | Authorized users | Authorized users | Authorized users | Authorized users | Authorized users | Authorized users | Authorized users |
| `message:conversation:read` | Authorized participants | Authorized participants | Authorized participants | Authorized participants | Authorized participants | Authorized participants | Authorized participants |
| `message:send` | Authorized participants | Authorized participants | Authorized participants | Authorized participants | Authorized participants | Authorized participants | Authorized participants |
| `message:attachment:create` | Policy-dependent | Policy-dependent | Policy-dependent | Policy-dependent | Policy-dependent | Policy-dependent | Policy-dependent |
| `message:delete-own` | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `comment:create` | Visible records | Visible records | Visible records | Visible records | Visible records | Visible records | Visible records |
| `comment:moderate` | Yes | Assigned scope | Assigned scope | Assigned queue | Club scope | No | No |
| `notification:read-own` | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `notification:preferences:update-own` | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `notification:send-broadcast` | Yes | Policy-dependent | No | Policy-dependent | Club scope | No | No |

## Audit and Export

| Capability | Platform super-admin | School admin | Teacher/staff | Mentor | Approver | Club leader | Student | Parent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `audit:read-platform-metadata` | Yes | No | No | No | No | No | No | No |
| `audit:read-school` | Support scope | Yes | Assigned scope | Assigned scope | Decision scope | Club scope | Own activity | Own/linked |
| `audit:export-school` | Support scope | Yes | Policy-dependent | No | Assigned scope | Club scope | Own data | Own/linked |
| `report:export` | Yes | Yes | Assigned scope | Own scope | Queue scope | Club scope | Own data | Own/linked |

## Resource and Privacy Rules

### Parent and guardian access

- A parent may access only active, explicitly linked students.
- A link may have a start/end date and school-defined relationship type.
- Parent visibility is field-level where necessary; a link does not imply unrestricted student access.
- Consent decisions are recorded as parent-authored workflow actions.
- Parents cannot read private counseling notes unless an explicit school policy and visibility classification permit it.

### Counseling notes

Notes have at least:

- `PRIVATE_COUNSELOR`
- `STUDENT_VISIBLE`
- `GUARDIAN_VISIBLE`
- `STAFF_VISIBLE`

A note reader must satisfy both the note classification policy and the actor’s relationship to the session/student.

### Files

A file grant must be checked against:

- School ownership.
- Parent/guardian relationship if applicable.
- Linked resource, appointment, workflow, club, or message visibility.
- File version status.
- Download/preview policy.
- Actor capability.

### Support access

Platform support sessions are:

- Explicitly started by the super-admin.
- Time-limited.
- Read-only by default.
- Escalated to write access only with a reason and confirmation.
- Fully audited.
- Revoked on expiry or manual termination.

## Implementation Notes

Permission identifiers should be centralized in a typed registry. Role definitions should map to permission identifiers, not hard-code role checks throughout UI or domain services.

```ts
export const permissions = {
  schoolUserRead: "school:user:read",
  resourceReview: "resource:review",
  workflowApprove: "workflow:submission:approve",
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];
```

A policy helper should expose intent-focused checks:

```ts
requirePermission(context, "resource:review");
assertCanReadResource(context, resource);
assertCanApproveSubmission(context, submission);
```

Tests must cover:

- Role union behavior for multi-role memberships.
- Inactive membership denial.
- Cross-tenant denial.
- Parent link expiry and field restrictions.
- Private note classification.
- Support-session expiry and audit requirement.
- State transitions that remain forbidden even when the actor has a broad capability.
