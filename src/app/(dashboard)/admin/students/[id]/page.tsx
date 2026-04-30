export default function AdminStudentDetailPage({ params }: { params: { id: string } }) {
  return <h1>Admin - Student Detail: {params.id}</h1>;
}
