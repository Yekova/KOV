import { Roboto_Flex } from "next/font/google";

// Loaded specifically for the footer's TextPressure wordmark — the variable
// "wght"/"wdth" axes are what that effect manipulates at runtime, and
// KOV's own display font (Space Grotesk) doesn't expose those axes. Scoped
// to its one call site rather than added to the root layout's font list.
export const robotoFlex = Roboto_Flex({
  weight: "variable",
  axes: ["wdth"],
  subsets: ["latin"],
  display: "swap",
});
