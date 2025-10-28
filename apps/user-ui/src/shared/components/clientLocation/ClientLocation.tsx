"use client";
import useLocationTracking from "@/hooks/useLocationTracking";

export default function ClientLocation() {
  const location = useLocationTracking();

  if (!location) return <span>Loading location...</span>;

  return (
    <span>
      {location.city}, {location.country}
    </span>
  );
}
