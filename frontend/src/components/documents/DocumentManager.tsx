import { FC, useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/common';
import { documentService, CustomerDocument } from '@/services/documentService';

export interface DocumentManagerProps {
  customerId: string;
  stepId?: string;
  filterTypes?: string[]; // Optional filter to show specific document slots
  onDocumentChange?: () => void;
}

const REQUIRED_DOCUMENTS = [
  { type: 'gst_certificate', label: 'GSTIN Registration Certificate', req: 'Required for Importers/Exporters' },
  { type: 'iec_certificate', label: 'DGFT Import Export Code (IEC)', req: 'Required for Customs EDI' },
  { type: 'pan_card', label: 'Company / Proprietor PAN Card', req: 'Required for PAN Verification' },
  { type: 'power_of_attorney', label: 'Customs Power of Attorney (PoA)', req: 'Stamped & Executed Authorization' },
  { type: 'cancelled_cheque', label: 'Bank Account Cancelled Cheque', req: 'Required for AD Code Registration' },
  { type: 'address_proof', label: 'Registered Office Address Proof', req: 'Utility Bill / Lease Agreement' },
];

export const DocumentManager: FC<DocumentManagerProps> = ({
  customerId,
  stepId,
  filterTypes,
  onDocumentChange,
}) => {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await documentService.listCustomerDocuments(customerId);
      if (res.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleTriggerUpload = (docType: string) => {
    setActiveUploadType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeUploadType) return;
    const file = files[0];

    setUploadingType(activeUploadType);
    try {
      await documentService.uploadDocument(customerId, activeUploadType, file, stepId);
      window.dispatchEvent(new Event('portflow_data_changed'));
      await fetchDocuments();
      if (onDocumentChange) onDocumentChange();
    } catch {
      // Handled gracefully
    } finally {
      setUploadingType(null);
      setActiveUploadType(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      await documentService.deleteDocument(docId);
      window.dispatchEvent(new Event('portflow_data_changed'));
      await fetchDocuments();
      if (onDocumentChange) onDocumentChange();
    } catch {
      // Handled gracefully
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (docId: string) => {
    const url = documentService.getDownloadUrl(docId);
    window.open(url, '_blank');
  };

  const visibleDocs = filterTypes
    ? REQUIRED_DOCUMENTS.filter((d) => filterTypes.includes(d.type))
    : REQUIRED_DOCUMENTS;

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {loading ? (
        <div className="p-6 text-center text-xs text-gray-500">Loading document vault...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleDocs.map((docSlot) => {
            const uploadedDoc = documents.find((d) => d.document_type === docSlot.type);
            const isUploading = uploadingType === docSlot.type;

            return (
              <div
                key={docSlot.type}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  uploadedDoc
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-gray-50/60 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    <FileText
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        uploadedDoc ? 'text-emerald-600' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{docSlot.label}</h5>
                      <p className="text-[11px] text-gray-500 mt-0.5">{docSlot.req}</p>
                    </div>
                  </div>

                  {uploadedDoc ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <AlertCircle className="w-3 h-3 mr-1" /> Pending
                    </span>
                  )}
                </div>

                {/* Uploaded File Info or Upload Button */}
                {uploadedDoc ? (
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-100 text-xs">
                    <div className="truncate max-w-[180px]">
                      <span className="font-semibold text-gray-900 block truncate">{uploadedDoc.filename}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {roundSize(uploadedDoc.file_size)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(uploadedDoc.id)}
                        title="Download / View Document"
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 text-brand-600" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTriggerUpload(docSlot.type)}
                        title="Replace Document File"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                        isLoading={isUploading}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(uploadedDoc.id)}
                        title="Delete Document"
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        isLoading={deletingId === uploadedDoc.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriggerUpload(docSlot.type)}
                      isLoading={isUploading}
                      className="text-xs py-1"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload Document
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function roundSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
