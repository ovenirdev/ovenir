import { useCallback, useEffect, useRef, RefObject } from 'react';

interface UseAutoResizeOptions {
  minRows?: number;
  maxRows?: number;
}

/**
 * Hook for auto-resizing textareas
 * Can be used standalone or with an existing ref
 */
export function useAutoResize<T extends HTMLTextAreaElement>(
  options: UseAutoResizeOptions = {},
  existingRef?: RefObject<T>
) {
  const { minRows = 3, maxRows = 12 } = options;
  const internalRef = useRef<T>(null);
  const ref = existingRef || internalRef;

  const resize = useCallback(() => {
    const textarea = ref.current;
    if (!textarea) return;

    // Reset height to measure content
    textarea.style.height = 'auto';

    // Calculate line height
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 22;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

    const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

    // Set the height based on content, clamped between min and max
    const contentHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;

    // Show scrollbar if content exceeds max
    textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  }, [minRows, maxRows, ref]);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    // Initial resize
    resize();

    // Resize on input
    const handleInput = () => resize();
    textarea.addEventListener('input', handleInput);

    // Resize on window resize (for responsive changes)
    window.addEventListener('resize', resize);

    return () => {
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('resize', resize);
    };
  }, [resize, ref]);

  // Re-run resize when value changes programmatically
  useEffect(() => {
    resize();
  });

  return { ref, resize };
}

/**
 * Simple auto-resize function for use with existing refs
 */
export function autoResizeTextarea(
  textarea: HTMLTextAreaElement | null,
  minRows: number = 3,
  maxRows: number = 12
) {
  if (!textarea) return;

  textarea.style.height = 'auto';

  const computedStyle = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 22;
  const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

  const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
  const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

  const contentHeight = textarea.scrollHeight;
  const newHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);

  textarea.style.height = `${newHeight}px`;
  textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
}
