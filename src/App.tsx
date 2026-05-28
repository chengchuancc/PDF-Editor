import { useState, useCallback, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Tool, Annotation, Bookmark, PDFPage, TextItem, OnUpdateAnnotation } from './types'
import {
  deletePages,
  rotatePages,
  encryptPDF,
  mergePDFs,
  splitPDF,
  insertBlankPage,
  insertPagesFromPDF,
} from './utils/pdfOperations'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import PDFViewer from './components/PDFViewer'
import StatusBar from './components/StatusBar'
import SignatureModal from './components/SignatureModal'
import NoteModal from './components/NoteModal'
import EncryptModal from './components/EncryptModal'
import MergeModal from './components/MergeModal'
import SplitModal from './components/SplitModal'
import AboutModal from './components/AboutModal'
import EditTextBlockModal from './components/EditTextBlockModal'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.mjs'

function App() {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [fileName, setFileName] = useState('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [annotations, setAnnotations] = useState<Map<number, Annotation[]>>(new Map())
  const [sidebarTab, setSidebarTab] = useState<'thumbnails' | 'bookmarks' | 'pages'>('thumbnails')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isModified, setIsModified] = useState(false)
  const [pageMetadatas, setPageMetadatas] = useState<PDFPage[]>([])
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showEncryptModal, setShowEncryptModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [editingTextItem, setEditingTextItem] = useState<TextItem | null>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [notePosition, setNotePosition] = useState<{ page: number; x: number; y: number } | null>(null)
  const [insertAfterPage, setInsertAfterPage] = useState<number>(0)
  const viewerRef = useRef<HTMLDivElement>(null)

  const loadPDF = useCallback(async (bytes: Uint8Array, name: string, path?: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() })
      const doc = await loadingTask.promise
      setPdfDoc(doc)
      setPdfBytes(bytes)
      setFileName(name)
      setFilePath(path || null)
      setCurrentPage(1)
      setTotalPages(doc.numPages)
      setAnnotations(new Map())
      setIsModified(false)

      const metas: PDFPage[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        metas.push({
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          rotation: 0,
        })
      }
      setPageMetadatas(metas)

      try {
        const outlines = await doc.getOutline()
        if (outlines) {
          const bms: Bookmark[] = []
          for (const item of outlines) {
            let pageNum = 1
            try {
              if (item.dest) {
                let dest = item.dest
                if (typeof dest === 'string') {
                  dest = await doc.getDestination(dest)
                }
                if (Array.isArray(dest) && dest[0]) {
                  const ref = dest[0]
                  const idx = await doc.getPageIndex(ref)
                  pageNum = idx + 1
                }
              }
            } catch { /* ignore */ }
            bms.push({ title: item.title, pageNumber: pageNum })
          }
          setBookmarks(bms)
        }
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to load PDF:', err)
    }
  }, [])

  const handleOpenFile = useCallback(async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile()
      if (result) {
        const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0))
        loadPDF(bytes, result.fileName, result.filePath)
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const buffer = await file.arrayBuffer()
          loadPDF(new Uint8Array(buffer), file.name)
        }
      }
      input.click()
    }
  }, [loadPDF])

  const saveBytesToFile = useCallback(async (bytes: Uint8Array, defaultName: string) => {
    if (window.electronAPI) {
      const savePath = await window.electronAPI.saveFile(defaultName)
      if (savePath) {
        const base64 = btoa(String.fromCharCode(...bytes))
        await window.electronAPI.writeFile(savePath, base64)
      }
    } else {
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = defaultName
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!pdfBytes) return
    let bytesToSave = pdfBytes

    if (annotations.size > 0) {
      const pdfLibDoc = await PDFDocument.load(bytesToSave)
      bytesToSave = await pdfLibDoc.save()
    }

    if (window.electronAPI) {
      const savePath = filePath || await window.electronAPI.saveFile(fileName)
      if (savePath) {
        const base64 = btoa(String.fromCharCode(...bytesToSave))
        await window.electronAPI.writeFile(savePath, base64)
        setFilePath(savePath)
        setIsModified(false)
      }
    } else {
      const blob = new Blob([bytesToSave], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'document.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setIsModified(false)
    }
  }, [pdfBytes, filePath, fileName, annotations])

  const handleSaveAs = useCallback(async () => {
    if (!pdfBytes) return
    if (window.electronAPI) {
      const savePath = await window.electronAPI.saveFile(fileName)
      if (savePath) {
        const base64 = btoa(String.fromCharCode(...pdfBytes))
        await window.electronAPI.writeFile(savePath, base64)
        setFilePath(savePath)
      }
    } else {
      handleSave()
    }
  }, [pdfBytes, fileName, handleSave])

  const handlePrint = useCallback(() => {
    if (!pdfBytes) return
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url)
    if (w) {
      w.onload = () => {
        w.print()
        setTimeout(() => {
          w.close()
          URL.revokeObjectURL(url)
        }, 1000)
      }
    }
  }, [pdfBytes])

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 5)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.25)), [])
  const handleFitWidth = useCallback(() => setZoom(1.5), [])
  const handleFitPage = useCallback(() => setZoom(1.0), [])

  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1))
  }, [totalPages])

  const handleGoToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }, [totalPages])

  const handleRotateLeft = useCallback(async () => {
    if (!pdfBytes) return
    const newBytes = await rotatePages(pdfBytes, [currentPage - 1], -90)
    loadPDF(newBytes, fileName, filePath || undefined)
    setIsModified(true)
  }, [pdfBytes, currentPage, fileName, filePath, loadPDF])

  const handleRotateRight = useCallback(async () => {
    if (!pdfBytes) return
    const newBytes = await rotatePages(pdfBytes, [currentPage - 1], 90)
    loadPDF(newBytes, fileName, filePath || undefined)
    setIsModified(true)
  }, [pdfBytes, currentPage, fileName, filePath, loadPDF])

  const handleRotateAllLeft = useCallback(async () => {
    if (!pdfBytes) return
    const allIndices = Array.from({ length: totalPages }, (_, i) => i)
    const newBytes = await rotatePages(pdfBytes, allIndices, -90)
    loadPDF(newBytes, fileName, filePath || undefined)
    setIsModified(true)
  }, [pdfBytes, totalPages, fileName, filePath, loadPDF])

  const handleRotateAllRight = useCallback(async () => {
    if (!pdfBytes) return
    const allIndices = Array.from({ length: totalPages }, (_, i) => i)
    const newBytes = await rotatePages(pdfBytes, allIndices, 90)
    loadPDF(newBytes, fileName, filePath || undefined)
    setIsModified(true)
  }, [pdfBytes, totalPages, fileName, filePath, loadPDF])

  const handleDeletePages = useCallback(async (pageIndices: number[]) => {
    if (!pdfBytes || pageIndices.length >= totalPages) return
    const newBytes = await deletePages(pdfBytes, pageIndices)
    loadPDF(newBytes, fileName, filePath || undefined)
    setIsModified(true)
  }, [pdfBytes, totalPages, fileName, filePath, loadPDF])

  const handleRotateSelectedPages = useCallback(async (pageIndices: number[], angle: number) => {
    if (!pdfBytes) return
    const newBytes = await rotatePages(pdfBytes, pageIndices, angle)
    loadPDF(newBytes, fileName, filePath || undefined)
    setIsModified(true)
  }, [pdfBytes, fileName, filePath, loadPDF])

  const handleInsertBlankPage = useCallback(async (afterPageIndex: number) => {
    if (!pdfBytes) return
    const meta = pageMetadatas[afterPageIndex]
    const w = meta ? meta.width : 612
    const h = meta ? meta.height : 792
    const newBytes = await insertBlankPage(pdfBytes, afterPageIndex, w, h)
    loadPDF(newBytes, fileName, filePath || undefined)
    setCurrentPage(afterPageIndex + 2)
    setIsModified(true)
  }, [pdfBytes, pageMetadatas, fileName, filePath, loadPDF])

  const handleInsertFromPDF = useCallback(async (afterPageIndex: number) => {
    setInsertAfterPage(afterPageIndex)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !pdfBytes) return
      const buffer = await file.arrayBuffer()
      const sourceBytes = new Uint8Array(buffer)
      const newBytes = await insertPagesFromPDF(pdfBytes, sourceBytes, afterPageIndex)
      loadPDF(newBytes, fileName, filePath || undefined)
      setCurrentPage(afterPageIndex + 2)
      setIsModified(true)
    }
    input.click()
  }, [pdfBytes, fileName, filePath, loadPDF])

  const handleInsertFromClipboard = useCallback(async (afterPageIndex: number) => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })

            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image()
              img.onload = () => resolve(img)
              img.onerror = reject
              img.src = dataUrl
            })

            if (!pdfBytes) return
            const pdfLibDoc = await PDFDocument.load(pdfBytes)
            const pngBytes = await fetch(dataUrl).then((r) => r.arrayBuffer())
            const pngImage = await pdfLibDoc.embedPng(new Uint8Array(pngBytes))

            const meta = pageMetadatas[afterPageIndex]
            const pageW = meta ? meta.width : 612
            const pageH = meta ? meta.height : 792
            pdfLibDoc.insertPage(afterPageIndex + 1, [pageW, pageH])
            const newPage = pdfLibDoc.getPage(afterPageIndex + 1)

            const scale = Math.min((pageW - 72) / img.width, (pageH - 72) / img.height, 1)
            const imgW = img.width * scale
            const imgH = img.height * scale
            newPage.drawImage(pngImage, {
              x: (pageW - imgW) / 2,
              y: (pageH - imgH) / 2,
              width: imgW,
              height: imgH,
            })

            const newBytes = await pdfLibDoc.save()
            loadPDF(newBytes, fileName, filePath || undefined)
            setCurrentPage(afterPageIndex + 2)
            setIsModified(true)
            return
          }
        }
      }

      const text = await navigator.clipboard.readText()
      if (text && pdfBytes) {
        const pdfLibDoc = await PDFDocument.load(pdfBytes)
        const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica)
        const meta = pageMetadatas[afterPageIndex]
        const pageW = meta ? meta.width : 612
        const pageH = meta ? meta.height : 792
        pdfLibDoc.insertPage(afterPageIndex + 1, [pageW, pageH])
        const newPage = pdfLibDoc.getPage(afterPageIndex + 1)

        const lines = text.split('\n')
        const fontSize = 12
        const lineHeight = fontSize * 1.4
        const marginX = 54
        const marginY = pageH - 54
        for (let i = 0; i < lines.length; i++) {
          const y = marginY - i * lineHeight
          if (y < 54) break
          newPage.drawText(lines[i], { x: marginX, y, size: fontSize, font })
        }

        const newBytes = await pdfLibDoc.save()
        loadPDF(newBytes, fileName, filePath || undefined)
        setCurrentPage(afterPageIndex + 2)
        setIsModified(true)
      }
    } catch (err) {
      console.error('Clipboard paste failed:', err)
      alert('无法读取剪贴板内容，请确保剪贴板中有图片或文字')
    }
  }, [pdfBytes, pageMetadatas, fileName, filePath, loadPDF])

  const handleMerge = useCallback(async (additionalFiles: Array<{ data: Uint8Array; name: string }>) => {
    if (!pdfBytes) return
    const allBytes = [pdfBytes, ...additionalFiles.map((f) => f.data)]
    const mergedBytes = await mergePDFs(allBytes)
    await saveBytesToFile(mergedBytes, fileName.replace('.pdf', '_merged.pdf'))
  }, [pdfBytes, fileName, saveBytesToFile])

  const handleSplit = useCallback(async (ranges: Array<[number, number]>) => {
    if (!pdfBytes) return
    const results = await splitPDF(pdfBytes, ranges)
    for (let i = 0; i < results.length; i++) {
      await saveBytesToFile(results[i], `${fileName.replace('.pdf', '')}_part${i + 1}.pdf`)
    }
  }, [pdfBytes, fileName, saveBytesToFile])

  const handleEncrypt = useCallback(async (password: string) => {
    if (!pdfBytes) return
    const newBytes = await encryptPDF(pdfBytes, password)
    await saveBytesToFile(newBytes, fileName.replace('.pdf', '_encrypted.pdf'))
  }, [pdfBytes, fileName, saveBytesToFile])

  const handleExportImage = useCallback(async () => {
    if (!pdfDoc) return
    const page = await pdfDoc.getPage(currentPage)
    const scale = 2
    const viewport = page.getViewport({ scale, rotation })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    const dataUrl = canvas.toDataURL('image/png')
    if (window.electronAPI) {
      const savePath = await window.electronAPI.saveImage(`page_${currentPage}.png`)
      if (savePath) {
        const base64 = dataUrl.split(',')[1]
        await window.electronAPI.writeFile(savePath, base64)
      }
    } else {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `page_${currentPage}.png`
      a.click()
    }
  }, [pdfDoc, currentPage, rotation])

  const handleAddAnnotation = useCallback((page: number, annotation: Annotation) => {
    setAnnotations((prev) => {
      const next = new Map(prev)
      const existing = next.get(page) || []
      next.set(page, [...existing, annotation])
      return next
    })
    setIsModified(true)
  }, [])

  const handleRemoveAnnotation = useCallback((page: number, id: string) => {
    setAnnotations((prev) => {
      const next = new Map(prev)
      const existing = next.get(page) || []
      next.set(page, existing.filter((a) => a.id !== id))
      return next
    })
    setIsModified(true)
  }, [])

  const handleUpdateAnnotation: OnUpdateAnnotation = useCallback(
    (page, id, updates) => {
      setAnnotations((prev) => {
        const next = new Map(prev)
        const existing = next.get(page) || []
        next.set(
          page,
          existing.map((a) =>
            a.id === id ? { ...a, ...updates, data: updates.data ? { ...a.data, ...updates.data } : a.data } : a
          )
        )
        return next
      })
      setIsModified(true)
    },
    []
  )

  // Image insertion: opens file picker, creates image annotation with data URL
  const handleInsertImage = useCallback(
    (page: number, x: number, y: number) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        const annotation: Annotation = {
          id: `img_${Date.now()}`,
          page,
          type: 'image',
          data: {
            x,
            y,
            width: 200,
            height: 150,
            src: dataUrl,
          },
        }
        handleAddAnnotation(page, annotation)
      }
      input.click()
    },
    [handleAddAnnotation]
  )

  // Edit existing PDF text block: whiteout original + overlay new text annotation
  const handleEditTextBlock = useCallback(
    (item: TextItem) => {
      setEditingTextItem(item)
    },
    []
  )

  const handleEditTextBlockSave = useCallback(
    async (newText: string, fontSize: number, color: string) => {
      if (!editingTextItem) return
      const pageIndex = editingTextItem.pageIndex

      // Whiteout the original text area
      const whiteoutAnn: Annotation = {
        id: `wo_${Date.now()}`,
        page: pageIndex + 1,
        type: 'whiteout',
        data: {
          x: editingTextItem.x,
          y: editingTextItem.y,
          width: editingTextItem.width + 2,
          height: editingTextItem.height + 2,
        },
      }
      handleAddAnnotation(pageIndex + 1, whiteoutAnn)

      // Add new text annotation on top
      const textAnn: Annotation = {
        id: `edit_${Date.now()}`,
        page: pageIndex + 1,
        type: 'text',
        data: {
          x: editingTextItem.x,
          y: editingTextItem.y,
          text: newText,
          fontSize,
          color,
        },
      }
      handleAddAnnotation(pageIndex + 1, textAnn)

      setEditingTextItem(null)
    },
    [editingTextItem, handleAddAnnotation]
  )

  const handleSignatureCapture = useCallback((dataUrl: string) => {
    setSignatureData(dataUrl)
    setActiveTool('signature')
  }, [])

  const handleAddNote = useCallback((page: number, x: number, y: number, text: string) => {
    const annotation: Annotation = {
      id: `note_${Date.now()}`,
      page,
      type: 'note',
      data: { x, y, text },
    }
    handleAddAnnotation(page, annotation)
  }, [handleAddAnnotation])

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.onFileOpened(({ data, fileName: name, filePath: path }) => {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      loadPDF(bytes, name, path)
    })
    window.electronAPI.onMenuSave(() => handleSave())
    window.electronAPI.onMenuSaveAs(() => handleSaveAs())
    window.electronAPI.onMenuPrint(() => handlePrint())
    window.electronAPI.onMenuAbout(() => setShowAboutModal(true))
  }, [loadPDF, handleSave, handleSaveAs, handlePrint])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        handleOpenFile()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '=' || (e.metaKey || e.ctrlKey) && e.key === '+') {
        e.preventDefault()
        handleZoomIn()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleOpenFile, handleSave, handleZoomIn, handleZoomOut])

  return (
    <div className="app">
      <div className="app-titlebar">
        <span className="title">
          {fileName ? `${fileName}${isModified ? ' •' : ''}` : 'PDF Editor'}
        </span>
      </div>

      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onOpen={handleOpenFile}
        onSave={handleSave}
        onPrint={handlePrint}
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onRotateAllLeft={handleRotateAllLeft}
        onRotateAllRight={handleRotateAllRight}
        onExportImage={handleExportImage}
        onEncrypt={() => setShowEncryptModal(true)}
        onSignature={() => setShowSignatureModal(true)}
        onMerge={() => setShowMergeModal(true)}
        onSplit={() => setShowSplitModal(true)}
        onAbout={() => setShowAboutModal(true)}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
        hasPDF={!!pdfDoc}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onGoToPage={handleGoToPage}
      />

      <div className="app-body">
        {sidebarOpen && pdfDoc && (
          <Sidebar
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            onGoToPage={handleGoToPage}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            rotation={rotation}
            bookmarks={bookmarks}
            pageMetadatas={pageMetadatas}
            onDeletePages={handleDeletePages}
            onRotatePages={handleRotateSelectedPages}
            onInsertBlankPage={handleInsertBlankPage}
            onInsertFromPDF={handleInsertFromPDF}
            onInsertFromClipboard={handleInsertFromClipboard}
            totalPages={totalPages}
          />
        )}

        {pdfDoc ? (
          <PDFViewer
            ref={viewerRef}
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            zoom={zoom}
            rotation={rotation}
            activeTool={activeTool}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            signatureData={signatureData}
            onSignaturePlaced={() => setSignatureData(null)}
            onNoteClick={(page, x, y) => {
              setNotePosition({ page, x, y })
              setShowNoteModal(true)
            }}
            onInsertImage={handleInsertImage}
            onEditTextBlock={handleEditTextBlock}
            pageMetadatas={pageMetadatas}
          />
        ) : (
          <div className="welcome-screen">
            <div className="logo">📄</div>
            <h2>PDF Editor</h2>
            <p>打开 PDF 文件开始编辑</p>
            <button className="open-btn" onClick={handleOpenFile}>
              打开文件
            </button>
          </div>
        )}
      </div>

      <StatusBar
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        rotation={rotation}
        fileName={fileName}
      />

      {showSignatureModal && (
        <SignatureModal
          onCapture={handleSignatureCapture}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      {showNoteModal && notePosition && (
        <NoteModal
          onSave={(text) => {
            handleAddNote(notePosition.page, notePosition.x, notePosition.y, text)
            setShowNoteModal(false)
            setNotePosition(null)
            setNoteText('')
          }}
          onClose={() => {
            setShowNoteModal(false)
            setNotePosition(null)
            setNoteText('')
          }}
          text={noteText}
          onTextChange={setNoteText}
        />
      )}

      {showEncryptModal && (
        <EncryptModal
          onEncrypt={(password) => {
            handleEncrypt(password)
            setShowEncryptModal(false)
          }}
          onClose={() => setShowEncryptModal(false)}
        />
      )}

      {showMergeModal && (
        <MergeModal
          currentFileName={fileName}
          onMerge={(files) => {
            handleMerge(files)
            setShowMergeModal(false)
          }}
          onClose={() => setShowMergeModal(false)}
        />
      )}

      {showSplitModal && (
        <SplitModal
          totalPages={totalPages}
          onSplit={(ranges) => {
            handleSplit(ranges)
            setShowSplitModal(false)
          }}
          onClose={() => setShowSplitModal(false)}
        />
      )}

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}

      {editingTextItem && (
        <EditTextBlockModal
          textItem={editingTextItem}
          onSave={(newText, fontSize, color) => handleEditTextBlockSave(newText, fontSize, color)}
          onClose={() => setEditingTextItem(null)}
        />
      )}
    </div>
  )
}

export default App
