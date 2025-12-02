import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../store';
import { categorizeClasses } from '../utils/dom';
import { 
  Type, 
  Palette, 
  Box, 
  Layout, 
  Plus, 
  X,
  Trash2,
  Copy,
  Info
} from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const { selectedElement, updateSelectedElementStyle, deleteSelectedElement } = useEditorStore();
  const [activeClasses, setActiveClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState('');

  // Sync state with selected element
  useEffect(() => {
    if (selectedElement) {
      setActiveClasses(categorizeClasses(selectedElement.classList));
    } else {
      setActiveClasses([]);
    }
  }, [selectedElement, selectedElement?.className]); // Depend on className to refresh when classes change

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.trim()) return;
    
    updateSelectedElementStyle('add', newClass.trim());
    setNewClass('');
  };

  const handleRemoveClass = (cls: string) => {
    updateSelectedElementStyle('remove', cls);
  };

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 shrink-0 hidden lg:flex flex-col items-center justify-center text-center text-gray-500">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Layout className="w-8 h-8 text-gray-400" />
        </div>
        <p className="font-medium">No element selected</p>
        <p className="text-sm mt-2">Click on any element in the canvas to edit its properties.</p>
      </div>
    );
  }

  const tagName = selectedElement.tagName.toLowerCase();
  const hasText = selectedElement.childNodes.length > 0 && 
                 selectedElement.childNodes[0].nodeType === Node.TEXT_NODE &&
                 selectedElement.innerText.trim().length > 0;

  return (
    <div className="w-80 bg-white border-l border-gray-200 shrink-0 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                {tagName}
            </span>
            <span className="text-xs text-gray-400">
                #{selectedElement.id || 'no-id'}
            </span>
        </div>
        <button 
            onClick={deleteSelectedElement}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Delete Element"
        >
            <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 editor-ui">
        
        {/* Info Section */}
        {hasText && (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Type className="w-4 h-4" />
                    <span>Content</span>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic truncate">
                    "{selectedElement.innerText.substring(0, 100)}{selectedElement.innerText.length > 100 ? '...' : ''}"
                </div>
                <p className="text-xs text-gray-400 ml-1">Double-click element to edit text</p>
            </div>
        )}

        <hr className="border-gray-100" />

        {/* Classes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Palette className="w-4 h-4" />
                <span>Tailwind Classes</span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {activeClasses.length}
            </span>
          </div>

          <form onSubmit={handleAddClass} className="relative">
            <input 
                type="text" 
                placeholder="Add class (e.g. text-red-500)" 
                className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
            />
            <button 
                type="submit"
                className="absolute right-1.5 top-1.5 p-1 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
                disabled={!newClass.trim()}
            >
                <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {activeClasses.length > 0 ? (
                activeClasses.map((cls, idx) => (
                    <div 
                        key={`${cls}-${idx}`} 
                        className="group flex items-center gap-1.5 bg-gray-100 hover:bg-white border border-gray-200 hover:border-blue-300 text-gray-600 text-xs px-2.5 py-1.5 rounded-md transition-all cursor-default"
                    >
                        <span className="font-mono">{cls}</span>
                        <button 
                            onClick={() => handleRemoveClass(cls)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-sm text-gray-400 italic w-full text-center py-4 border-2 border-dashed border-gray-100 rounded-lg">
                    No classes applied
                </div>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Quick Helpers (MVP - minimal) */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Box className="w-4 h-4" />
                <span>Common Utilities</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => updateSelectedElementStyle('add', 'flex')}
                    className="text-xs py-1.5 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-200 transition"
                >
                    Flex
                </button>
                <button 
                    onClick={() => updateSelectedElementStyle('add', 'grid')}
                    className="text-xs py-1.5 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-200 transition"
                >
                    Grid
                </button>
                <button 
                    onClick={() => updateSelectedElementStyle('add', 'p-4')}
                    className="text-xs py-1.5 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-200 transition"
                >
                    Padding (sm)
                </button>
                <button 
                    onClick={() => updateSelectedElementStyle('add', 'p-8')}
                    className="text-xs py-1.5 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-200 transition"
                >
                    Padding (lg)
                </button>
                <button 
                    onClick={() => updateSelectedElementStyle('add', 'rounded-lg')}
                    className="text-xs py-1.5 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-200 transition"
                >
                    Rounded
                </button>
                <button 
                    onClick={() => updateSelectedElementStyle('add', 'shadow-md')}
                    className="text-xs py-1.5 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-200 transition"
                >
                    Shadow
                </button>
            </div>
        </div>
        
        <div className="mt-auto bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
                Changes are applied instantly. Use the <strong>Delete</strong> key to remove the selected element.
            </p>
        </div>

      </div>
    </div>
  );
};
