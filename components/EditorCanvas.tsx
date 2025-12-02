import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '../store';
import { isTextElement } from '../utils/dom';

export const EditorCanvas: React.FC = () => {
  const { 
    htmlContent, 
    viewMode, 
    setSelectedElement, 
    setIsEditingText, 
    selectedElement 
  } = useEditorStore();
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize content
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = htmlContent;
    }
    // We only want to set initial HTML once or when manually imported
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlContent]);

  // Handle visual selection updates
  useEffect(() => {
    // Clear previous selection styles
    const prevSelected = containerRef.current?.querySelector('.visual-editor-selected');
    if (prevSelected) {
      prevSelected.classList.remove('visual-editor-selected');
    }

    // Add style to new selection
    if (selectedElement) {
        selectedElement.classList.add('visual-editor-selected');
    }
  }, [selectedElement]);

  // Main Event Delegation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;

      // Don't select the container itself
      if (target === container) {
        setSelectedElement(null);
        setIsEditingText(false);
        return;
      }

      // If we were editing text and clicked elsewhere, stop editing
      const editingEl = container.querySelector('[contenteditable="true"]');
      if (editingEl && editingEl !== target) {
        editingEl.setAttribute('contenteditable', 'false');
        setIsEditingText(false);
      }

      setSelectedElement(target);
    };

    const handleMouseOver = (e: MouseEvent) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target !== container && !target.classList.contains('visual-editor-selected')) {
        target.classList.add('visual-editor-hovered');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      target.classList.remove('visual-editor-hovered');
    };

    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      
      if (target !== container && isTextElement(target)) {
        target.setAttribute('contenteditable', 'true');
        target.focus();
        setIsEditingText(true);
        setSelectedElement(target);
      }
    };

    // Prevent links from navigating
    const handleLinkClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' || target.closest('a')) {
            e.preventDefault();
        }
    }

    container.addEventListener('click', handleClick);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);
    container.addEventListener('dblclick', handleDoubleClick);
    container.addEventListener('click', handleLinkClick); // Catch links specifically

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
      container.removeEventListener('dblclick', handleDoubleClick);
      container.removeEventListener('click', handleLinkClick);
    };
  }, [setSelectedElement, setIsEditingText]);

  // Handle keyboard shortcuts (Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setSelectedElement(null);
            const editingEl = document.querySelector('[contenteditable="true"]');
            if (editingEl) {
                editingEl.setAttribute('contenteditable', 'false');
                setIsEditingText(false);
            }
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedElement, setIsEditingText]);


  // Determine container width based on view mode
  let widthClass = 'w-full';
  if (viewMode === 'tablet') widthClass = 'max-w-[768px]';
  if (viewMode === 'mobile') widthClass = 'max-w-[375px]';

  return (
    <div className="flex-1 bg-gray-100 overflow-auto flex justify-center p-8 editor-ui" onClick={() => setSelectedElement(null)}>
      <div 
        className={`bg-white shadow-lg transition-all duration-300 min-h-[800px] ${widthClass}`}
        style={{ transformOrigin: 'top center' }}
      >
        <div 
          id="visual-editor-canvas"
          ref={containerRef}
          className="w-full h-full min-h-[800px] outline-none"
        />
      </div>
    </div>
  );
};
