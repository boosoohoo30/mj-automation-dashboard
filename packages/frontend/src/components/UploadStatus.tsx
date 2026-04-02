import type { Workflow } from '../types/workflow';

export function UploadStatus({ workflow }: { workflow: Workflow }) {
  const isVideoUpload = workflow.status === 'uploading_videos';
  const items = isVideoUpload ? (workflow.videos ?? []) : (workflow.images ?? []);

  const uploaded = items.filter((item) =>
    isVideoUpload
      ? 'gdrive_url' in item && item.gdrive_url
      : 'confluence_url' in item && item.confluence_url
  ).length;

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold">
        {isVideoUpload ? '영상 업로드 (Google Drive)' : '이미지 업로드 (Confluence)'}
      </h2>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-800 rounded-full h-3">
          <div
            className="h-3 bg-blue-500 rounded-full transition-all"
            style={{ width: items.length > 0 ? `${(uploaded / items.length) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-sm font-mono text-gray-400">
          {uploaded}/{items.length}
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item, i) => {
          const isUploaded = isVideoUpload
            ? 'gdrive_url' in item && item.gdrive_url
            : 'confluence_url' in item && item.confluence_url;
          return (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className={isUploaded ? 'text-green-400' : 'text-gray-500'}>
                {isUploaded ? '  ' : '  '}
              </span>
              <span className={isUploaded ? 'text-gray-300' : 'text-gray-500'}>
                {'emotion' in item ? item.emotion : `이미지 v${item.iteration}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
