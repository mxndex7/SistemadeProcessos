import React, { useEffect, useRef, useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import fcasLogo from "../assets/logofcas.png";

export const HEADER_HTML = `
  <div class="fcas-header-print" style="text-align:center;font-family:Georgia,'Times New Roman',serif;display:block;margin:0 auto 34px auto;max-width:700px;color:#000;">
    <img src="${fcasLogo}" alt="Logo FCAS" style="display:block;margin:0 auto 10px auto;width:92px;height:92px;object-fit:contain;" />
    <h2 style="margin:0;font-size:16px;font-weight:500;line-height:1.25;text-transform:uppercase;">FCAS - FUNDAÇÃO DE APOIO AO CENTRO DE ASSISTÊNCIA SOCIAL DA PMPE</h2>
    <p style="margin:0;font-size:11px;line-height:1.25;">Endereço: Rua Guilherme Pinto, n 155, bairro do Derby, Recife - PE, CEP: 52010-200 CNPJ: 32.928.258/0001-49</p>
    <p style="margin:0;font-size:11px;line-height:1.25;">Email: <u>fundacaocas@gmail.com</u> / Contato: (81) 98713-4377</p>
  </div><!-- END_FCAS_HEADER_MARKER -->
`;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  documentTitle: string;
  documentType: string;
  processNup: string;
}

