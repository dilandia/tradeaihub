import { Metadata } from "next";
import { ProfilePageContent } from "./profile-page-content";

export const metadata: Metadata = {
  title: "Perfil – TakeZ",
};

export default function ProfilePage() {
  return <ProfilePageContent />;
}
