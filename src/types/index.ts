export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  thumbnail?: string;
  rotation: number;
}

export interface Annotation {
  id: string;
  page: number;
  type: 'highlight' | 'underline' | 'draw' | 'shape' | 'note' | 'text' | 'whiteout' | 'image';
  data: Record<string, unknown>;
  fabricData?: object;
}

export interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  pageIndex: number;
}

export interface Bookmark {
  title: string;
  pageNumber: number;
  children?: Bookmark[];
}

export type Tool =
  | 'select'
  | 'highlight'
  | 'underline'
  | 'draw'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'note'
  | 'text'
  | 'editText'
  | 'signature'
  | 'image'
  | 'whiteout';

export type OnUpdateAnnotation = (
  page: number,
  id: string,
  updates: Partial<Pick<Annotation, 'data'>>
) => void;

export interface AppState {
  pdfDoc: import('pdfjs-dist').PDFDocumentProxy | null;
  pdfBytes: Uint8Array | null;
  fileName: string;
  filePath: string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  activeTool: Tool;
  annotations: Map<number, Annotation[]>;
  sidebarTab: 'thumbnails' | 'bookmarks' | 'pages';
  sidebarOpen: boolean;
  bookmarks: Bookmark[];
  isModified: boolean;
  pageMetadatas: PDFPage[];
}

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<{ data: string; fileName: string; filePath: string } | null>;
      openMultipleFiles: () => Promise<Array<{ data: string; fileName: string; filePath: string }> | null>;
      saveFile: (defaultName?: string) => Promise<string | null>;
      writeFile: (filePath: string, base64Data: string) => Promise<boolean>;
      readFile: (filePath: string) => Promise<string>;
      saveImage: (defaultName?: string) => Promise<string | null>;
      getPath: (name: string) => Promise<string>;
      onFileOpened: (callback: (data: { data: string; fileName: string; filePath: string }) => void) => void;
      onMenuSave: (callback: () => void) => void;
      onMenuSaveAs: (callback: () => void) => void;
      onMenuPrint: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
    };
  }
}
