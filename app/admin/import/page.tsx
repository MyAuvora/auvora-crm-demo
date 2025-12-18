'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
}

interface ImportResult {
  job_id: string;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

function ImportPageContent() {
  const searchParams = useSearchParams();
  const preselectedTenant = searchParams.get('tenant');
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>(preselectedTenant || '');
  const [dataType, setDataType] = useState<string>('members');
  const [sourceCrm, setSourceCrm] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const response = await fetch('/api/admin/tenants');
      const data = await response.json();
      if (data.tenants) {
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    }
  }

  async function handleImport() {
    if (!selectedTenant || !file) {
      setError('Please select a tenant and upload a file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', selectedTenant);
      formData.append('data_type', dataType);
      formData.append('source_crm', sourceCrm);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
        <p className="text-gray-600 mt-1">Import data from CSV files into tenant accounts</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Import Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Tenant *</label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
              >
                <option value="">Choose a tenant...</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Type *</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
              >
                <option value="members">Members</option>
                <option value="leads">Leads</option>
                <option value="staff">Staff</option>
                <option value="classes">Classes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source CRM</label>
              <select
                value={sourceCrm}
                onChange={(e) => setSourceCrm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
              >
                <option value="">Generic CSV</option>
                <option value="mindbody">Mindbody</option>
                <option value="clubready">ClubReady</option>
                <option value="zenplanner">Zen Planner</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSV File *</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-auvora-teal transition-colors">
                <div className="space-y-1 text-center">
                  {file ? (
                    <>
                      <FileText className="mx-auto h-12 w-12 text-auvora-teal" />
                      <p className="text-sm text-gray-900 font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-auvora-teal hover:text-auvora-teal-dark">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </>
                  )}
                </div>
              </div>
              {file && (
                <button
                  onClick={() => setFile(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove file
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <XCircle size={18} />
                {error}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={loading || !selectedTenant || !file}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Start Import
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">CSV Format Guide</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Members</h3>
                  <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                    name, email, phone, membership_type, status, join_date
                  </code>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Leads</h3>
                  <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                    name, email, phone, source, status, notes
                  </code>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Staff</h3>
                  <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                    name, email, phone, role, hourly_rate, hire_date
                  </code>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Classes</h3>
                  <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                    name, description, day_of_week, time, duration, capacity, location
                  </code>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-start gap-2">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Note:</strong> Column headers are flexible. The system will try to match common variations (e.g., "full_name", "first_name + last_name", "email_address").
                </div>
              </div>
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Import Results</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{result.total}</div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                    <div className="text-sm text-gray-600">Imported</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {result.imported > 0 && (
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle size={20} />
                    <span>Successfully imported {result.imported} records</span>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Errors</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {result.errors.map((err, index) => (
                        <div key={index} className="text-sm p-2 bg-red-50 rounded text-red-700">
                          <strong>Row {err.row}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-auvora-teal" />
      </div>
    }>
      <ImportPageContent />
    </Suspense>
  );
}
