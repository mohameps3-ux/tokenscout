import type { Metadata } from "next";
import { ReferralPageClient } from "@/components/referral/ReferralPageClient";

export const metadata: Metadata = {
  title: "Referral Program | TokenScout",
  description: "Invite friends to TokenScout and earn Pro access rewards.",
};

export default function ReferralPage() {
  return <ReferralPageClient />;
}
