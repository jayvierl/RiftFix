"use client";

import NumberFlow from "@number-flow/react";

/**
 * Rolling-digit number (number-flow). Digits animate when the value
 * changes or rolls in on mount, so corpus stats feel alive instead of
 * static text. Client component; the value also renders server-side.
 */
export default function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <NumberFlow
      value={value}
      locales="en-US"
      format={{ useGrouping: true }}
      className={className}
    />
  );
}
