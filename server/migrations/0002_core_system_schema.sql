-- Migration number: 0002 	 2024-01-02T00:00:00.000Z

-- USERS TABLE
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'user', 'tech', 'manager'
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- HARDWARE ASSETS (Laptops, Desktops, Monitors, Infra)
CREATE TABLE assets_hardware (
    id TEXT PRIMARY KEY,
    serial_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'laptop', 'desktop', 'monitor', 'server', 'switch', 'ap', 'printer'
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    specs TEXT, -- JSON or string with CPU/RAM/Disk details
    os TEXT,
    ip_address TEXT, -- For printers and infra
    mac_address TEXT,
    location TEXT NOT NULL,
    department TEXT,
    assigned_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'in_repair', 'decommissioned'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

-- UNIQUE IP index for active network devices
CREATE UNIQUE INDEX idx_assets_active_ip ON assets_hardware(ip_address) WHERE ip_address IS NOT NULL AND status = 'active';

-- CONSUMABLES INVENTORY
CREATE TABLE assets_consumables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'toner', 'mouse', 'keyboard', 'cable', etc.
    compatible_printer_model TEXT, -- For smart matching
    stock_central INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TICKETS
CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    assigned_tech_id TEXT,
    type TEXT NOT NULL, -- 'incident', 'requirement'
    category TEXT NOT NULL, -- 'outlook', 'excel', 'internet', 'core_sys', 'toner', 'peripheral'
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'waiting', 'pending_signature', 'resolved', 'closed'
    description TEXT,
    resolution_notes TEXT,
    document_url TEXT, -- Link to R2 bucket file
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    resolved_at DATETIME,
    paused_accumulated_seconds INTEGER DEFAULT 0, -- To pause SLA timers
    last_paused_at DATETIME,
    reopened_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_tech_id) REFERENCES users(id)
);

-- TICKETS / ASSETS RELATION (Many-to-Many for specific assets involved in a ticket)
CREATE TABLE ticket_assets (
    ticket_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    PRIMARY KEY (ticket_id, asset_id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (asset_id) REFERENCES assets_hardware(id)
);

-- INVENTORY TRANSACTIONS LOG
CREATE TABLE inventory_transactions (
    id TEXT PRIMARY KEY,
    consumable_id TEXT NOT NULL,
    tech_id TEXT NOT NULL,
    ticket_id TEXT, -- Optional, if local consumption
    quantity INTEGER NOT NULL, -- Positive for addition, Negative for subtraction
    destination_location TEXT NOT NULL, -- 'local' or 'Patio', 'Pimpollo'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumable_id) REFERENCES assets_consumables(id),
    FOREIGN KEY (tech_id) REFERENCES users(id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- Initial Mock Data for testing
INSERT INTO users (id, email, full_name, role, department, location) VALUES 
('u1', 'gerente@gruposerex.com', 'Gerente TI', 'manager', 'TI', 'Sede Central'),
('u2', 'tecnico@gruposerex.com', 'Técnico Soporte', 'tech', 'TI', 'Sede Central'),
('u3', 'empleado@gruposerex.com', 'Empleado Ventas', 'user', 'Ventas', 'Sede Central');
