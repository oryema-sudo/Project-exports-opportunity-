import React, { useState } from 'react';
import { appStore, CsvImportPreview } from '../services/store';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  X, 
  Download, 
  Play,
  Compass
} from 'lucide-react';

interface BulkImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV = `fullName,nationalId,phoneNumber,district,subcounty,village,cooperativeMembership,farmName,latitude,longitude,plotArea,geometryType
Kalyango Patrick,CM820941829MAS,+256701234567,Masaka,Kyanamukaka,Buyaga,Kyanamukaka Coffee Farmers Society,Buyaga Hill Shamba,-0.3412,31.7391,2.8,Polygon
Nassali Florence,CF840192831LUW,+256782345678,Luweero,Wobulenzi,Katikamu,Wobulenzi Coffee Growers,Katikamu Robusta Plot,0.7231,32.5312,1.9,Polygon
Mugisha Ronald,CM790182739BUS,+256773456789,Bushenyi,Kyamuhunga,Swazi,Igara Tea & Coffee Coop,Swazi Valley Farm,-0.5421,30.1298,3.4,Polygon
Wamala Denis,CM910283748MBA,+256754567890,Mbale,Wanale,Bufumbo,Bugisu Cooperative Union,Wanale Arabica Terrace,1.0821,34.2189,2.2,Polygon
Bwambale Eric,CM880192837KAS,+256705678901,Kasese,Kisinga,Kagando,Bukonzo Organic Farmers,Kagando Escarpment Plot,0.1245,30.0123,1.7,Polygon`;

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importCompleted, setImportCompleted] = useState<boolean>(false);

  const handleParse = (textToParse: string) => {
    const res = appStore.parseAndValidateCsv(textToParse);
    setPreview(res);
    setImportCompleted(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setCsvContent(SAMPLE_CSV);
    handleParse(SAMPLE_CSV);
  };

  const handleExecuteImport = () => {
    if (!preview || preview.validRows.length === 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      appStore.importBulkFarmersAndFarms(preview.validRows);
      setIsProcessing(false);
      setImportCompleted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    }, 400);
  };

  const handleDownloadTemplate = () => {
    const element = document.createElement("a");
    const file = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = "Uganda_Coffee_Farmer_Plot_Template.csv";
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 border border-stone-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="font-bold text-base text-stone-900">Bulk Farmer & Farm Plot CSV Onboarding</h2>
              <p className="text-[11px] text-stone-500">Fast batch ingestion with automated Uganda GPS & NIN validation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload & Sample Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded border border-stone-200">
          <div>
            <label className="block text-stone-700 font-semibold mb-1.5 flex items-center gap-1">
              <UploadCloud className="w-4 h-4 text-emerald-700" />
              Upload .CSV File
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-stone-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-stone-300 file:text-xs file:font-semibold file:bg-white file:text-stone-700 hover:file:bg-stone-100 cursor-pointer"
            />
          </div>

          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-stone-100 text-stone-700 font-semibold px-2.5 py-1.5 rounded border border-stone-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Load Sample Data
            </button>
          </div>
        </div>

        {/* Raw CSV Text Area */}
        <div>
          <label className="block text-stone-700 font-semibold mb-1">
            Or Paste Raw CSV Data (with header row):
          </label>
          <textarea
            rows={4}
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              handleParse(e.target.value);
            }}
            placeholder="fullName,nationalId,phoneNumber,district,subcounty,village,farmName,latitude,longitude,plotArea,geometryType..."
            className="w-full bg-stone-50 border border-stone-300 rounded p-2 font-mono text-[11px] text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          ></textarea>
        </div>

        {/* Validation & Preview Panel */}
        {preview && (
          <div className="space-y-3 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Pre-Import Validation Summary
              </span>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {preview.validRows.length} Valid
                </span>
                {preview.invalidRows.length > 0 && (
                  <span className="text-red-700 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> {preview.invalidRows.length} Errors
                  </span>
                )}
              </div>
            </div>

            {/* Validation Errors If Any */}
            {preview.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 space-y-1 text-[11px]">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Data Format Issues Detected:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 font-mono">
                  {preview.errors.slice(0, 4).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 font-bold text-stone-600">
                    <th className="p-1.5">Farmer Name</th>
                    <th className="p-1.5">District</th>
                    <th className="p-1.5">Farm / Plot</th>
                    <th className="p-1.5">Coordinates</th>
                    <th className="p-1.5">Area (Ha)</th>
                    <th className="p-1.5">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {preview.validRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-1.5 font-bold text-stone-900">{r.fullName}</td>
                      <td className="p-1.5 text-stone-600">{r.district}</td>
                      <td className="p-1.5 text-stone-700">{r.farmName}</td>
                      <td className="p-1.5 font-mono text-[10px]">{r.latitude.toFixed(4)}°, {r.longitude.toFixed(4)}°</td>
                      <td className="p-1.5 font-mono font-bold">{r.plotArea}</td>
                      <td className="p-1.5">
                        <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          ✓ Valid
                        </span>
                      </td>
                    </tr>
                  ))}
                  {preview.invalidRows.map((r, idx) => (
                    <tr key={`inv-${idx}`} className="bg-red-50/50">
                      <td className="p-1.5 font-bold text-red-900">{r.fullName || 'Missing Name'}</td>
                      <td className="p-1.5 text-red-700">{r.district}</td>
                      <td className="p-1.5 text-red-700">{r.farmName}</td>
                      <td className="p-1.5 font-mono text-[10px] text-red-600">{r.latitude}, {r.longitude}</td>
                      <td className="p-1.5 text-red-600">{r.plotArea}</td>
                      <td className="p-1.5">
                        <span className="text-red-800 bg-red-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          {r.error}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div className="text-[11px] text-stone-500">
            {importCompleted ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Import committed successfully!
              </span>
            ) : (
              <span>Automated GNSS bounding box check enabled.</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!preview || preview.validRows.length === 0 || isProcessing}
              onClick={handleExecuteImport}
              className="px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-colors flex items-center gap-1.5"
            >
              {isProcessing ? 'Importing...' : `Import ${preview?.validRows.length || 0} Records`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
