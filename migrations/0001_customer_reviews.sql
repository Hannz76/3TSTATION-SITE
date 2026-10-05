CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 60),
  service TEXT NOT NULL CHECK(service IN ('Game top-up', 'Phone repair', 'Fresh yogurt', 'Store visit')),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 10 AND 1500),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  visible INTEGER NOT NULL DEFAULT 1 CHECK(visible IN (0, 1))
);
CREATE INDEX reviews_visible_id ON reviews (visible, id DESC);
CREATE TABLE review_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX review_limits_expiry ON review_limits (expires_at);
