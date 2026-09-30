"use client";

import { Inbox } from "@novu/nextjs";
import { inboxDarkTheme } from "@novu/nextjs/themes";

export default function NotificationInbox({
  subscriberId,
}: {
  subscriberId: string;
}) {
  return (
    <Inbox
      applicationIdentifier={
        process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER
      }
      subscriber={subscriberId}
      appearance={{
        baseTheme: inboxDarkTheme,
        variables: {
          colorPrimary: "hsl(155 100% 50%)",
          colorPrimaryForeground: "hsl(0 0% 3%)",
          colorSecondary: "hsl(0 0% 12%)",
          colorSecondaryForeground: "hsl(0 0% 94%)",
          colorCounter: "hsl(155 100% 50%)",
          colorCounterForeground: "hsl(0 0% 3%)",
          colorBackground: "hsl(0 0% 7%)",
          colorForeground: "hsl(0 0% 94%)",
          colorNeutral: "hsl(0 0% 16%)",
          colorShadow: "hsl(0 0% 3%)",
          colorRing: "hsl(155 100% 50%)",
          colorStripes: "hsl(0 0% 10%)",
          fontSize: "0.875rem",
          borderRadius: "0.125rem",
        },
        elements: {
          bellIcon: {
            color: "hsl(0 0% 53%)",
          },
        },
      }}
    />
  );
}
