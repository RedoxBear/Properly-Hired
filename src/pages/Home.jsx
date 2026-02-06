import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate(createPageUrl("Dashboard"), { replace: true });
  }, [navigate]);

  return null;
}