# Course Model Plan

This document defines how TutorBuddy should handle courses going forward.

## Core Decision

- Keep the current course flow for students unchanged.
- Add a separate lecturer/admin course-offering layer on top of it.
- Do not break the existing student dashboard, quizzes, summaries, or course pages.

## Why We Are Doing It This Way

The current app already uses courses as a student-friendly surface:

- students create or see their own course records
- quizzes attach to those course records
- AI summaries, read-aloud, and revision helpers use the same flow

That makes the student experience simple and fast.

Lecturer workflows are different:

- a lecturer teaches a cohort, not just their own personal course list
- one lecturer course may belong to many students
- university structures usually require class groups, cohorts, and assigned offerings

So the best approach is to keep student courses intact and introduce lecturer course offerings separately.

## Current State

### Student Course Flow

- `courses` is currently student-owned.
- `student_id` points to the student who owns the record.
- `/api/courses` returns only the current student’s records.
- The student dashboard reads from the same model.

### Lecturer Course Flow

- Lecturer dashboard can already aggregate by course, class, and topic.
- But lecturer-created courses should not overwrite the student course model.
- Lecturer course management still needs a separate offering/enrollment layer.

## Future Model

### 1. Student Course Records

Keep these as they are today:

- course title
- code
- progress
- readiness
- uploaded material
- quiz history

These remain student-facing and power the existing dashboard.

### 2. Lecturer Course Offerings

Add a separate layer for lecturers:

- course title
- code
- department
- class group / cohort
- lecturer id
- semester / term
- status

This layer represents what is being taught, not what a single student owns.

### 3. Enrollment / Mapping

Track which students belong to which offering:

- student id
- offering id
- class group
- enrollment status

This allows the same lecturer course to appear for many students without replacing the student-owned course records.

## Recommended Architecture

### Option A: Best Long-Term Model

Use separate collections:

- `courses` for student records
- `course_offerings` for lecturer/admin offerings
- `course_enrollments` for student mapping

Pros:

- clean university-style design
- easy to report on cohorts
- less data duplication
- easier to scale later

Cons:

- more work to implement
- requires a migration path

### Option B: Fast Compatibility Model

Keep the current `courses` collection and add lecturer-created copies to enrolled students.

Pros:

- faster to implement
- minimal UI changes
- student dashboard keeps working

Cons:

- duplicates data
- harder to maintain long term
- can get messy as the app grows

## Decision for TutorBuddy

- Keep the current student course flow unchanged.
- Build lecturer course offerings as a separate layer.
- Do not merge lecturer offerings into the student-owned `courses` collection.

This protects:

- quiz generation
- summaries
- read aloud
- revision workflows
- existing student dashboards

## Implementation Order

### Phase 1

- Keep student course routes untouched.
- Document the distinction between student courses and lecturer offerings.

### Phase 2

- Add lecturer course offering collection.
- Add enrollment mapping.
- Add lecturer APIs for listing and creating offerings.
- Keep student `/api/courses` and dashboard course flow unchanged.

### Current Progress

- `course_offerings` has been added to Appwrite.
- `course_enrollments` has been added to Appwrite.
- Lecturer APIs can now create offerings and auto-enroll students by `class_group`.
- The student `/api/courses` flow remains unchanged.

### Phase 3

- Show lecturer offerings in the lecturer dashboard.
- Show student enrollments in the student dashboard where appropriate.

### Phase 4

- Add optional admin tools for bulk enrollment and cohort setup.

## Rules To Preserve

- Student course pages stay student-first.
- Lecturer dashboards should not overwrite student records.
- AI summarization and quiz generation stay tied to student course activity.
- Any new lecturer model must be additive, not destructive.

## Reference Notes

- Existing student course routes:
  - `/dashboard/courses`
  - `/api/courses`
- Existing lecturer dashboard route:
  - `/dashboard/lecturer`
- Existing student analytics surface:
  - dashboard summary, quizzes, activity logs, AI helpers

## Summary

TutorBuddy should keep the current student course system as the default experience.
Lecturer course management should be added as a separate university-style layer so we can support real cohort teaching without breaking the student flow.
Goal Description
This implementation plan addresses the four key requirements you requested:

Admin Dashboard: Checking and planning for user statistics, question template updates, and content database management.
Lecturer Dashboard: Verifying the presence of aggregated performance by topic and class to enable targeted revision.
UI Color Scheme: Reverting the global color scheme to match the login page logo (Blue/White theme).
Student Photo Icon: Adding a user profile photo avatar to the dashboard header.
User Review Required
IMPORTANT

Admin Dashboard Enhancements: The current Admin Dashboard (/dashboard/admin/page.tsx) already successfully monitors user statistics, system health, and displays summary counts for templates and content. However, it does not currently have full management interfaces (CRUD operations) to Update question templates or Manage the content database. We will need to build these interactive management tables.

NOTE

Lecturer Dashboard Verification: The Lecturer Dashboard (/dashboard/lecturer/page.tsx) already has exactly what you described! It includes tabs for "Classes" (aggregated class performance), "Weaknesses" (aggregated topic/concept performance), and a form to "Send Revision Reminder" to specific classes based on those weaknesses. No major additions are needed here, but we will ensure the new styling applies to it beautifully.

Open Questions
WARNING

Avatar Image: Do you currently have profile images stored in the Appwrite database under the user profile, or should we use an auto-generated initial avatar (e.g., UI Avatars) for users who haven't uploaded a photo yet?
Admin Management: For the "Manage content database", are we just building a table to view/delete flagged courses and materials, or do you need a full editor interface for administrators?
Proposed Changes
Global Styling (UI/Color Scheme)
We will update the global CSS to remove the dark green/orange gradients and replace them with a clean, modern blue-and-white theme that matches the standard Tailwind blue-600 used on your Login Page.

[MODIFY] 
globals.css
Replace --primary, --secondary, and --background variables with a crisp blue color palette.
Change the body background gradient to a clean, light blue/white gradient (or solid color) to achieve the professional university portal look.
Dashboard Layout (Student Photo Icon)
[MODIFY] 
layout.tsx
Locate the header section containing the <UserCircle /> icon.
Replace it with an <img /> tag that fetches the user's avatar based on their name (e.g., https://ui-avatars.com/api/?name=${user?.name}) or their uploaded photo URL from the backend profile.
Admin Dashboard Enhancements
[MODIFY] 
page.tsx
Add functional interactive tables/sections inside the "Templates" and "Content" tabs.
Connect these tables to backend APIs (to be built or updated) to allow deleting/editing question templates and managing flagged content.
Verification Plan
Manual Verification
Log in and verify that the dashboard header now displays a circular avatar instead of the generic icon.
Verify that the entire site's color scheme (buttons, sidebar highlights, backgrounds) matches the blue styling of the login page.
Navigate to the Admin Dashboard and verify that the new Content and Template management sections are present.
Navigate to the Lecturer Dashboard to confirm that class/topic aggregation tabs and reminder forms are working seamlessly with the new design.