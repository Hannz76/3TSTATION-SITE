CREATE TABLE orders (
  reference TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  tracking_hash TEXT NOT NULL,
  service TEXT NOT NULL CHECK(service IN ('yogurt','topup','repair')),
  draft_json TEXT NOT NULL CHECK(json_valid(draft_json)),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','confirmed','in_progress','ready','completed','cancelled')),
  total_sen INTEGER CHECK(total_sen IS NULL OR (total_sen >= 0 AND total_sen <= 100000000)),
  internal_note TEXT NOT NULL DEFAULT '',
  public_message TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX orders_inbox ON orders(created_at DESC, reference);
CREATE INDEX orders_filter ON orders(service, status, created_at DESC);
CREATE TABLE order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_reference TEXT NOT NULL REFERENCES orders(reference),
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(order_reference, version)
);
CREATE TRIGGER order_created AFTER INSERT ON orders BEGIN
  INSERT INTO order_events(order_reference, version, status, message, created_at)
  VALUES(NEW.reference, NEW.version, NEW.status, 'Order received.', NEW.created_at);
END;
CREATE TRIGGER order_updated AFTER UPDATE ON orders
WHEN NEW.version != OLD.version AND (NEW.status != OLD.status OR NEW.public_message != '') BEGIN
  INSERT INTO order_events(order_reference, version, status, message, created_at)
  VALUES(NEW.reference, NEW.version, NEW.status, NEW.public_message, NEW.updated_at);
END;
CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  credential_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE commerce_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE cash_entries (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('payment','refund','income','expense')),
  amount_sen INTEGER NOT NULL CHECK(amount_sen > 0 AND amount_sen <= 100000000),
  occurred_on TEXT NOT NULL,
  note TEXT NOT NULL,
  order_reference TEXT REFERENCES orders(reference),
  created_at TEXT NOT NULL,
  voided_at TEXT,
  void_reason TEXT,
  CHECK((kind IN ('payment','refund') AND order_reference IS NOT NULL) OR (kind IN ('income','expense') AND order_reference IS NULL)),
  CHECK((voided_at IS NULL AND void_reason IS NULL) OR (voided_at IS NOT NULL AND length(void_reason) > 0))
);
CREATE INDEX cash_dates ON cash_entries(occurred_on DESC, created_at DESC);
CREATE INDEX cash_order ON cash_entries(order_reference);
CREATE TABLE payment_settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  qr_data_url TEXT,
  instructions TEXT NOT NULL DEFAULT ''
);
INSERT INTO payment_settings(id) VALUES(1);
