import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import { isTextElement } from '../utils/dom';

export const EditorCanvas: React.FC = () => {
  const { 
    htmlContent, 
    headContent,
    viewMode, 
    bodyClassName,
    bodyStyle,
    setSelectedElement, 
    setIsEditingText, 
    selectedElement,
    setBodyClassName
  } = useEditorStore();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  // Track mount version to re-bind events after doc.write
  const [mountKey, setMountKey] = useState(0);

  // Initialize Iframe Content
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    const editorStyles = `
      <style>
        /* Visual indicators injected into the iframe */
        .visual-editor-selected {
          outline: 2px solid #3b82f6 !important;
          outline-offset: -2px;
          position: relative;
          z-index: 10;
        }
        .visual-editor-hovered {
          outline: 1px dashed #60a5fa !important;
          outline-offset: -1px;
        }
        [contenteditable="true"] {
          outline: 2px solid #22c55e !important;
          cursor: text !important;
        }
        body {
          min-height: 100vh;
          transition: background-color 0.2s;
        }
      </style>
    `;

    // Inject headContent, bodyClassName and bodyStyle directly into initialization
    // We add headContent BEFORE our scripts to ensure user styles load but our overrides (if any) can work,
    // though usually user styles should take precedence.
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          ${headContent}
          <script>
            // Tailwind config to match editor theme if needed
            tailwind.config = {
              theme: {
                extend: {}
              }
            }
          </script>
          ${editorStyles}
        </head>
        <body class="${bodyClassName}" style="${bodyStyle}">
          ${htmlContent}
        </body>
      </html>
    `;

    doc.open();
    doc.write(content);
    doc.close();

    setIframeLoaded(true);
    // Increment mount key to force event re-binding
    setMountKey(prev => prev + 1);

    // Give Tailwind a moment to parse classes, then we are ready
  }, [htmlContent, headContent]); // Add headContent dependency

  // Sync Body Class Name changes from store to Iframe DOM
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeLoaded) return;
    const doc = iframe.contentDocument;
    if (doc && doc.body && doc.body.className !== bodyClassName) {
       doc.body.className = bodyClassName;
    }
  }, [bodyClassName, iframeLoaded, mountKey]);

  // Sync Body Style changes from store to Iframe DOM
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeLoaded) return;
    const doc = iframe.contentDocument;
    if (doc && doc.body) {
       doc.body.setAttribute('style', bodyStyle);
    }
  }, [bodyStyle, iframeLoaded, mountKey]);

  // Sync Selection Visuals (Blue Box)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeLoaded) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Clear previous
    const prevSelected = doc.querySelector('.visual-editor-selected');
    if (prevSelected) {
      prevSelected.classList.remove('visual-editor-selected');
    }

    // Apply new
    if (selectedElement && selectedElement.isConnected) {
        if (selectedElement.tagName !== 'BODY') {
            selectedElement.classList.add('visual-editor-selected');
        }
    }
  }, [selectedElement, iframeLoaded, mountKey]);

  // Event Binding inside Iframe
  // Dependent on mountKey so it runs again after doc.write
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeLoaded) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const handleInteraction = (e: Event) => {
        // Specific logic for different event types
        if (e.type === 'click') {
             const mouseEvent = e as MouseEvent;
             mouseEvent.preventDefault();
             mouseEvent.stopPropagation();

             const target = mouseEvent.target as HTMLElement;
             
             // Handle Body Selection
             if (target === doc.body || target === doc.documentElement) {
                 setSelectedElement(doc.body);
                 setIsEditingText(false);
                 // Sync local store state with actual DOM class
                 setBodyClassName(doc.body.className);
                 
                 // Clear any text editing
                 const editingEl = doc.querySelector('[contenteditable="true"]');
                 if (editingEl) editingEl.setAttribute('contenteditable', 'false');
                 return;
             }

             // Handle Link prevention
             if (target.tagName === 'A' || target.closest('a')) {
                 mouseEvent.preventDefault();
             }

             // Stop editing if clicking elsewhere
             const editingEl = doc.querySelector('[contenteditable="true"]');
             if (editingEl && editingEl !== target) {
                editingEl.setAttribute('contenteditable', 'false');
                setIsEditingText(false);
             }

             setSelectedElement(target);
        }

        if (e.type === 'mouseover') {
             const mouseEvent = e as MouseEvent;
             const target = mouseEvent.target as HTMLElement;
             if (target !== doc.body && target !== doc.documentElement && !target.classList.contains('visual-editor-selected')) {
                 target.classList.add('visual-editor-hovered');
             }
        }

        if (e.type === 'mouseout') {
             const mouseEvent = e as MouseEvent;
             const target = mouseEvent.target as HTMLElement;
             target.classList.remove('visual-editor-hovered');
        }

        if (e.type === 'dblclick') {
             const mouseEvent = e as MouseEvent;
             mouseEvent.preventDefault();
             const target = mouseEvent.target as HTMLElement;
             
             if (target !== doc.body && isTextElement(target)) {
                 target.setAttribute('contenteditable', 'true');
                 target.focus();
                 setIsEditingText(true);
                 setSelectedElement(target);
             }
        }
    };

    // Attach listeners
    const events = ['click', 'mouseover', 'mouseout', 'dblclick'];
    events.forEach(evt => doc.addEventListener(evt, handleInteraction));

    // Keyboard shortcuts inside iframe
    const handleKeydown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            setSelectedElement(null);
            const editingEl = doc.querySelector('[contenteditable="true"]');
            if (editingEl) {
                editingEl.setAttribute('contenteditable', 'false');
                setIsEditingText(false);
            }
         }
    };
    doc.addEventListener('keydown', handleKeydown);

    return () => {
        events.forEach(evt => doc.removeEventListener(evt, handleInteraction));
        doc.removeEventListener('keydown', handleKeydown);
    };
  }, [iframeLoaded, mountKey, setSelectedElement, setIsEditingText, setBodyClassName]);


  // Dimensions calculation
  let widthClass = 'w-full h-full';
  let containerStyle = {};
  
  if (viewMode === 'tablet') {
      containerStyle = { width: '768px', height: '100%' };
  } else if (viewMode === 'mobile') {
      containerStyle = { width: '375px', height: '100%' };
  } else {
      containerStyle = { width: '100%', height: '100%' };
  }

  return (
    <div 
        className="flex-1 bg-gray-200 overflow-auto flex justify-center p-8 editor-ui relative" 
        onClick={() => setSelectedElement(null)}
    >
      <div 
        className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden relative ${viewMode !== 'desktop' ? 'border-[10px] border-gray-800 rounded-[2rem]' : ''}`}
        style={containerStyle}
      >
        <iframe 
            ref={iframeRef}
            id="visual-editor-iframe"
            className="w-full h-full bg-white block"
            frameBorder="0"
            title="Editor Canvas"
        />
      </div>
    </div>
  );
};