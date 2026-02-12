/**
 * Main theme JavaScript entry.
 * Add your scripts here or import components.
 */
import { initCartDrawer } from "./components/cartDrawer.js"

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCartDrawer)
} else {
  initCartDrawer()
}
