"use client";

import { useSampleGet } from "./_api/use-sample";
import React from "react";

export default function AdminDash() {
  const { data, isLoading, error } = useSampleGet();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <h1>Admin Dashboard</h1>
      {data && <p>{data.message}</p>}
    </>
  );
}
