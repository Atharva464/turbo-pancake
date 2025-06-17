CREATE TABLE bands (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  rate INT NOT NULL
);

CREATE TABLE flats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  flat_no VARCHAR(20) NOT NULL,
  wing VARCHAR(20),
  floor INT,
  area INT,
  configuration VARCHAR(20),
  band_id BIGINT UNSIGNED,
  reckoner INT,
  sale_pass VARCHAR(10),
  status ENUM('available', 'blocked', 'sold', 'hold', 'member') DEFAULT 'available',
  UNIQUE KEY unique_flat (flat_no, wing),
  FOREIGN KEY (band_id) REFERENCES bands(id)
);

CREATE TABLE sale_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  flat_no VARCHAR(20),
  wing VARCHAR(20),
  data LONGTEXT CHECK (JSON_VALID(data)),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flat_sale_snapshots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  flat_id BIGINT UNSIGNED,
  flat_no VARCHAR(20),
  wing VARCHAR(20),
  data LONGTEXT CHECK (JSON_VALID(data)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flat_id) REFERENCES flats(id),
  UNIQUE KEY unique_flat_snapshot (flat_id)
);
