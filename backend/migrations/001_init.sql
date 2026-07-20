CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(100),
  is_admin      BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventories (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_data     JSONB NOT NULL,
  machine_name  VARCHAR(255),
  scan_mode     VARCHAR(20) DEFAULT 'standard',
  scan_time     TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventories_user_id ON inventories(user_id);
CREATE INDEX idx_inventories_scan_time ON inventories(scan_time);

CREATE TABLE IF NOT EXISTS download_links (
  id                  SERIAL PRIMARY KEY,
  software_name       VARCHAR(255) NOT NULL,
  aliases             TEXT[] DEFAULT '{}',
  official_url        VARCHAR(1000) NOT NULL,
  direct_download_url VARCHAR(1000),
  category            VARCHAR(100),
  verified            BOOLEAN DEFAULT false,
  contributor_id      INTEGER REFERENCES users(id),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_download_links_name ON download_links(software_name);
CREATE INDEX idx_download_links_verified ON download_links(verified);
