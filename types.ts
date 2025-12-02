export type ViewMode = 'desktop' | 'tablet' | 'mobile';

export interface EditorStore {
  // Canvas State
  htmlContent: string;
  setHtmlContent: (html: string) => void;
  
  // Body/Global Styles
  bodyClassName: string;
  setBodyClassName: (className: string) => void;
  bodyStyle: string;
  setBodyStyle: (style: string) => void;
  
  // Selection State
  selectedElement: HTMLElement | null;
  setSelectedElement: (element: HTMLElement | null) => void;
  
  // UI State
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isEditingText: boolean;
  setIsEditingText: (isEditing: boolean) => void;
  
  // Actions
  updateSelectedElementStyle: (action: 'add' | 'remove', className: string) => void;
  deleteSelectedElement: () => void;
}