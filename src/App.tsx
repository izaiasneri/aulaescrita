import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Image as ImageIcon, FileText, Grid, 
  AlignJustify, Eraser, Pen, Undo, Redo, X, 
  FileUp, MousePointer2 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// @ts-ignore - Permite ao Vite importar o worker localmente para funcionar offline
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  type: 'pen' | 'eraser';
  color: string;
  thickness: number;
  points: Point[];
}

type PaperType = 'blank' | 'lined' | 'grid';
type ToolType = 'pen' | 'eraser' | 'move';

interface FloatingImage {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  aspectRatio: number;
}

export default function App() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState(3);
  const [paperType, setPaperType] = useState<PaperType>('blank');
  
  const [floatingImg, setFloatingImg] = useState<FloatingImage | null>(null);
  const [isDraggingImg, setIsDraggingImg] = useState(false);
  const [isResizingImg, setIsResizingImg] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  const [history, setHistory] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  
  // Rastreador do nosso cursor customizado para a mesa digitalizadora
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);

  const colors = ['#000000', '#2563eb', '#dc2626', '#16a34a', '#eab308', '#f97316', '#9333ea', '#ffffff'];

  const resizeCanvases = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (bgCanvas && drawCanvas) {
      const { innerWidth, innerHeight } = window;
      bgCanvas.width = innerWidth;
      bgCanvas.height = innerHeight;
      drawCanvas.width = innerWidth;
      drawCanvas.height = innerHeight;
      renderBackground();
      renderStrokes(history);
    }
  }, [history, paperType]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();
    return () => window.removeEventListener('resize', resizeCanvases);
  }, [resizeCanvases]);

  const renderBackground = useCallback(() => {
    const canvas = bgCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (paperType === 'lined') {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1.5;
      for (let y = 50; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    } else if (paperType === 'grid') {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let y = 30; y < canvas.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      for (let x = 30; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
    }
  }, [paperType]);

  useEffect(() => {
    renderBackground();
  }, [renderBackground]);

  const renderStrokes = (strokes: Stroke[]) => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.globalCompositeOperation = stroke.type === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = stroke.type === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((point, i) => {
        if (i > 0) {
          const pressureModifier = point.pressure ? point.pressure * 2.5 : 1;
          ctx.lineWidth = stroke.thickness * pressureModifier;
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
        }
      });
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'move') return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setCursorPos({ x: e.clientX, y: e.clientY });
    
    const rect = drawCanvasRef.current!.getBoundingClientRect();
    const newStroke: Stroke = {
      type: tool as 'pen' | 'eraser',
      color,
      thickness,
      points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure || 0.5 }]
    };
    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool !== 'move') setCursorPos({ x: e.clientX, y: e.clientY });
    
    if (!isDrawing || !currentStroke || tool === 'move') return;
    const rect = drawCanvasRef.current!.getBoundingClientRect();
    const newPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure || 0.5 };
    
    if (e.ctrlKey && currentStroke.points.length > 0) {
      const firstPoint = currentStroke.points[0];
      const updatedStroke = { ...currentStroke, points: [firstPoint, newPoint] };
      setCurrentStroke(updatedStroke);
      renderStrokes([...history, updatedStroke]);
    } else {
      const updatedStroke = { ...currentStroke, points: [...currentStroke.points, newPoint] };
      setCurrentStroke(updatedStroke);
      renderStrokes([...history, updatedStroke]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    const newHistory = [...history, currentStroke];
    setHistory(newHistory);
    setRedoStack([]);
    setCurrentStroke(null);
    renderStrokes(newHistory);
  };

  const handlePointerOut = () => {
    setCursorPos(null);
    handlePointerUp();
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      setFloatingImg(prev => {
        if (!prev) return null;
        if (isDraggingImg) {
          return { ...prev, x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y };
        }
        if (isResizingImg) {
          const newW = Math.max(100, e.clientX - prev.x);
          return { ...prev, w: newW, h: newW * prev.aspectRatio };
        }
        return prev;
      });
    };

    const handleGlobalPointerUp = () => {
      setIsDraggingImg(false);
      setIsResizingImg(false);
    };

    if (isDraggingImg || isResizingImg) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDraggingImg, isResizingImg]);

  const undo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const undone = newHistory.pop()!;
    setHistory(newHistory);
    setRedoStack([...redoStack, undone]);
    renderStrokes(newHistory);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const newRedo = [...redoStack];
    const redone = newRedo.pop()!;
    const newHistory = [...history, redone];
    setHistory(newHistory);
    setRedoStack(newRedo);
    renderStrokes(newHistory);
  };

  const clearCanvas = () => {
    setHistory([]);
    setFloatingImg(null);
    setPaperType('blank');
    imageElementRef.current = null;
    renderStrokes([]);
  };

  const processImageToState = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      imageElementRef.current = img;
      const defaultWidth = Math.min(img.width, 800);
      const aspectRatio = img.height / img.width;
      setFloatingImg({
        src: dataUrl,
        x: window.innerWidth / 2 - defaultWidth / 2,
        y: 100,
        w: defaultWidth,
        h: defaultWidth * aspectRatio,
        aspectRatio
      });
      setTool('move');
    };
    img.src = dataUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const ctx = tempCanvas.getContext('2d');
        await page.render({ canvasContext: ctx!, viewport, canvas: tempCanvas }as any).promise;
        processImageToState(tempCanvas.toDataURL('image/png'));
      } catch (error) {
        console.error("Erro ao carregar PDF:", error);
        alert("Não foi possível carregar o PDF.");
      }
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => processImageToState(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getMergedCanvasData = (): string => {
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = bgCanvasRef.current!.width;
    mergedCanvas.height = bgCanvasRef.current!.height;
    const ctx = mergedCanvas.getContext('2d')!;
    
    ctx.drawImage(bgCanvasRef.current!, 0, 0);
    
    if (floatingImg && imageElementRef.current) {
      ctx.drawImage(imageElementRef.current, floatingImg.x, floatingImg.y, floatingImg.w, floatingImg.h);
    }
    
    ctx.drawImage(drawCanvasRef.current!, 0, 0);
    return mergedCanvas.toDataURL('image/png');
  };

  const exportPNG = () => {
    const link = document.createElement('a');
    link.download = 'AulaEscrita_Quadro.png';
    link.href = getMergedCanvasData();
    link.click();
  };

  const exportPDF = () => {
    const canvas = bgCanvasRef.current!;
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(getMergedCanvasData(), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('AulaEscrita_Quadro.pdf');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      
      <canvas ref={bgCanvasRef} className="absolute top-0 left-0 z-0 pointer-events-none" />
      
      {floatingImg && (
        <div
          className="absolute z-10"
          style={{
            left: floatingImg.x, top: floatingImg.y, width: floatingImg.w, height: floatingImg.h,
            border: tool === 'move' ? '2px dashed #3b82f6' : 'none',
            cursor: tool === 'move' ? (isDraggingImg ? 'grabbing' : 'grab') : 'default',
          }}
          onPointerDown={(e) => {
            if (tool !== 'move') return;
            setIsDraggingImg(true);
            dragOffset.current = { x: e.clientX - floatingImg.x, y: e.clientY - floatingImg.y };
          }}
        >
          <img src={floatingImg.src} alt="Importado" className="w-full h-full pointer-events-none shadow-sm" />
          
          {tool === 'move' && (
            <div
              className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 rounded-full border-2 border-white cursor-nwse-resize shadow-md"
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsResizingImg(true);
              }}
            />
          )}
        </div>
      )}

      <canvas 
        ref={drawCanvasRef}
        className={`absolute top-0 left-0 z-20 touch-none ${tool === 'move' ? 'pointer-events-none' : ''}`}
        style={{ cursor: tool === 'move' ? 'default' : 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerOut}
      />

      {/* Cursor de Software Invencível para Mesa Digitalizadora */}
      {cursorPos && tool !== 'move' && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: tool === 'eraser' ? 'translate(-3px, -20px)' : 'translate(-2px, -22px)'
          }}
        >
          {tool === 'eraser' ? (
            <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white' stroke='black' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M20 20H7L3 16a2 2 0 0 1 0-2.83l10-10a2 2 0 0 1 2.83 0l5 5a2 2 0 0 1 0 2.83L11 20'/>
            </svg>
          ) : (
            <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'/>
            </svg>
          )}
        </div>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-white px-4 py-2 rounded-2xl shadow-lg border border-gray-200 gap-3 text-sm">
        
        <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700" title="Inserir Imagem ou PDF">
              <FileUp size={18} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
            <button onClick={exportPNG} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700" title="Exportar PNG"><ImageIcon size={18} /></button>
            <button onClick={exportPDF} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700" title="Exportar PDF"><FileText size={18} /></button>
        </div>

        <div className="w-px h-6 bg-gray-200"></div>

        <div className="flex items-center gap-1">
            <button onClick={() => setPaperType('blank')} className={`p-2 rounded-lg ${paperType === 'blank' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`} title="Papel Branco"><FileText size={18} /></button>
            <button onClick={() => setPaperType('lined')} className={`p-2 rounded-lg ${paperType === 'lined' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`} title="Caderno"><AlignJustify size={18} /></button>
            <button onClick={() => setPaperType('grid')} className={`p-2 rounded-lg ${paperType === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`} title="Quadriculado"><Grid size={18} /></button>
        </div>

        <div className="w-px h-6 bg-gray-200"></div>

        <div className="flex items-center gap-1">
          <button onClick={() => setTool('move')} className={`p-2 rounded-lg ${tool === 'move' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`} title="Mover e Redimensionar">
            <MousePointer2 size={18} />
          </button>
          <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`} title="Caneta">
            <Pen size={18} />
          </button>
          <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`} title="Borracha">
            <Eraser size={18} />
          </button>
          <button onClick={undo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700" title="Desfazer"><Undo size={18} /></button>
          <button onClick={redo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700" title="Refazer"><Redo size={18} /></button>
          <button onClick={clearCanvas} className="p-2 hover:bg-red-50 text-red-600 rounded-lg" title="Limpar Tudo"><X size={18} /></button>
        </div>

        <div className="w-px h-6 bg-gray-200"></div>

        <div className="flex items-center gap-3 pl-1">
          <div className="flex items-center gap-1">
            {colors.map(c => (
              <button 
                key={c} onClick={() => { setColor(c); setTool('pen'); }}
                className={`w-5 h-5 rounded-full border-2 ${color === c && tool === 'pen' ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-medium">Espessura</span>
            <input 
              type="range" min="1" max="30" value={thickness} 
              onChange={(e) => setThickness(Number(e.target.value))} 
              className="w-20 cursor-pointer accent-blue-500"
            />
            <span className="w-4 text-center text-gray-600 font-medium">{thickness}</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}