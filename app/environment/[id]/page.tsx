"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, EncryptedVariable, Environment } from "@/lib/db";
import { encryptValue, decryptValue, generateId, isUnlocked } from "@/lib/crypto";
import { isAuthenticated } from '@/lib/supabase';
import { pushToCloud } from '@/lib/cloudsync';

interface DecryptedVariable {
  id: string;
  key: string;
  value: string;
  visible: boolean;
  keyVisible: boolean; // NEW: separate visibility for keys
  encryptedValue: string;
  iv: string;
}

export default function EnvironmentPage() {
  const router = useRouter();
  const params = useParams();
  const environmentId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [variables, setVariables] = useState<DecryptedVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // NEW: Global toggle states
  const [allKeysVisible, setAllKeysVisible] = useState(false);
  const [allValuesVisible, setAllValuesVisible] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");

  // Auto-sync function
  const autoSyncToCloud = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        console.log('🔄 Auto-syncing to cloud...');
        pushToCloud().catch(err => {
          console.error('Auto-sync failed:', err);
        });
      }
    } catch (err) {
      console.error('Auto-sync check failed:', err);
    }
  };

  // Load environment and variables
  useEffect(() => {
    if (!environmentId) {
      console.error('❌ No environment ID in URL');
      setError('Invalid environment - no ID provided');
      setLoading(false);
      return;
    }
    
    console.log('🔍 Loading environment:', environmentId);
    loadData();
  }, [environmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!isUnlocked()) {
        router.push('/unlock');
        return;
      }

      if (!environmentId) {
        setError("No environment ID provided");
        return;
      }

      console.log('📦 Fetching environment:', environmentId);

      const env = await db.getEnvironment(environmentId);
      console.log('📦 Environment result:', env);
      
      if (!env) {
        setError("Environment not found");
        return;
      }
      setEnvironment(env);

      const encryptedVars = await db.getVariablesByEnvironment(environmentId);
      const decryptedVars: DecryptedVariable[] = [];

      for (const encVar of encryptedVars) {
        try {
          const decryptedValue = await decryptValue(encVar.encryptedValue, encVar.iv);
          decryptedVars.push({
            id: encVar.id,
            key: encVar.key,
            value: decryptedValue,
            visible: false,
            keyVisible: false, // NEW: keys hidden by default
            encryptedValue: encVar.encryptedValue,
            iv: encVar.iv
          });
        } catch (err) {
          console.error(`Failed to decrypt variable ${encVar.key}:`, err);
        }
      }

      setVariables(decryptedVars);
    } catch (err: any) {
      console.error('❌ Load error:', err);
      setError(err.message || 'Failed to load environment');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Toggle individual key visibility
  const toggleKeyVisibility = (id: string) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, keyVisible: !v.keyVisible } : v
    ));
  };

  // Existing toggle for value visibility
  const toggleVisibility = (id: string) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, visible: !v.visible } : v
    ));
  };

  // NEW: Toggle all keys
  const toggleAllKeys = () => {
    const newState = !allKeysVisible;
    setAllKeysVisible(newState);
    setVariables(variables.map(v => ({ ...v, keyVisible: newState })));
  };

  // NEW: Toggle all values
  const toggleAllValues = () => {
    const newState = !allValuesVisible;
    setAllValuesVisible(newState);
    setVariables(variables.map(v => ({ ...v, visible: newState })));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Copied to clipboard!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError("Failed to copy to clipboard");
    }
  };

  const addVariable = async () => {
    if (!newKey || !newValue) {
      setError("Key and value are required");
      return;
    }

    try {
      setError("");
      
      const { encryptedValue, iv } = await encryptValue(newValue);

      const newVariable: EncryptedVariable = {
        id: generateId(),
        environmentId,
        key: newKey,
        encryptedValue,
        iv,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.addVariable(newVariable);

      if (environment) {
        const updatedEnv = {
          ...environment,
          updatedAt: Date.now()
        };
        await db.updateEnvironment(updatedEnv);
        setEnvironment(updatedEnv);
      }

      setVariables([...variables, {
        id: newVariable.id,
        key: newKey,
        value: newValue,
        visible: false,
        keyVisible: false, // NEW
        encryptedValue,
        iv
      }]);

      setNewKey("");
      setNewValue("");
      setIsAdding(false);
      setSuccess("Variable added successfully!");
      setTimeout(() => setSuccess(""), 3000);

      autoSyncToCloud();
    } catch (err: any) {
      console.error('Add variable error:', err);
      setError(err.message || 'Failed to add variable');
    }
  };

  const startEdit = (variable: DecryptedVariable) => {
    setEditingId(variable.id);
    setEditKey(variable.key);
    setEditValue(variable.value);
  };

  const saveEdit = async () => {
    if (!editKey || !editValue) {
      setError("Key and value are required");
      return;
    }

    try {
      setError("");

      const { encryptedValue, iv } = await encryptValue(editValue);
      const originalVar = variables.find(v => v.id === editingId);

      const updatedVariable: EncryptedVariable = {
        id: editingId!,
        environmentId,
        key: editKey,
        encryptedValue,
        iv,
        createdAt: originalVar?.id ? Date.now() : Date.now(),
        updatedAt: Date.now()
      };

      await db.updateVariable(updatedVariable);

      if (environment) {
        const updatedEnv = {
          ...environment,
          updatedAt: Date.now()
        };
        await db.updateEnvironment(updatedEnv);
        setEnvironment(updatedEnv);
      }

      setVariables(variables.map(v =>
        v.id === editingId ? { 
          ...v, 
          key: editKey, 
          value: editValue,
          encryptedValue,
          iv
        } : v
      ));

      setEditingId(null);
      setEditKey("");
      setEditValue("");
      setSuccess("Variable updated successfully!");
      setTimeout(() => setSuccess(""), 3000);

      autoSyncToCloud();
    } catch (err: any) {
      console.error('Save edit error:', err);
      setError(err.message || 'Failed to save changes');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditKey("");
    setEditValue("");
  };

  const deleteVariable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) {
      return;
    }

    try {
      await db.deleteVariable(id);

      if (environment) {
        const updatedEnv = {
          ...environment,
          updatedAt: Date.now()
        };
        await db.updateEnvironment(updatedEnv);
        setEnvironment(updatedEnv);
      }

      setVariables(variables.filter(v => v.id !== id));
      setSuccess("Variable deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);

      autoSyncToCloud();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete variable');
    }
  };

  const exportEnvFile = () => {
    try {
      const envContent = variables
        .map(v => `${v.key}=${v.value}`)
        .join('\n');

      const blob = new Blob([envContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${environment?.name.toLowerCase().replace(/\s+/g, '-') || 'environment'}.env`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess("Environment variables exported!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Export error:', err);
      setError('Failed to export .env file');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const importEnvFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setLoading(true);

      const text = await file.text();
      const lines = text.split('\n');
      
      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }

        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex === -1) {
          skippedCount++;
          continue;
        }

        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        if (!key) {
          skippedCount++;
          continue;
        }

        try {
          const existingVar = variables.find(v => v.key === key);
          
          if (existingVar) {
            const { encryptedValue, iv } = await encryptValue(value);
            
            const updatedVariable: EncryptedVariable = {
              id: existingVar.id,
              environmentId,
              key,
              encryptedValue,
              iv,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            await db.updateVariable(updatedVariable);

            setVariables(prev => prev.map(v =>
              v.id === existingVar.id ? {
                ...v,
                key,
                value,
                encryptedValue,
                iv
              } : v
            ));
          } else {
            const { encryptedValue, iv } = await encryptValue(value);

            const newVariable: EncryptedVariable = {
              id: generateId(),
              environmentId,
              key,
              encryptedValue,
              iv,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            await db.addVariable(newVariable);

            setVariables(prev => [...prev, {
              id: newVariable.id,
              key,
              value,
              visible: false,
              keyVisible: false, // NEW
              encryptedValue,
              iv
            }]);
          }

          importedCount++;
        } catch (err) {
          console.error(`Failed to import ${key}:`, err);
          errors.push(key);
        }
      }

      if (environment && importedCount > 0) {
        const updatedEnv = {
          ...environment,
          updatedAt: Date.now()
        };
        await db.updateEnvironment(updatedEnv);
        setEnvironment(updatedEnv);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      let message = `Successfully imported ${importedCount} variable${importedCount !== 1 ? 's' : ''}`;
      if (skippedCount > 0) {
        message += `, skipped ${skippedCount}`;
      }
      if (errors.length > 0) {
        message += `. Failed: ${errors.join(', ')}`;
      }
      
      setSuccess(message);
      setTimeout(() => setSuccess(""), 5000);

      if (importedCount > 0) {
        autoSyncToCloud();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import .env file');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading environment...</p>
        </div>
      </main>
    );
  }

  if (!environment) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg max-w-md">
            <p className="text-red-400">{error || 'Environment not found'}</p>
            {!environmentId && (
              <p className="text-sm text-gray-400 mt-2">
                The URL is missing an environment ID
              </p>
            )}
          </div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept=".env,.txt"
        onChange={importEnvFile}
        className="hidden"
      />

      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <span style={{ color: environment.color }}>{environment.name}</span>
                  <span className="text-gray-600">Environment</span>
                </h1>
                <p className="text-sm text-gray-400">{environment.type} environment variables</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleImportClick}
                className="px-4 py-2 text-sm border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>
              <button 
                onClick={exportEnvFile}
                disabled={variables.length === 0}
                className="px-4 py-2 text-sm border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export .env
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-white">{variables.length}</div>
            <div className="text-sm text-gray-400">Total Variables</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold" style={{ color: environment.color }}>Active</div>
            <div className="text-sm text-gray-400">Environment Status</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-white">
              {new Date(environment.updatedAt).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Last Updated</div>
          </div>
        </div>

        {/* Variables List Header with Toggle Controls */}
        {variables.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Environment Variables</h2>
              {/* NEW: Global toggle buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAllKeys}
                  className="px-3 py-1 text-xs border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-1"
                  title={allKeysVisible ? "Hide all keys" : "Show all keys"}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {allKeysVisible ? 'Hide Keys' : 'Show Keys'}
                </button>
                <button
                  onClick={toggleAllValues}
                  className="px-3 py-1 text-xs border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-1"
                  title={allValuesVisible ? "Hide all values" : "Show all values"}
                >
                  {allValuesVisible ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                  {allValuesVisible ? 'Hide Values' : 'Show Values'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-purple-500/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Variable
            </button>
          </div>
        )}

        {/* Add New Variable Form */}
        {isAdding && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/50 mb-4">
            <h3 className="text-lg font-semibold mb-4">Add New Variable</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Key</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="API_KEY"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="your_secret_value"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={addVariable}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
              >
                Save Variable
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewKey("");
                  setNewValue("");
                  setError("");
                }}
                className="px-4 py-2 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Variables List */}
        <div className="space-y-3">
          {variables.map((variable) => (
            <div
              key={variable.id}
              className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all"
            >
              {editingId === variable.id ? (
                // Edit Mode
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Key</label>
                      <input
                        type="text"
                        value={editKey}
                        onChange={(e) => setEditKey(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Value</label>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-semibold"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
              
/* View Mode */
<div>
  <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
    {/* Left side: Key and Value */}
    <div className="min-w-0 space-y-3">
      {/* KEY row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <code className="text-sm font-mono text-purple-400 break-words block">
            {variable.keyVisible ? variable.key : "•".repeat(Math.min(variable.key.length, 20))}
          </code>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => toggleKeyVisibility(variable.id)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            title={variable.keyVisible ? "Hide key" : "Show key"}
          >
            {variable.keyVisible ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => copyToClipboard(variable.key)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            title="Copy key"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* VALUE row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <code className="text-sm font-mono text-gray-400 break-words block">
            {variable.visible ? variable.value : "•".repeat(Math.min(variable.value.length, 32))}
          </code>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => toggleVisibility(variable.id)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            title={variable.visible ? "Hide value" : "Show value"}
          >
            {variable.visible ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => copyToClipboard(variable.value)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            title="Copy value"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    {/* Right side: Action buttons */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => startEdit(variable)}
        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        title="Edit variable"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={() => deleteVariable(variable.id)}
        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
        title="Delete variable"
      >
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</div>
      


                
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {variables.length === 0 && !isAdding && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No variables yet</h3>
            <p className="text-gray-400 mb-6">Add your first environment variable or import a .env file</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Variable
              </button>
              <button
                onClick={handleImportClick}
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700/50 text-white font-semibold rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import .env
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}