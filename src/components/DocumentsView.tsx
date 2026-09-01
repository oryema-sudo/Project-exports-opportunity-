import React, { useState } from 'react';
import { DocumentRecord, DocumentType } from '../types';
import { AppState, appStore } from '../services/store';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck,
  Building,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';

interface DocumentsViewProps {
  state: AppState;
  searchQuery: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  state,
  searchQuery
}) => {
  const { documents, currentUser } = state;
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Upload Form State
  const [docType, setDocType] = useState<DocumentType>('Farmer Consent / Due-Diligence Agreement');
  const [fileName, setFileName] = useState<string>('Farmer_Consent_Form_Masaka_2026.pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [entityType, setEntityType] = useState<'Farmer' | 'Farm' | 'Delivery' | 'Lot' | 'Shipment'>('Farmer');
  const [entityId, setEntityId] = useState<string>('FARMER-UG-001');
  const [notes, setNotes] = useState<string>('Verified and signed by producer and local council LC1 representative.');

  const filteredDocs = documents.filter(d => {
    if (filterType !== 'ALL' && d.type !== filterType) return false;
    if (filterStatus !== 'ALL' && d.verificationStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.fileName.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.relatedEntityId.toLowerCase().includes(q) ||
        d.uploadedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      if (selectedFile) {
        await appStore.uploadDocumentFile(selectedFile, {
          type: docType,
          relatedEntityType: entityType,
          relatedEntityId: entityId,
          notes
        });
      } else {
        await appStore.addDocument({
          type: docType,
          fileName,
          fileSize: '1.8 MB',
          fileUrl: '#verified-attachment',
          relatedEntityType: entityType,
          relatedEntityId: entityId,
          verificationStatus: 'Verified',
          notes
        });
      }
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleVerify = (doc: DocumentRecord) => {
    const nextStatus = doc.verificationStatus === 'Verified' ? 'Pending Review' : 'Verified';
    appStore.updateDocument({ ...doc, verificationStatus: nextStatus });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-stone-200 rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            Due-Diligence & Document Evidence Repository
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Indexed archive of farmer consent agreements, customary land records, UCDA quality certificates, and phyto inspections.
          </p>
        </div>

        {currentUser.role !== 'viewer' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Evidence File
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-lg text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" /> Filter:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 max-w-xs truncate text-xs"
            >
              <option value="ALL">All Document Types ({documents.length})</option>
              <option value="Farmer Consent / Due-Diligence Agreement">Farmer Consent Agreements</option>
              <option value="Land / Production Evidence (Customary / Title)">Land / Production Evidence</option>
              <option value="UCDA Quality / Grade Inspection Certificate">UCDA Inspection Certificates</option>
              <option value="Phytosanitary Certificate">Phytosanitary Certificates</option>
              <option value="Purchase Record / Weighbridge Ticket">Purchase Weighbridge Tickets</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="text-stone-500 font-mono text-xs">
          {filteredDocs.length} evidence file(s) indexed
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => {
          const isVerified = doc.verificationStatus === 'Verified';

          return (
            <div
              key={doc.id}
              className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-stone-400 font-bold">{doc.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${
                    isVerified ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {doc.verificationStatus}
                  </span>
                </div>

                <h3 className="font-bold text-xs text-stone-900 line-clamp-1">{doc.fileName}</h3>
                <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">{doc.type}</div>

                <div className="mt-3 text-xs bg-stone-50 p-2 rounded border border-stone-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Related Entity:</span>
                    <strong className="text-stone-800 font-mono">{doc.relatedEntityType}: {doc.relatedEntityId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">File Size:</span>
                    <span className="font-mono text-stone-700">{doc.fileSize}</span>
                  </div>
                  {doc.notes && (
                    <div className="text-[11px] text-stone-600 pt-1 border-t border-stone-200">
                      {doc.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-stone-400 font-mono">
                  {doc.uploadDate} by {doc.uploadedBy}
                </span>

                {currentUser.role !== 'viewer' && (
                  <button
                    onClick={() => handleToggleVerify(doc)}
                    className="text-emerald-800 hover:text-emerald-700 font-bold text-xs"
                  >
                    {isVerified ? 'Mark Pending' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">Upload Supporting Evidence Document</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                >
                  <option value="Farmer Consent / Due-Diligence Agreement">Farmer Consent / Due-Diligence Agreement</option>
                  <option value="Land / Production Evidence (Customary / Title)">Land / Production Evidence (Customary / Title)</option>
                  <option value="Purchase Record / Weighbridge Ticket">Purchase Record / Weighbridge Ticket</option>
                  <option value="Washing / Processing / Hulling Record">Washing / Processing / Hulling Record</option>
                  <option value="UCDA Quality / Grade Inspection Certificate">UCDA Quality / Grade Inspection Certificate</option>
                  <option value="Phytosanitary Certificate">Phytosanitary Certificate</option>
                  <option value="Export Certificate of Origin">Export Certificate of Origin</option>
                  <option value="Other Evidence">Other Evidence</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Select File (PDF, Images, CSV, GeoJSON)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Document Display Title / File Name</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Target Entity Type</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as any)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="Farm">Farm Plot</option>
                    <option value="Delivery">Intake Delivery</option>
                    <option value="Lot">Coffee Lot</option>
                    <option value="Shipment">Shipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Entity Identifier</label>
                  <input
                    type="text"
                    required
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="e.g. FARMER-UG-001"
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Verification Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
