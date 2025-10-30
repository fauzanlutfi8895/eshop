"use client";

import dynamic from "next/dynamic";

// Dynamic import to prevent SSR issues with client-only hooks
const ProfileContent = dynamic(
  () => import("./profile-content").then((mod) => mod.ProfileContent),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-50 p-6 pb-16">
        <div className="md:max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800">Loading...</h1>
          </div>
        </div>
      </div>
    ),
  }
);

export function ProfileContentWrapper() {
  return <ProfileContent />;
}
