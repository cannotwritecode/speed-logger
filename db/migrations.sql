-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  api_key VARCHAR(100) UNIQUE NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create speed_events table
CREATE TABLE IF NOT EXISTS speed_events (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) NOT NULL,
  vehicle_id VARCHAR(50),  -- License plate or other identifier
  speed NUMERIC(5,2) NOT NULL,  -- Speed in km/h or mph
  speed_limit NUMERIC(5,2) NOT NULL,
  location_lat NUMERIC(10,6),
  location_lng NUMERIC(10,6),
  image_url VARCHAR(255),  -- Optional, if camera captures images
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id),
  key VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, key)
);

-- Insert default settings
INSERT INTO settings (key, value) 
VALUES 
  ('default_speed_limit', '50'),
  ('alert_threshold', '10'),
  ('retention_days', '90');