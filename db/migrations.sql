-- Step 1: Drop tables in the correct order (children first)
DROP TABLE IF EXISTS speed_events;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS devices;

-- Step 2: Create devices table
CREATE TABLE devices (
  device_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  api_key VARCHAR(100) UNIQUE NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create speed_events table referencing devices.device_id
CREATE TABLE speed_events (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) REFERENCES devices(device_id),
  vehicle_id VARCHAR(50),
  speed NUMERIC(10, 2) NOT NULL,
  speed_limit NUMERIC(10, 2) NOT NULL,
  location_lat NUMERIC(10,6),
  location_lng NUMERIC(10,6),
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE
);

-- Step 4: Create settings table referencing devices.device_id
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) REFERENCES devices(device_id),
  key VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, key)
);

INSERT INTO devices (device_id, name, api_key)
VALUES ('global', 'Global Config', 'global-api-key');

-- Then insert default settings for it
INSERT INTO settings (device_id, key, value)
VALUES 
  ('global', 'default_speed_limit', '50'),
  ('global', 'alert_threshold', '10'),
  ('global', 'retention_days', '90');