export default function RichTextEditor({
  value,
  onChange,
  onSave,
  onDiscard,
  documentTitle,
  documentType,
  processNup,
}: RichTextEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const quillInstanceRef = useRef<any>(null);
  const quillHasFocusRef = useRef<boolean>(false);
  const lastHtmlRef = useRef<string>("");
  const [quillLoaded, setQuillLoaded] = useState(false);

  // Dynamically load Quill.js from CDN to avoid build/package alignment errors (BUG 02)
  useEffect(() => {
    const scriptId = "quill-cdn-script";
    const cssId = "quill-cdn-css";

    // 1. Append CSS
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css";
      document.head.appendChild(link);
    }

    // 2. Append JS
    let scriptExists = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptExists) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js";
      script.async = true;
      script.onload = () => {
        setQuillLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      // Check if already loaded globally
      if ((window as any).Quill) {
        setQuillLoaded(true);
      } else {
        scriptExists.addEventListener("load", () => {
          setQuillLoaded(true);
        });
      }
    }
  }, []);

  // Strip institutional header for separate rendering if already attached (BUG 04)
  const getPureQuillContent = (fullHtml: string): string => {
    if (!fullHtml) return "";
    const splitIndex = fullHtml.indexOf("<!-- END_FCAS_HEADER_MARKER -->");
    if (splitIndex !== -1) {
      return fullHtml.substring(splitIndex + "<!-- END_FCAS_HEADER_MARKER -->".length).trim();
    }
    // Also clean standard header template if not using the marker
    if (fullHtml.includes("fcas-header-print")) {
      const divClosureIndex = fullHtml.indexOf("</div>");
      if (divClosureIndex !== -1) {
        return fullHtml.substring(divClosureIndex + 6).trim();
      }
    }
    return fullHtml;
  };

  // Initialize Quill instance
  useEffect(() => {
    if (!quillLoaded || !editorContainerRef.current || quillInstanceRef.current) return;

    const Quill = (window as any).Quill;
    if (!Quill) return;

    // Register style filters and attributes to resolve stylesheet purging (BUG 03)
    try {
      const Parchment = Quill.import("parchment");
      
      const marginAttr = new Parchment.Attributor.Style("margin", "margin", { scope: Parchment.Scope.INLINE });
      const paddingAttr = new Parchment.Attributor.Style("padding", "padding", { scope: Parchment.Scope.INLINE });
      const lineHeightAttr = new Parchment.Attributor.Style("line-height", "line-height", { scope: Parchment.Scope.INLINE });
      const textIndentAttr = new Parchment.Attributor.Style("text-indent", "text-indent", { scope: Parchment.Scope.INLINE });
      const borderAttr = new Parchment.Attributor.Style("border", "border", { scope: Parchment.Scope.INLINE });
      const fontStyleAttr = new Parchment.Attributor.Style("font-style", "font-style", { scope: Parchment.Scope.INLINE });
      const fontSizeAttr = new Parchment.Attributor.Style("font-size", "font-size", { scope: Parchment.Scope.INLINE });
      const fontWeightAttr = new Parchment.Attributor.Style("font-weight", "font-weight", { scope: Parchment.Scope.INLINE });
      const colorAttr = new Parchment.Attributor.Style("color", "color", { scope: Parchment.Scope.INLINE });
      const bgAttr = new Parchment.Attributor.Style("background-color", "background-color", { scope: Parchment.Scope.INLINE });
      const widthAttr = new Parchment.Attributor.Style("width", "width", { scope: Parchment.Scope.INLINE });
      const heightAttr = new Parchment.Attributor.Style("height", "height", { scope: Parchment.Scope.INLINE });
      const displayAttr = new Parchment.Attributor.Style("display", "display", { scope: Parchment.Scope.INLINE });
      const textDecorAttr = new Parchment.Attributor.Style("text-decoration", "text-decoration", { scope: Parchment.Scope.INLINE });

      Quill.register(marginAttr, true);
      Quill.register(paddingAttr, true);
      Quill.register(lineHeightAttr, true);
      Quill.register(textIndentAttr, true);
      Quill.register(borderAttr, true);
      Quill.register(fontStyleAttr, true);
      Quill.register(fontSizeAttr, true);
      Quill.register(fontWeightAttr, true);
      Quill.register(colorAttr, true);
      Quill.register(bgAttr, true);
      Quill.register(widthAttr, true);
      Quill.register(heightAttr, true);
      Quill.register(displayAttr, true);
      Quill.register(textDecorAttr, true);

      // Align and Size
      const AlignStyle = Quill.import("attributors/style/align");
      const SizeStyle = Quill.import("attributors/style/size");
      Quill.register(AlignStyle, true);
      Quill.register(SizeStyle, true);
    } catch (err) {
      console.warn("Estilos personalizados do Quill já registrados ou indisponíveis.", err);
    }

    const customToolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["clean"]
    ];

    const quill = new Quill(editorContainerRef.current, {
      theme: "snow",
      modules: {
        toolbar: customToolbarOptions,
      },
      placeholder: "Digite o texto oficial aqui...",
    });

    quillInstanceRef.current = quill;

    // Load initial content
    const cleanContent = getPureQuillContent(value);
    quill.root.innerHTML = cleanContent;
    lastHtmlRef.current = cleanContent;

    // Tracks editor focus and events to prevent re-entering loop cursor bugs (BUG 05)
    quill.on("selection-change", (range: any) => {
      quillHasFocusRef.current = !!range;
    });

    quill.on("text-change", () => {
      const quillHtml = quill.root.innerHTML;
      lastHtmlRef.current = quillHtml;
      // Triggers change callback with concatenated Immutable Header (BUG 04)
      const completeDocument = HEADER_HTML + quillHtml;
      onChange(completeDocument);
    });

    return () => {
      if (quillInstanceRef.current) {
        // Cleanup quill instance
        quillInstanceRef.current = null;
      }
    };
  }, [quillLoaded]);

  // Handle outside content updates safely to prevent jumps (BUG 05)
  useEffect(() => {
    if (!quillInstanceRef.current) return;
    const cleanContent = getPureQuillContent(value);
    
    // Safety check - only update if different and editor does not have user focus
    if (cleanContent !== lastHtmlRef.current && !quillHasFocusRef.current) {
      quillInstanceRef.current.root.innerHTML = cleanContent;
      lastHtmlRef.current = cleanContent;
    }
  }, [value]);

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FA] rounded-xl border border-[#D9E2EC] shadow-inner select-none relative overflow-hidden" id="fcas_quill_editor_wrapper">
      {/* 1. Header Toolbar Controls */}
      <div className="bg-white border-b border-[#D9E2EC] px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-[#004A99] tracking-wider block bg-[#EDF4FF] px-2 py-0.5 rounded-full inline-block leading-none mb-1">
            Editor Oficial SPFCAS (Quill)
          </span>
          <h4 className="text-xs font-bold text-[#00264D] truncate">{documentType}: {documentTitle}</h4>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 text-xs text-[#00264D] hover:bg-[#F4F7FA] border border-[#D9E2EC] rounded-lg cursor-pointer transition-colors font-medium"
            id="btn_discard_edit"
          >
            Descartar
          </button>
          <button
            onClick={onSave}
            className="px-4 py-1.5 text-xs bg-[#00264D] hover:bg-[#004A99] text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            id="btn_save_edit"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Edição
          </button>
        </div>
      </div>

      {/* 2. Paper Container (Immersive White Paper Sheet in Slated Background) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
        <div className="official-process-sheet bg-white p-8 sm:p-12 md:p-16 rounded-[12px] shadow-[0_4px_20px_rgba(0,38,77,0.06)] border border-[#D9E2EC] w-full max-w-3xl flex-1 flex flex-col text-left text-black antialiased shadow-sm select-text relative">
          
          {/* Static Immutable Header rendered OUTSIDE the editable Quill (BUG 04) */}
          <div 
            dangerouslySetInnerHTML={{ __html: HEADER_HTML }} 
            className="select-none pointer-events-none"
          />

          {/* Quill Editor mount area */}
          <div className="flex-1 flex flex-col mt-4 min-h-[400px]">
            {!quillLoaded ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#64748B] gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#004A99]" />
                <span className="text-xs font-semibold">Carregando editor seguro CAS...</span>
              </div>
            ) : (
              <div 
                ref={editorContainerRef} 
                className="quill-editor-body flex-1 text-xs text-justify"
                style={{ fontSize: "12px", border: "none" }}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
