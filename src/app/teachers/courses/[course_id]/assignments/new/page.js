import { redirect } from 'next/navigation';

export default function NewAssignmentRedirect({ params }) {
  redirect(`/teachers/courses/${params.course_id}/assignments/create`);
}