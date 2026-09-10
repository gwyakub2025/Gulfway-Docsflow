import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Eye,
  Check,
  Move,
  Layers,
  Sparkles,
  Play,
  Save,
  Shield,
  FileCheck,
  HelpCircle,
  Binary,
  GripVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Crosshair,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
  FileCode,
  FileType,
  Loader2,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MousePointer,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  FormField,
  FormTemplate,
  FieldType,
  Company,
  Department,
  NumberingRule,
} from '../types/index.js';
import { api } from '../api.js';
import { renderPdfPageToImage, parseDocxFile } from '../utils/documentRenderer.js';

interface FormBuilderProps {
  companies: Company[];
  departments: Department[];
  numberingRules: NumberingRule[];
  existingForm?: FormTemplate | null;
  onSaveSuccess: (form: FormTemplate) => void;
  onCancel: () => void;
}

const FIELD_TOOLBAR_ITEMS: Array<{ type: FieldType; label: string; icon: string; category: string }> = [
  { type: 'text', label: 'Text Field', icon: 'Aa', category: 'Input' },
  { type: 'number', label: 'Number', icon: '123', category: 'Input' },
  { type: 'date', label: 'Date', icon: '📅', category: 'Input' },
  { type: 'time', label: 'Time', icon: '⏰', category: 'Input' },
  { type: 'dropdown', label: 'Dropdown', icon: '▼', category: 'Input' },
  { type: 'radio', label: 'Radio Button', icon: '◉', category: 'Input' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑', category: 'Input' },
  { type: 'textarea', label: 'Textarea (Multiline)', icon: '¶', category: 'Input' },
  { type: 'employee_search', label: 'Employee Picker', icon: '👤', category: 'System' },
  { type: 'company_search', label: 'Company Picker', icon: '🏢', category: 'System' },
  { type: 'signature', label: 'Digital Signature Box', icon: '✍️', category: 'Auth' },
  { type: 'thumbprint', label: 'Thumbprint Box', icon: '🖐️', category: 'Auth' },
  { type: 'company_stamp', label: 'Company Seal / Stamp', icon: '🛡️', category: 'Auth' },
  { type: 'document_number', label: 'Sequential Serial Number', icon: '№', category: 'Security' },
  { type: 'qr_code', label: 'Tamper Verification QR', icon: '▣', category: 'Security' },
  { type: 'barcode', label: 'Barcode', icon: '|||', category: 'Security' },
  { type: 'generated_date', label: 'Generation Timestamp', icon: '🗓️', category: 'Security' },
  { type: 'generated_by', label: 'Issuer Name', icon: '✍', category: 'Security' },
  { type: 'photo', label: 'Photo Attachment Box', icon: '🖼️', category: 'Attachment' },
];

export const FormBuilder: React.FC<FormBuilderProps> = ({
  companies,
  departments,
  numberingRules,
  existingForm,
  onSaveSuccess,
  onCancel,
}) => {
  // General Info
  const [formName, setFormName] = useState(existingForm?.formName || '');
  const [formCode, setFormCode] = useState(existingForm?.formCode || '');
  const [description, setDescription] = useState(existingForm?.description || '');
  const [departmentId, setDepartmentId] = useState(existingForm?.departmentId || 'dept-hr');
  const [category, setCategory] = useState(existingForm?.category || 'HR Forms');
  const [companyScope, setCompanyScope] = useState<'ALL' | 'SPECIFIC'>(
    existingForm?.companyScope || 'ALL'
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    existingForm?.companyIds || []
  );
  const [numberingRuleId, setNumberingRuleId] = useState(
    existingForm?.numberingRuleId || numberingRules[0]?.id || 'rule-default'
  );
  const [instructions, setInstructions] = useState(
    existingForm?.instructions || 'Review all mandatory fields carefully before requesting official numbering.'
  );

  // Mapped Fields
  const [fields, setFields] = useState<FormField[]>(existingForm?.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Document Template State (PDF or Word)
  const [uploadedDocumentType, setUploadedDocumentType] = useState<'pdf' | 'docx' | 'none'>(
    existingForm?.pdfTemplateUrl ? 'pdf' : existingForm?.docxHtmlContent ? 'docx' : 'none'
  );
  const [pdfTemplateUrl, setPdfTemplateUrl] = useState(existingForm?.pdfTemplateUrl || '');
  const [docxHtmlContent, setDocxHtmlContent] = useState(existingForm?.docxHtmlContent || '');
  const [pdfFileName, setPdfFileName] = useState(
    existingForm?.sourceDocumentName ||
      (existingForm?.pdfTemplateUrl ? 'Existing Template PDF' : existingForm?.docxHtmlContent ? 'Word Document (.docx)' : '')
  );
  const [pdfPageImage, setPdfPageImage] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(existingForm?.pdfPageCount || 1);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  const [isRenderingDocument, setIsRenderingDocument] = useState(false);

  // Canvas interaction state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [resizingFieldId, setResizingFieldId] = useState<string | null>(null);
  const [clickToPlaceType, setClickToPlaceType] = useState<FieldType | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Active Tab / View Mode
  const [activeStep, setActiveStep] = useState<'SETTINGS' | 'MAPPER' | 'TEST'>('SETTINGS');
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [testFillValues, setTestFillValues] = useState<Record<string, any>>({});
  const [previewPdfBase64, setPreviewPdfBase64] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Selected Field for Inspector
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Pre-render existing PDF template if loaded
  useEffect(() => {
    if (existingForm?.pdfTemplateUrl && !pdfPageImage) {
      setIsRenderingDocument(true);
      renderPdfPageToImage(existingForm.pdfTemplateUrl, 1)
        .then((res) => {
          setPdfPageImage(res.dataUrl);
          setPdfPageCount(res.totalPdfPages);
          setUploadedDocumentType('pdf');
        })
        .catch((err) => {
          console.warn('Could not pre-render existing PDF template:', err);
        })
        .finally(() => setIsRenderingDocument(false));
    } else if (existingForm?.docxHtmlContent) {
      setDocxHtmlContent(existingForm.docxHtmlContent);
      setUploadedDocumentType('docx');
    }
  }, [existingForm]);

  // Handle multi-format file upload (PDF, DOCX, DOC)
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isDocx =
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.doc');

    if (!isPdf && !isDocx) {
      setErrorMsg('Please upload a valid PDF (.pdf) or Word document (.docx, .doc).');
      return;
    }

    setIsRenderingDocument(true);
    setErrorMsg('');
    setPdfFileName(file.name);

    try {
      if (isPdf) {
        setUploadedDocumentType('pdf');
        setDocxHtmlContent('');
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          setPdfTemplateUrl(dataUrl);
          try {
            const pageRes = await renderPdfPageToImage(dataUrl, 1);
            setPdfPageImage(pageRes.dataUrl);
            setPdfPageCount(pageRes.totalPdfPages);
            setCurrentPreviewPage(1);
            setSuccessMsg(`PDF template "${file.name}" loaded successfully (${pageRes.totalPdfPages} page${pageRes.totalPdfPages > 1 ? 's' : ''}).`);
          } catch (renderErr: any) {
            console.warn('PDF image render failed, fallback enabled:', renderErr);
            setSuccessMsg(`PDF template "${file.name}" loaded.`);
          } finally {
            setIsRenderingDocument(false);
          }
        };
        reader.readAsDataURL(file);
      } else if (isDocx) {
        setUploadedDocumentType('docx');
        setPdfPageImage(null);
        setPdfTemplateUrl('');
        const arrayBuf = await file.arrayBuffer();
        const { html } = await parseDocxFile(arrayBuf);
        setDocxHtmlContent(html);
        setIsRenderingDocument(false);
        setSuccessMsg(`Word template "${file.name}" loaded successfully.`);

        // Suggest form name if empty
        if (!formName.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setFormName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    } catch (err: any) {
      setErrorMsg(`Failed to process document: ${err.message}`);
      setIsRenderingDocument(false);
    }
  };

  // Change active page in multi-page PDF
  const handlePageChange = async (newPage: number) => {
    if (!pdfTemplateUrl || newPage < 1 || newPage > pdfPageCount) return;
    setIsRenderingDocument(true);
    try {
      const pageRes = await renderPdfPageToImage(pdfTemplateUrl, newPage);
      setPdfPageImage(pageRes.dataUrl);
      setCurrentPreviewPage(newPage);
    } catch (err: any) {
      setErrorMsg(`Failed to render page ${newPage}: ${err.message}`);
    } finally {
      setIsRenderingDocument(false);
    }
  };

  // Clear uploaded template background
  const handleClearTemplate = () => {
    setPdfTemplateUrl('');
    setPdfPageImage(null);
    setDocxHtmlContent('');
    setPdfFileName('');
    setUploadedDocumentType('none');
    setSuccessMsg('Reverted to standard corporate system layout.');
  };

  // Add field to visual canvas with smart position
  const handleAddField = (type: FieldType, targetX?: number, targetY?: number) => {
    const newFieldId = `fld-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const defaultItem = FIELD_TOOLBAR_ITEMS.find((item) => item.type === type);
    const defaultLabel = defaultItem?.label || 'Field';
    const fieldNameKey = `${type}_${fields.length + 1}`;

    const defWidth =
      type === 'signature'
        ? 34
        : type === 'qr_code'
        ? 14
        : type === 'company_stamp'
        ? 18
        : type === 'document_number'
        ? 32
        : type === 'textarea'
        ? 80
        : 38;

    const defHeight =
      type === 'signature'
        ? 8
        : type === 'qr_code'
        ? 10
        : type === 'company_stamp'
        ? 10
        : type === 'textarea'
        ? 7
        : 3.8;

    // Smart default coordinate or exact drop/click coordinate
    const posX =
      targetX !== undefined
        ? Math.round(Math.max(0, Math.min(100 - defWidth, targetX)) * 10) / 10
        : 8 + ((fields.length * 5) % 45);

    const posY =
      targetY !== undefined
        ? Math.round(Math.max(0, Math.min(100 - defHeight, targetY)) * 10) / 10
        : 22 + ((fields.length * 6) % 55);

    const newField: FormField = {
      id: newFieldId,
      name:
        type === 'document_number'
          ? 'document_number'
          : type === 'qr_code'
          ? 'qr_verification'
          : type === 'company_stamp'
          ? 'company_stamp'
          : fieldNameKey,
      label: defaultLabel,
      type,
      pageNumber: currentPreviewPage,
      x: posX,
      y: posY,
      width: defWidth,
      height: defHeight,
      fontSize: 10,
      fontFamily: 'Helvetica',
      fontStyle: 'normal',
      alignment: 'left',
      required: type === 'document_number' || type === 'signature' || type === 'qr_code',
      visibility: true,
      editable: type !== 'document_number' && type !== 'qr_code' && type !== 'company_stamp',
      signerRole: type === 'signature' ? 'USER' : undefined,
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newFieldId);
    setClickToPlaceType(null);
  };

  const updateSelectedField = (updates: Partial<FormField>) => {
    if (!selectedFieldId) return;
    setFields(fields.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f)));
  };

  const removeSelectedField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  // Keyboard navigation for nudging selected field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedFieldId || activeStep !== 'MAPPER') return;
      // Skip if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      const step = e.shiftKey ? 2 : 0.5;
      const field = fields.find((f) => f.id === selectedFieldId);
      if (!field) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateSelectedField({ x: Math.round(Math.max(0, field.x - step) * 10) / 10 });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateSelectedField({ x: Math.round(Math.min(100 - field.width, field.x + step) * 10) / 10 });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateSelectedField({ y: Math.round(Math.max(0, field.y - step) * 10) / 10 });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateSelectedField({ y: Math.round(Math.min(100 - field.height, field.y + step) * 10) / 10 });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        removeSelectedField(selectedFieldId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, fields, activeStep]);

  // Mouse drag handler for moving field anywhere on the document canvas
  const handleFieldMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setDraggedFieldId(fieldId);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialX = field.x;
    const initialY = field.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaXPercent = ((moveEvent.clientX - startClientX) / rect.width) * 100;
      const deltaYPercent = ((moveEvent.clientY - startClientY) / rect.height) * 100;

      const newX = Math.round(Math.max(0, Math.min(100 - field.width, initialX + deltaXPercent)) * 10) / 10;
      const newY = Math.round(Math.max(0, Math.min(100 - field.height, initialY + deltaYPercent)) * 10) / 10;

      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, x: newX, y: newY } : f))
      );
    };

    const handleMouseUp = () => {
      setDraggedFieldId(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch drag handler for mobile/tablet devices
  const handleFieldTouchStart = (e: React.TouchEvent, fieldId: string) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setDraggedFieldId(fieldId);

    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const touch = e.touches[0];
    const startClientX = touch.clientX;
    const startClientY = touch.clientY;
    const initialX = field.x;
    const initialY = field.y;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      const moveTouch = moveEvent.touches[0];
      const deltaXPercent = ((moveTouch.clientX - startClientX) / rect.width) * 100;
      const deltaYPercent = ((moveTouch.clientY - startClientY) / rect.height) * 100;

      const newX = Math.round(Math.max(0, Math.min(100 - field.width, initialX + deltaXPercent)) * 10) / 10;
      const newY = Math.round(Math.max(0, Math.min(100 - field.height, initialY + deltaYPercent)) * 10) / 10;

      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, x: newX, y: newY } : f))
      );
    };

    const handleTouchEnd = () => {
      setDraggedFieldId(null);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Resize handler for bottom-right corner anchor
  const handleResizeMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    setResizingFieldId(fieldId);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialWidth = field.width;
    const initialHeight = field.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaWPercent = ((moveEvent.clientX - startClientX) / rect.width) * 100;
      const deltaHPercent = ((moveEvent.clientY - startClientY) / rect.height) * 100;

      const newWidth = Math.round(Math.max(6, Math.min(100 - field.x, initialWidth + deltaWPercent)) * 10) / 10;
      const newHeight = Math.round(Math.max(2.5, Math.min(100 - field.y, initialHeight + deltaHPercent)) * 10) / 10;

      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, width: newWidth, height: newHeight } : f))
      );
    };

    const handleMouseUp = () => {
      setResizingFieldId(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Canvas click to drop field when "Click to Place" mode is active
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!clickToPlaceType || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    handleAddField(clickToPlaceType, clickXPercent - 10, clickYPercent - 2);
  };

  // Drag and Drop from toolbar directly onto canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const fieldType = e.dataTransfer.getData('text/plain') as FieldType;
    if (!fieldType) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = ((e.clientX - rect.left) / rect.width) * 100;
    const dropY = ((e.clientY - rect.top) / rect.height) * 100;

    handleAddField(fieldType, dropX - 10, dropY - 2);
  };

  // Run Test Fill live preview
  const handleRunTestPreview = async () => {
    setIsLoadingPreview(true);
    setErrorMsg('');
    try {
      const dummyTemplate: FormTemplate = {
        id: existingForm?.id || 'temp-test',
        formName: formName || 'Untitled Form',
        formCode: formCode || 'UF',
        description,
        companyScope,
        companyIds: selectedCompanyIds,
        departmentId,
        category,
        currentVersion: existingForm?.currentVersion || 1,
        effectiveDate: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        instructions,
        pdfTemplateUrl,
        pdfPageCount: pdfPageCount || 1,
        docxHtmlContent,
        sourceDocumentName: pdfFileName,
        fields,
        numberingRuleId,
        versions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Admin',
      };

      const res = await api.testPreviewPdf(dummyTemplate, testFillValues);
      setPreviewPdfBase64(res.pdfBase64);
    } catch (err: any) {
      setErrorMsg(`Failed to generate test preview: ${err.message}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Save / Publish
  const handleSaveForm = async (publishImmediately: boolean) => {
    if (!formName.trim()) {
      setErrorMsg('Form Name is required.');
      return;
    }
    if (!formCode.trim()) {
      setErrorMsg('Form Code is required (e.g. LF, SAF, BHF).');
      return;
    }

    setIsPublishing(true);
    setErrorMsg('');

    try {
      let savedForm: FormTemplate;

      if (existingForm) {
        savedForm = await api.updateForm(existingForm.id, {
          formName,
          formCode: formCode.toUpperCase(),
          description,
          departmentId,
          category,
          companyScope,
          companyIds: selectedCompanyIds,
          instructions,
          pdfTemplateUrl,
          pdfPageCount: pdfPageCount || 1,
          docxHtmlContent,
          sourceDocumentName: pdfFileName,
          fields,
          numberingRuleId,
          changelog: `Form updated. Fields count: ${fields.length}`,
        });
      } else {
        savedForm = await api.createForm({
          formName,
          formCode: formCode.toUpperCase(),
          description,
          departmentId,
          category,
          companyScope,
          companyIds: selectedCompanyIds,
          instructions,
          pdfTemplateUrl,
          pdfPageCount: pdfPageCount || 1,
          docxHtmlContent,
          sourceDocumentName: pdfFileName,
          fields,
          numberingRuleId,
        });
      }

      if (publishImmediately) {
        const pubResult = await api.publishForm(savedForm.id);
        savedForm = pubResult.form;
      }

      onSaveSuccess(savedForm);
    } catch (err: any) {
      setErrorMsg(`Save failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-700">
              FORM BUILDER ENGINE
            </span>
            {existingForm && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                Version {existingForm.currentVersion} • {existingForm.status}
              </span>
            )}
            {uploadedDocumentType === 'pdf' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <FileText className="w-3 h-3" /> PDF Background
              </span>
            )}
            {uploadedDocumentType === 'docx' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-indigo-100 text-indigo-800 flex items-center gap-1">
                <FileType className="w-3 h-3" /> Word Document (.docx)
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {existingForm ? `Edit Form: ${existingForm.formName}` : 'Design & Map Company Form Template'}
          </h2>
          <p className="text-xs text-slate-500">
            Upload custom PDF or Word documents, visually drag and position field anchors, bind numbering rules, and publish.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSaveForm(false)}
            disabled={isPublishing}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>
          <button
            onClick={() => handleSaveForm(true)}
            disabled={isPublishing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Publish Template</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 font-bold hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 font-bold hover:text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {/* Step Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200">
        <button
          onClick={() => setActiveStep('SETTINGS')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeStep === 'SETTINGS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
            1
          </span>
          <span>Form Properties & Template Source</span>
        </button>

        <button
          onClick={() => setActiveStep('MAPPER')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeStep === 'MAPPER'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
            2
          </span>
          <span>Visual Document Field Mapper</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold ml-1">
            {fields.length} Fields
          </span>
        </button>

        <button
          onClick={() => setActiveStep('TEST')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeStep === 'TEST'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
            3
          </span>
          <span>Test Fill & PDF Validation</span>
        </button>
      </div>

      {/* STEP 1: GENERAL SETTINGS & DOCUMENT UPLOAD */}
      {activeStep === 'SETTINGS' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Form Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Staff Salary & Employment Certificate"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Form Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SEC, LF, SAF"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Short abbreviation for numbering</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="HR Forms">HR Forms</option>
                    <option value="Fleet Operations">Fleet Operations</option>
                    <option value="Rider & Driver">Rider & Driver</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Safety & Compliance">Safety & Compliance</option>
                    <option value="Legal & Administration">Legal & Administration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sequential Numbering Rule
                </label>
                <select
                  value={numberingRuleId}
                  onChange={(e) => setNumberingRuleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {numberingRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name} [{rule.pattern}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Official use case, purpose, and distribution guidelines..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions for End-User
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions displayed when filling this document..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Scope</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={companyScope === 'ALL'}
                      onChange={() => setCompanyScope('ALL')}
                      name="companyScope"
                      className="text-blue-600"
                    />
                    <span>All Group Entities</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={companyScope === 'SPECIFIC'}
                      onChange={() => setCompanyScope('SPECIFIC')}
                      name="companyScope"
                      className="text-blue-600"
                    />
                    <span>Specific Operating Entities</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Template Document Section (PDF, DOCX, DOC) */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-xs text-slate-900">
                    Template Source Document (PDF or Word DOCX/DOC)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Upload your custom blank form, official letterhead, or certificate. It will render in high-resolution directly on the visual mapper.
                  </p>
                </div>
              </div>

              {pdfFileName && (
                <button
                  type="button"
                  onClick={handleClearTemplate}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Template</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs">
                <Upload className="w-4 h-4" />
                <span>Select PDF or Word File</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>

              {isRenderingDocument && (
                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing & rendering document layers...</span>
                </div>
              )}

              {pdfFileName && !isRenderingDocument && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Loaded: <strong className="font-bold">{pdfFileName}</strong>
                    {uploadedDocumentType === 'pdf' ? ` (${pdfPageCount} page${pdfPageCount > 1 ? 's' : ''})` : ' (Word Document)'}
                  </span>
                </div>
              )}

              {!pdfFileName && !isRenderingDocument && (
                <span className="text-xs text-slate-400 italic">
                  Optional: If no file is uploaded, the system synthesizes an official corporate layout automatically.
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setActiveStep('MAPPER')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Continue to Visual Field Mapping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: VISUAL DOCUMENT FIELD MAPPER */}
      {activeStep === 'MAPPER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Toolbar: Field Types */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Field Toolbar</span>
                <span className="text-[10px] text-blue-600 font-medium lowercase">drag or click</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Drag any tool onto the document sheet, or click to add.
              </p>
            </div>

            {/* Click-to-place banner if active */}
            {clickToPlaceType && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-blue-600" />
                  <span>Click anywhere on the document to place <strong>{clickToPlaceType}</strong></span>
                </div>
                <button
                  onClick={() => setClickToPlaceType(null)}
                  className="text-blue-600 hover:text-blue-900 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {['Input', 'Auth', 'Security', 'System', 'Attachment'].map((cat) => {
                const items = FIELD_TOOLBAR_ITEMS.filter((i) => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                      {cat} Tools
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {items.map((item) => (
                        <button
                          key={item.type}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.type);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => handleAddField(item.type)}
                          title={`Click or drag to place ${item.label}`}
                          className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 text-left transition-all text-xs font-medium text-slate-700 group cursor-grab active:cursor-grabbing"
                        >
                          <span className="w-5 h-5 rounded-sm bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-[11px] font-bold text-slate-600 group-hover:text-blue-700 shrink-0">
                            {item.icon}
                          </span>
                          <span className="truncate text-[11px]">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Placed Fields list */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Fields ({fields.length})
                </span>
                {fields.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all mapped fields on this document?')) setFields([]);
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                      selectedFieldId === f.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] opacity-70">
                        {FIELD_TOOLBAR_ITEMS.find((item) => item.type === f.type)?.icon || '▪'}
                      </span>
                      <span className="truncate">{f.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] opacity-75 font-mono">
                        {Math.round(f.x)}%,{Math.round(f.y)}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedField(f.id);
                        }}
                        className="p-1 hover:text-rose-300"
                        title="Delete field"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="p-3 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg">
                    No fields placed yet. Click any tool above to add.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: Visual Canvas Sheet */}
          <div className="lg:col-span-6 bg-slate-100 border border-slate-300 rounded-xl p-4 flex flex-col items-center justify-start overflow-auto min-h-[640px]">
            {/* Canvas Header Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 text-xs text-slate-600 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  {uploadedDocumentType === 'pdf'
                    ? 'PDF Document Canvas'
                    : uploadedDocumentType === 'docx'
                    ? 'Word Document Canvas'
                    : 'A4 Document Canvas'}
                </span>
                {pdfFileName && (
                  <span className="text-[11px] font-medium text-slate-500 truncate max-w-[180px]">
                    ({pdfFileName})
                  </span>
                )}
              </div>

              {/* Multi-page navigation for PDF */}
              {pdfPageCount > 1 && uploadedDocumentType === 'pdf' && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs shadow-2xs">
                  <button
                    disabled={currentPreviewPage <= 1}
                    onClick={() => handlePageChange(currentPreviewPage - 1)}
                    className="p-0.5 text-slate-600 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-[11px]">
                    Page {currentPreviewPage} of {pdfPageCount}
                  </span>
                  <button
                    disabled={currentPreviewPage >= pdfPageCount}
                    onClick={() => handlePageChange(currentPreviewPage + 1)}
                    className="p-0.5 text-slate-600 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action buttons: Replace or Clear */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md cursor-pointer font-semibold transition-colors flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>{pdfFileName ? 'Replace File' : 'Upload PDF/Docx'}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>

                {pdfFileName && (
                  <button
                    onClick={handleClearTemplate}
                    title="Remove template background and use clean corporate layout"
                    className="text-[11px] text-slate-500 hover:text-rose-600 px-1.5 py-1"
                  >
                    Clear BG
                  </button>
                )}
              </div>
            </div>

            {/* Hint bar */}
            <div className="w-full flex items-center justify-between text-[11px] text-slate-500 mb-2 px-1">
              <span>Drag move anchor <GripVertical className="w-3 h-3 inline text-slate-400" /> to position anywhere • Drag corner handle to resize</span>
              <span className="font-mono text-[10px]">A4 Aspect Ratio (1 : 1.414)</span>
            </div>

            {/* Interactive A4 Document Page */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              className={`relative w-full max-w-[540px] aspect-[1/1.414] bg-white rounded-sm shadow-xl border border-slate-300 select-none overflow-hidden transition-all ${
                clickToPlaceType ? 'cursor-crosshair ring-2 ring-blue-500' : ''
              }`}
              style={{
                backgroundImage:
                  !pdfPageImage && !docxHtmlContent
                    ? 'radial-gradient(#cbd5e1 1px, transparent 1px)'
                    : undefined,
                backgroundSize: !pdfPageImage && !docxHtmlContent ? '20px 20px' : undefined,
              }}
            >
              {/* 1. If PDF: High-Resolution Rendered PDF Page Background */}
              {uploadedDocumentType === 'pdf' && pdfPageImage && (
                <img
                  src={pdfPageImage}
                  alt={`Template Page ${currentPreviewPage}`}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
                />
              )}

              {/* 2. If DOCX: Formatted Word Document Content Background */}
              {uploadedDocumentType === 'docx' && docxHtmlContent && (
                <div
                  className="absolute inset-0 w-full h-full p-6 overflow-y-auto pointer-events-none select-none z-0 text-slate-800 text-[11px] leading-relaxed bg-white prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: docxHtmlContent }}
                />
              )}

              {/* 3. If No File Uploaded: Standard Synthesized Corporate Header & Watermark */}
              {!pdfPageImage && !docxHtmlContent && (
                <>
                  <div className="p-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-bold text-blue-900 tracking-wider">
                        GULF WAY ENTERPRISE DOCUMENT
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {formName || 'FORM TITLE'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-slate-400">
                        {formCode ? `CODE: ${formCode}` : 'CODE: DOC'}
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-[8px] text-slate-400 border-t border-slate-200 pt-1.5 flex justify-between">
                    <span>Tamper-evident QR & Digital Signature Zone</span>
                    <span>Page {currentPreviewPage} of {pdfPageCount}</span>
                  </div>
                </>
              )}

              {/* Loading overlay if rendering */}
              {isRenderingDocument && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs z-30 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-blue-700">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span>Rendering document background...</span>
                </div>
              )}

              {/* RENDER PLACED FIELDS OVERLAY */}
              {fields
                .filter((f) => f.pageNumber === currentPreviewPage)
                .map((field) => {
                  const isSelected = selectedFieldId === field.id;
                  const isDragging = draggedFieldId === field.id;
                  const isResizing = resizingFieldId === field.id;

                  return (
                    <div
                      key={field.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFieldId(field.id);
                      }}
                      onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                      onTouchStart={(e) => handleFieldTouchStart(e, field.id)}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}%`,
                        height: `${field.height}%`,
                      }}
                      className={`absolute rounded-sm flex items-center justify-between px-1.5 transition-shadow select-none group ${
                        isSelected
                          ? 'bg-blue-500/30 border-2 border-blue-600 ring-2 ring-blue-500/40 text-blue-950 font-bold z-20 shadow-md'
                          : field.type === 'signature'
                          ? 'bg-amber-500/25 border border-amber-600 text-amber-950'
                          : field.type === 'company_stamp'
                          ? 'bg-emerald-500/25 border border-emerald-600 text-emerald-950'
                          : field.type === 'document_number'
                          ? 'bg-indigo-500/30 border border-indigo-600 text-indigo-950 font-bold'
                          : field.type === 'qr_code'
                          ? 'bg-purple-500/25 border border-purple-600 text-purple-950'
                          : 'bg-white/90 backdrop-blur-2xs border border-slate-400 text-slate-800 shadow-2xs hover:border-blue-400'
                      }`}
                    >
                      {/* Left: Move Anchor Grip */}
                      <div
                        className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-blue-700 bg-white/80 rounded-xs mr-1 shrink-0"
                        title="Click and drag to move anywhere on the sheet"
                      >
                        <GripVertical className="w-3 h-3" />
                      </div>

                      {/* Center: Field Label */}
                      <span className="truncate text-[9px] font-semibold leading-tight flex-1">
                        {field.label}
                      </span>

                      {/* Right: Quick actions or coordinates */}
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {isSelected && (
                          <span className="text-[8px] font-mono bg-blue-700 text-white px-1 py-0.2 rounded-xs">
                            {Math.round(field.x)}%,{Math.round(field.y)}%
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedField(field.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                          title="Delete field"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Bottom-Right: Resize Anchor Handle */}
                      {isSelected && (
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, field.id)}
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-xs z-30"
                          title="Drag to resize field width and height"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Inspector: Configure Selected Field */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Field Inspector
              </h3>
              {selectedField && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                  {selectedField.type}
                </span>
              )}
            </div>

            {selectedField ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Field Label (Displayed)
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateSelectedField({ label: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-medium text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Variable Key Name
                  </label>
                  <input
                    type="text"
                    value={selectedField.name}
                    onChange={(e) => updateSelectedField({ name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Used for database and PDF template mapping</span>
                </div>

                {/* Precision Positioning & Coordinate Controls */}
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Coordinates & Size (%)
                    </span>
                    <span className="text-[10px] text-slate-400">0% - 100%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                        <span>X Pos:</span>
                        <span className="font-mono text-blue-600">{selectedField.x}%</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={selectedField.x}
                        onChange={(e) => updateSelectedField({ x: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                        <span>Y Pos:</span>
                        <span className="font-mono text-blue-600">{selectedField.y}%</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={selectedField.y}
                        onChange={(e) => updateSelectedField({ y: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                        <span>Width:</span>
                        <span className="font-mono text-blue-600">{selectedField.width}%</span>
                      </div>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        step={0.5}
                        value={selectedField.width}
                        onChange={(e) => updateSelectedField({ width: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                        <span>Height:</span>
                        <span className="font-mono text-blue-600">{selectedField.height}%</span>
                      </div>
                      <input
                        type="number"
                        min={2}
                        max={30}
                        step={0.5}
                        value={selectedField.height}
                        onChange={(e) => updateSelectedField({ height: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Directional Nudge Buttons */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Nudge Position (0.5%)
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          updateSelectedField({
                            x: Math.round(Math.max(0, selectedField.x - 0.5) * 10) / 10,
                          })
                        }
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700"
                        title="Nudge Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          updateSelectedField({
                            y: Math.round(Math.max(0, selectedField.y - 0.5) * 10) / 10,
                          })
                        }
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700"
                        title="Nudge Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          updateSelectedField({
                            y: Math.round(
                              Math.min(100 - selectedField.height, selectedField.y + 0.5) * 10
                            ) / 10,
                          })
                        }
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700"
                        title="Nudge Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          updateSelectedField({
                            x: Math.round(
                              Math.min(100 - selectedField.width, selectedField.x + 0.5) * 10
                            ) / 10,
                          })
                        }
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700"
                        title="Nudge Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preset Quick Alignments */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Quick Alignment
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        onClick={() => updateSelectedField({ x: 8, width: 40 })}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 text-center"
                      >
                        Left Half (8%)
                      </button>
                      <button
                        onClick={() => updateSelectedField({ x: 52, width: 40 })}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 text-center"
                      >
                        Right Half (52%)
                      </button>
                      <button
                        onClick={() => updateSelectedField({ x: 8, width: 84 })}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 text-center col-span-2"
                      >
                        Full Width (84%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dropdown Options */}
                {selectedField.type === 'dropdown' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Dropdown Options (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(selectedField.options || []).join(', ')}
                      onChange={(e) =>
                        updateSelectedField({
                          options: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                )}

                {/* Signature Role Configuration */}
                {selectedField.type === 'signature' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Signer Authority Role
                    </label>
                    <select
                      value={selectedField.signerRole || 'USER'}
                      onChange={(e) => updateSelectedField({ signerRole: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    >
                      <option value="USER">Applicant / Employee</option>
                      <option value="APPROVER">HR Manager / Operations Supervisor</option>
                      <option value="SUPER_ADMIN">Managing Director / Legal Counsel</option>
                    </select>
                  </div>
                )}

                {/* Flags */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedField.required}
                      onChange={(e) => updateSelectedField({ required: e.target.checked })}
                      className="rounded-sm text-blue-600"
                    />
                    <span className="font-semibold text-slate-700 text-xs">
                      Mandatory / Required Field
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedField.editable}
                      onChange={(e) => updateSelectedField({ editable: e.target.checked })}
                      className="rounded-sm text-blue-600"
                    />
                    <span className="text-slate-700 text-xs">Editable during form filling</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => removeSelectedField(selectedField.id)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Field from Template</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <MousePointer className="w-8 h-8 mx-auto text-slate-300" />
                <p>Click any field on the document sheet or toolbar to configure its coordinates and rules.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: LIVE TEST-FILL & PDF VALIDATION */}
      {activeStep === 'TEST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span>Test Form Live Data-Entry</span>
              </h3>
              <p className="text-xs text-slate-500">
                Enter simulated sample data to verify that all field coordinates, font sizes, QR codes, and wet seals render in exact alignment.
              </p>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {fields
                .filter(
                  (f) =>
                    f.type !== 'document_number' &&
                    f.type !== 'qr_code' &&
                    f.type !== 'company_stamp'
                )
                .map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        value={testFillValues[field.name] || ''}
                        onChange={(e) =>
                          setTestFillValues({ ...testFillValues, [field.name]: e.target.value })
                        }
                        placeholder={field.placeholder || `Sample ${field.label}...`}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                      />
                    ) : field.type === 'dropdown' ? (
                      <select
                        value={testFillValues[field.name] || ''}
                        onChange={(e) =>
                          setTestFillValues({ ...testFillValues, [field.name]: e.target.value })
                        }
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                      >
                        <option value="">Select option...</option>
                        {(field.options || ['Sample Option 1', 'Sample Option 2']).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={testFillValues[field.name] || ''}
                        onChange={(e) =>
                          setTestFillValues({ ...testFillValues, [field.name]: e.target.value })
                        }
                        placeholder={field.placeholder || `Sample ${field.label}`}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                      />
                    )}
                  </div>
                ))}
            </div>

            <button
              onClick={handleRunTestPreview}
              disabled={isLoadingPreview}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoadingPreview ? 'Synthesizing PDF...' : 'Re-render Test PDF Preview'}</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[520px]">
            {previewPdfBase64 ? (
              <iframe
                src={previewPdfBase64}
                className="w-full h-[540px] rounded-lg border border-slate-300 shadow-sm"
                title="Live PDF Preview"
              />
            ) : (
              <div className="text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <p>
                  {isLoadingPreview
                    ? 'Synthesizing test PDF preview...'
                    : 'Click "Re-render Test PDF Preview" to inspect the rendered coordinates and layout.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
