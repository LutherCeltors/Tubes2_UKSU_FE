import { useEffect } from "react";

export function useTraversalPlayback(
  isPlaying: boolean,
  currentStep: number,
  maxStep: number,
  onStepChange: (nextStep: number) => void,
  intervalMs = 700
) {
  useEffect(() => {
    if (!isPlaying) return;
    if (maxStep < 0) return;

    const timer = window.setInterval(() => {
      if (currentStep >= maxStep) {
        onStepChange(maxStep);
        return;
      }

      onStepChange(currentStep + 1);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, currentStep, maxStep, onStepChange, intervalMs]);
}