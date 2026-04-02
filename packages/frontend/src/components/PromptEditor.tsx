import { useState } from 'react';
import type { Workflow } from '../types/workflow';

export function PromptEditor({ workflow }: { workflow: Workflow }) {
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const latestImage = workflow.images?.[0];
  const displayPrompt = prompt || latestImage?.prompt || '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold">프롬프트 편집</h2>

      <textarea
        value={displayPrompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-40 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Midjourney / Grok 프롬프트를 입력하세요..."
      />

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
        >
          {copied ? '복사됨!' : '프롬프트 복사'}
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-500 self-center">
          768x1152 (2:3) | --ar 2:3
        </span>
      </div>
    </div>
  );
}
