CREATE DATABASE IF NOT EXISTS silentspaces
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE silentspaces;

CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  area VARCHAR(100),
  distanceMiles DECIMAL(5,2),
  wifi BOOLEAN,
  seating BOOLEAN,
  sockets BOOLEAN,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  bestTime VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id VARCHAR(20) NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ratings_location FOREIGN KEY (location_id)
    REFERENCES locations(id)
    ON DELETE CASCADE
);
