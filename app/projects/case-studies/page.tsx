import { redirect } from "next/navigation"

export default function CaseStudiesRedirect() {
  // Redirect old case studies path to projects
  redirect("/projects")
}
