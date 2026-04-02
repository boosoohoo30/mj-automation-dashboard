CREATE TABLE IF NOT EXISTS workflows (
  id            TEXT PRIMARY KEY,
  task_name     TEXT NOT NULL,
  slack_channel TEXT,
  slack_ts      TEXT,
  concept_url   TEXT,
  concept_data  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  current_step  INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS images (
  id              TEXT PRIMARY KEY,
  workflow_id     TEXT NOT NULL REFERENCES workflows(id),
  prompt          TEXT NOT NULL,
  prompt_version  INTEGER DEFAULT 1,
  midjourney_job_id TEXT,
  file_path       TEXT,
  thumbnail_path  TEXT,
  confluence_url  TEXT,
  ai_score        REAL,
  ai_feedback     TEXT,
  human_status    TEXT DEFAULT 'pending',
  human_feedback  TEXT,
  iteration       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS videos (
  id              TEXT PRIMARY KEY,
  workflow_id     TEXT NOT NULL REFERENCES workflows(id),
  image_id        TEXT REFERENCES images(id),
  emotion         TEXT NOT NULL,
  prompt          TEXT NOT NULL,
  grok_job_id     TEXT,
  raw_file_path   TEXT,
  optimized_path  TEXT,
  gdrive_url      TEXT,
  gdrive_file_id  TEXT,
  file_size_bytes INTEGER,
  ai_score        REAL,
  ai_feedback     TEXT,
  human_status    TEXT DEFAULT 'pending',
  human_feedback  TEXT,
  iteration       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback_log (
  id            TEXT PRIMARY KEY,
  workflow_id   TEXT NOT NULL REFERENCES workflows(id),
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  feedback      TEXT NOT NULL,
  source        TEXT DEFAULT 'user',
  action_taken  TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);
