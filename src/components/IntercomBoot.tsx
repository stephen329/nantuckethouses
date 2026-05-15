"use client";

import { useEffect } from "react";
import Intercom from "@intercom/messenger-js-sdk";

export function IntercomBoot() {
  useEffect(() => {
    Intercom({
      app_id: "dmsxc7rs",
    });
  }, []);

  return null;
}
