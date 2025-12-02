import React, { useRef, useState } from 'react';
import { 
  Download, 
  Upload, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Code, 
  Trash2,
  FileCode
} from 'lucide-react';
import { useEditorStore } from '../store';
import { cleanHTMLForExport } from '../utils/dom';

export const TopBar: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    setHtmlContent, 
    setHeadContent,
    headContent,
    setBodyClassName,
    setBodyStyle,
    selectedElement, 
    deleteSelectedElement 
  } = useEditorStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const processImport = (content: string) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Extract head content
        // We remove any existing tailwind CDN links from the import to avoid duplicates,
        // as we inject our own in the EditorCanvas.
        const scripts = doc.head.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src && script.src.includes('tailwindcss.com')) {
                script.remove();
            }
        });
        setHeadContent(doc.head.innerHTML);

        // Extract body attributes (classes)
        if (doc.body.className) {
            setBodyClassName(doc.body.className);
        } else {
            setBodyClassName('');
        }

        // Extract body inline styles
        const style = doc.body.getAttribute('style');
        if (style) {
            setBodyStyle(style);
        } else {
            setBodyStyle('');
        }
        
        // Extract inner HTML
        if (doc.body.innerHTML) {
            setHtmlContent(doc.body.innerHTML);
        }
    } catch (e) {
        console.error("Failed to parse HTML", e);
        // Fallback to simple set if parsing fails
        setHtmlContent(content);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processImport(content);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setShowImportModal(false);
  };

  const handlePasteImport = () => {
    if (importText.trim()) {
      processImport(importText);
      setShowImportModal(false);
      setImportText('');
    }
  };

  const handleExport = () => {
    const iframe = document.getElementById('visual-editor-iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentDocument) {
        alert("Editor not ready");
        return;
    }

    const doc = iframe.contentDocument;
    
    // Clean the body content
    const cleanBodyContent = cleanHTMLForExport(doc.body);
    
    // Get the current body classes from the live DOM
    const finalBodyClasses = doc.body.className;
    
    // Get the current body inline styles
    const finalBodyStyle = doc.body.getAttribute('style') || '';

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    ${headContent}
    <title>Exported Page</title>
</head>
<body class="${finalBodyClasses}" style="${finalBodyStyle}">
${cleanBodyContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20 relative shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Code className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-800 hidden md:block">Tailwind Builder</span>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('tablet')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'tablet' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {selectedElement && selectedElement.tagName !== 'BODY' && (
             <button
             onClick={deleteSelectedElement}
             className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium mr-2"
           >
             <Trash2 className="w-4 h-4" />
             <span className="hidden sm:inline">Delete</span>
           </button>
          )}

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-md transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Import HTML</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paste HTML Code</label>
                <textarea 
                  className="w-full h-48 border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="<!DOCTYPE html><html><body class='bg-gray-100'>...</body></html>"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or upload file</span>
                </div>
              </div>

              <div className="flex justify-center">
                 <input 
                    type="file" 
                    accept=".html,.htm" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="file-upload"
                    ref={fileInputRef}
                  />
                 <label 
                    htmlFor="file-upload"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
                 >
                    <FileCode className="w-4 h-4" />
                    Choose HTML File
                 </label>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasteImport}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-sm shadow-sm"
              >
                Import Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};