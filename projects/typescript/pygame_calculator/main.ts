import { mountCalculator } from "./ui";

const root = typeof document === "undefined" ? null : document.querySelector<HTMLElement>("[data-calculator]");
if (root) mountCalculator(root);
