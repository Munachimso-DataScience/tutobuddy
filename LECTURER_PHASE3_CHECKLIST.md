# Lecturer Phase 3 Checklist

This checklist tracks what is already in place for the lecturer dashboard, what is still missing, and what should wait until later phases.

## Already Done

- Separate lecturer route exists at `/dashboard/lecturer`.
- Lecturer-only route guard is in place.
- Backend lecturer summary endpoint exists at `/api/lecturer/summary`.
- Lecturer dashboard shows:
  - overview stats
  - course aggregation
  - class aggregation
  - weakness aggregation
  - student progress summary
  - lowest-readiness students
  - revision reminder form
- Study summaries are now stored in `study_snapshots` instead of overfilling `users_profiles`.

## Missing for Lecturer Phase 3

- Topic-level breakdown by concept, chapter, or tag.
- Date range filtering such as:
  - 7 days
  - 30 days
  - term
- Course selector for narrowing analytics to one course.
- Class selector for narrowing analytics to one cohort.
- Student drill-down view with detailed history.
- Trend charts for:
  - score over time
  - readiness over time
  - study time over time
- Reminder history / sent log.
- More reliable topic tagging from quiz mistakes.
- Stronger use of `class_group` and `assigned_courses` in the data flow.

## Present But Slightly Premature

- The revision reminder form is useful, but it would be stronger with:
  - recipient preview
  - reminder history
  - clearer class/course targeting
- The lowest-readiness panel is helpful, but it depends on clean `class_group` and course data.
- The student progress cards are useful, but they will be much better once drill-down and trends exist.
- The recommendations tab is fine, but it is still based on coarse aggregates.

## Recommended Next Step

Pick one of these before adding more features:

1. Add filters and trend charts.
2. Add student drill-down and reminder history.
3. Clean and normalize lecturer data fields so analytics become more accurate.
4. Review the course model plan in [COURSE_MODEL_PLAN.md](/C:/Users/user/Downloads/tutobuddy/COURSE_MODEL_PLAN.md) before changing lecturer course behavior.

## Data Fields To Keep Filling

- `role`
- `department`
- `class_group`
- `assigned_courses`
- `course_id`
- `topic`
- `study_snapshots.summary_text`
- `study_snapshots.weekly_weaknesses`

## Phase 4 Candidate

- Question template management.
- Template history and fallback handling.
- Admin editing UI for templates.
- Lecturer course offerings and enrollment mapping, following [COURSE_MODEL_PLAN.md](/C:/Users/user/Downloads/tutobuddy/COURSE_MODEL_PLAN.md).

## Current Course Layer Progress

- `courses` stays student-owned and unchanged.
- `course_offerings` now exists for lecturer-side offerings.
- `course_enrollments` now exists for student mappings to offerings.
- Lecturer APIs can create offerings and auto-enroll students by `class_group`.
