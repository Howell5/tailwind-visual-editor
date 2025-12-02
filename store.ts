import { create } from 'zustand';
import { EditorStore } from './types';

// Initial styles for the body (bg-gray-50 etc)
const INITIAL_BODY_CLASS = "bg-slate-50 min-h-full font-sans text-slate-900";

// Initial content
const INITIAL_HTML = `
<div class="max-w-4xl mx-auto p-8 text-center mt-10">
  <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Visual Editor</h1>
  <p class="text-lg text-gray-600 mb-8">
    Click any element to select it. Double-click text to edit. 
    Use the panel on the right to modify Tailwind classes.
  </p>
  <div class="flex justify-center gap-4">
    <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
      Get Started
    </button>
    <button class="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50">
      Learn More
    </button>
  </div>
  <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 class="font-semibold text-lg mb-2">Import</h3>
      <p class="text-gray-500">Paste your existing HTML code or upload a file to get started immediately.</p>
    </div>
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 class="font-semibold text-lg mb-2">Edit</h3>
      <p class="text-gray-500">Visual editing for text and styles without touching the raw code.</p>
    </div>
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 class="font-semibold text-lg mb-2">Export</h3>
      <p class="text-gray-500">Download clean, production-ready HTML with preserved Tailwind classes.</p>
    </div>
  </div>
</div>
`;

export const useEditorStore = create<EditorStore>((set, get) => ({
  htmlContent: INITIAL_HTML,
  setHtmlContent: (html) => set({ htmlContent: html }),

  headContent: '',
  setHeadContent: (content) => set({ headContent: content }),

  bodyClassName: INITIAL_BODY_CLASS,
  setBodyClassName: (className) => set({ bodyClassName: className }),

  bodyStyle: '',
  setBodyStyle: (style) => set({ bodyStyle: style }),

  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),

  viewMode: 'desktop',
  setViewMode: (mode) => set({ viewMode: mode }),

  isEditingText: false,
  setIsEditingText: (isEditing) => set({ isEditingText: isEditing }),

  updateSelectedElementStyle: (action, className) => {
    const { selectedElement } = get();
    
    if (!selectedElement) return;

    // Special handling for BODY element (the root of the iframe)
    if (selectedElement.tagName === 'BODY') {
        const currentClasses = selectedElement.className.split(' ').filter(c => c.trim() !== '');
        let newClasses: string[] = [];

        if (action === 'add') {
            const classesToAdd = className.split(' ').filter(c => c.trim() !== '');
            newClasses = [...new Set([...currentClasses, ...classesToAdd])];
        } else {
            newClasses = currentClasses.filter(c => c !== className);
        }
        
        const newClassNameString = newClasses.join(' ');
        
        // Update DOM directly
        selectedElement.className = newClassNameString;
        
        // Sync store for persistence/initialization logic
        set({ bodyClassName: newClassNameString });
        return;
    }

    // Standard Element Handling
    if (action === 'add') {
      const classesToAdd = className.split(' ').filter(c => c.trim() !== '');
      selectedElement.classList.add(...classesToAdd);
    } else {
      selectedElement.classList.remove(className);
    }
    
    // Trigger a re-render of the selected element state by creating a new reference? 
    // Actually, simple set works to trigger UI updates in subscribers
    set({ selectedElement: selectedElement });
  },

  deleteSelectedElement: () => {
    const { selectedElement } = get();
    if (!selectedElement) return;
    
    if (selectedElement.tagName === 'BODY') {
        alert("Cannot delete the page body.");
        return;
    }
    
    selectedElement.remove();
    set({ selectedElement: null, isEditingText: false });
  }
}));