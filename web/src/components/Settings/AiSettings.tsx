import React, { useState } from "react";

function AiSettings() {
  const [apiProvider, setApiProvider] = useState("OpenAI");
  const [timeout, setTimeout] = useState(30);
  const [maxTokens, setMaxTokens] = useState(0);
  const [temperature, setTemperature] = useState(1.3);
  const [maxContext, setMaxContext] = useState(7);
  const [model, setModel] = useState("deepseek-chat");
  const [apiKey, setApiKey] = useState("");
  const [proxy, setProxy] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("https://api.deepseek.com/v1/");
  const [userAgent, setUserAgent] = useState("SiYuan/3.1.20 std/darwin");

  return (
    <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">AI Settings</h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Provider</label>
          <select className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={apiProvider} onChange={(e) => setApiProvider(e.target.value)}>
            <option value="OpenAI">OpenAI</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Timeout</label>
          <input type="number" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={timeout} onChange={(e) => setTimeout(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Token</label>
          <input type="number" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Temperature</label>
          <input type="number" step="0.1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Context</label>
          <input type="number" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={maxContext} onChange={(e) => setMaxContext(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <input type="password" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Proxy</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={proxy} onChange={(e) => setProxy(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">API Base URL</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">User-Agent</label>
          <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" value={userAgent} onChange={(e) => setUserAgent(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export default AiSettings; 