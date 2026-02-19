import { Metadata } from "next";
import { CompareContent } from "./compare-content";

export const metadata: Metadata = {
  title: "Compare – Reports – TakeZ",
  description: "Compare períodos ou contas.",
};

export default function ComparePage() {
  return <CompareContent />;
}
