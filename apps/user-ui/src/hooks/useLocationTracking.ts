"use client";

import { useEffect, useState } from "react";

const LOCATION_STORAGE_KEY = "user_location";
const LOCATION_EXPIRE_DAYS = 20;

const getStoredLocation = () => {
  const storedData =
    typeof window !== "undefined"
      ? localStorage.getItem(LOCATION_STORAGE_KEY)
      : null;
  if (!storedData) return null;

  const parsedData = JSON.parse(storedData);

  const expiryTime = LOCATION_EXPIRE_DAYS * 24 * 60 * 60 * 1000; //20 days in ms

  const isExpired = Date.now() - parsedData.timestamp > expiryTime;

  return isExpired ? null : parsedData;
};
const useLocationTracking = () => {
  const [location, setLocation] = useState<{
    country: string;
    city: string;
  } | null>(getStoredLocation());

  useEffect(() => {
    if (location) return;
  
    fetch("https://free.freeipapi.com/api/json")
      .then((res) => res.json())
      .then((data) => {
        const newLocation = {
          country: data?.countryName,
          city: data?.cityName,
          timestamp: Date.now(),
        };

        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
        setLocation(newLocation);
      })
      .catch((error) => console.log("Failed get location", error));
  }, []);

  return location;
};

export default useLocationTracking;
