import React from "react";
import { useAISettingsStore } from "@/store/v1/aiSettings";

function AiSettings() {
  const { settings, updateSettings } = useAISettingsStore();

  const handleChange = (key: string, value: string | number) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">AI Settings</h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Provider</label>
          <select 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md" 
            value={settings.apiProvider} 
            onChange={(e) => handleChange('apiProvider', e.target.value)}
          >
            <option value="OpenAI">OpenAI</option>
            <option value="DeepSeek">DeepSeek</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Timeout</label>
          <input type="number" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.timeout} onChange={(e) => handleChange('timeout', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Token</label>
          <input type="number" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.maxTokens} onChange={(e) => handleChange('maxTokens', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Temperature</label>
          <input type="number" step="0.1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.temperature} onChange={(e) => handleChange('temperature', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Context</label>
          <input type="number" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.maxContext} onChange={(e) => handleChange('maxContext', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.model} onChange={(e) => handleChange('model', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <input type="password" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.apiKey} onChange={(e) => handleChange('apiKey', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Proxy</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.proxy} onChange={(e) => handleChange('proxy', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">API Base URL</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.apiBaseUrl} onChange={(e) => handleChange('apiBaseUrl', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">User-Agent</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={settings.userAgent} onChange={(e) => handleChange('userAgent', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export default AiSettings; 