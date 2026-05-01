"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type SaveParcelButtonProps = {
  parcelKey: string;
};

const STORAGE_KEY = "nh_favorite_parcels";

export function SaveParcelButton({ parcelKey }: SaveParcelButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const favorites = raw ? (JSON.parse(raw) as string[]) : [];
      setSaved(favorites.includes(parcelKey));
    } catch {
      setSaved(false);
    }
  }, [parcelKey]);

  const buttonText = useMemo(
    () => (saved ? "Saved to Favorites" : "Save to Favorites"),
    [saved],
  );

  const toggleSaved = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const favorites = raw ? (JSON.parse(raw) as string[]) : [];
      const next = saved
        ? favorites.filter((item) => item !== parcelKey)
        : [...favorites, parcelKey];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(!saved);
    } catch {
      // no-op fallback for blocked storage
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={toggleSaved}>
      {buttonText}
    </Button>
  );
}
