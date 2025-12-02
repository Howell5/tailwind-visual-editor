/**
 * Cleans the editor-specific classes before export
 */
export const cleanHTMLForExport = (rootElement: HTMLElement): string => {
  // Clone the node to avoid modifying the live editor
  const clone = rootElement.cloneNode(true) as HTMLElement;

  // Remove editor-specific classes and attributes
  const elements = clone.querySelectorAll('*');
  elements.forEach((el) => {
    el.classList.remove('visual-editor-selected');
    el.classList.remove('visual-editor-hovered');
    el.removeAttribute('contenteditable');
    
    // Cleanup empty class attributes
    if (el.getAttribute('class') === '') {
      el.removeAttribute('class');
    }
  });

  return clone.innerHTML;
};

/**
 * Categorize common Tailwind classes for better UI (Basic grouping)
 */
export const categorizeClasses = (classList: DOMTokenList) => {
  const classes = Array.from(classList).filter(c => 
    !['visual-editor-selected', 'visual-editor-hovered'].includes(c)
  );
  
  return classes;
};

/**
 * Checks if an element is a text-editable element
 */
export const isTextElement = (el: HTMLElement): boolean => {
  const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'BUTTON', 'LABEL', 'TD', 'TH', 'DIV'];
  // Divs are conditionally text elements if they only contain text nodes, 
  // but for simplicity we allow editing any of these.
  return textTags.includes(el.tagName);
};
