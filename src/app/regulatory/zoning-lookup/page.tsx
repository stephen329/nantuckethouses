import { redirect } from "next/navigation";

export default function LegacyZoningLookupRedirectPage() {
  redirect("/map?mode=rent");
}
