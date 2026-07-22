import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// useSyncExternalStore is the idiomatic way to read a browser value that
// lives outside React (here, a media query). It avoids the
// setState-in-effect anti-pattern the old useState+useEffect version used —
// React subscribes to the store directly and re-renders on change.

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches
}

// Server render has no viewport; default to "not mobile" (matches the old
// hook, which started as `undefined` → `!!undefined` === false before the
// effect ran).
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
