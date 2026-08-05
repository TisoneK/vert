"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const max = Number.isFinite(props.max) && (props.max ?? 100) > 0 ? props.max ?? 100 : 100
  const boundedValue = Math.min(max, Math.max(0, Number.isFinite(value) ? value ?? 0 : 0))
  const progressPercent = (boundedValue / max) * 100

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
      value={boundedValue}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - progressPercent}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
