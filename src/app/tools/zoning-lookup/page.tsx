import { redirect } from "next/navigation";

export default function ZoningLookupRedirectPage() {
  redirect("/map?mode=rent");
}
