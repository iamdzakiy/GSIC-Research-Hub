import AssessmentRunner from "@/components/assess/AssessmentRunner";

export const metadata = { title: "Test", robots: { index: false } };

export default function TestPage({ params }: { params: { slug: string; testId: string } }) {
  return <main><AssessmentRunner idOrCode={params.testId} /></main>;
}
