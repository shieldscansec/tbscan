-- SentinelCore Database Initialization Script
-- Shield Scan Security - Advanced SA-MP Server Management Panel

-- Create database if not exists
SELECT 'CREATE DATABASE sentinelcore'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sentinelcore')\gexec

-- Connect to sentinelcore database
\c sentinelcore;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
DO $$ 
BEGIN
    -- User role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('visitor', 'client', 'subadmin', 'admin', 'root');
    END IF;
    
    -- User status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned', 'pending_verification');
    END IF;
    
    -- Server status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'server_status') THEN
        CREATE TYPE server_status AS ENUM ('stopped', 'starting', 'running', 'stopping', 'crashed', 'maintenance', 'suspended');
    END IF;
    
    -- Server type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'server_type') THEN
        CREATE TYPE server_type AS ENUM ('samp_037', 'samp_03dl', 'samp_03dl_r1', 'openmp');
    END IF;
    
    -- Log level enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_level') THEN
        CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error', 'fatal');
    END IF;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'client',
    status user_status DEFAULT 'pending_verification',
    avatar_url VARCHAR(500),
    phone_number VARCHAR(20),
    company_name VARCHAR(200),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    two_factor_backup_codes TEXT[],
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    last_login_ip INET,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    permissions TEXT[] DEFAULT '{}',
    max_servers INTEGER DEFAULT 1,
    disk_quota_mb INTEGER DEFAULT 1024,
    bandwidth_quota_gb INTEGER DEFAULT 10,
    api_key VARCHAR(255),
    api_key_expires TIMESTAMP,
    subscription_plan VARCHAR(100),
    subscription_expires TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type server_type DEFAULT 'samp_037',
    status server_status DEFAULT 'stopped',
    ip INET NOT NULL,
    port INTEGER NOT NULL,
    rcon_password VARCHAR(255) NOT NULL,
    max_players INTEGER DEFAULT 50,
    gamemode_name VARCHAR(100),
    gamemode_file VARCHAR(255),
    filterscripts TEXT[] DEFAULT '{}',
    plugins TEXT[] DEFAULT '{}',
    server_cfg TEXT,
    auto_restart BOOLEAN DEFAULT TRUE,
    restart_interval_hours INTEGER DEFAULT 24,
    cpu_limit_percent INTEGER DEFAULT 80,
    memory_limit_mb INTEGER DEFAULT 512,
    disk_quota_mb INTEGER DEFAULT 1024,
    bandwidth_limit_mbps INTEGER,
    backup_enabled BOOLEAN DEFAULT TRUE,
    backup_interval_hours INTEGER DEFAULT 6,
    backup_retention_days INTEGER DEFAULT 7,
    monitoring_enabled BOOLEAN DEFAULT TRUE,
    crash_detection BOOLEAN DEFAULT TRUE,
    log_retention_days INTEGER DEFAULT 30,
    server_path VARCHAR(500) NOT NULL,
    process_id INTEGER,
    last_started TIMESTAMP,
    last_stopped TIMESTAMP,
    uptime_seconds INTEGER DEFAULT 0,
    crash_count INTEGER DEFAULT 0,
    total_restarts INTEGER DEFAULT 0,
    current_players INTEGER DEFAULT 0,
    peak_players INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0,
    memory_usage_mb DECIMAL(10,2) DEFAULT 0,
    disk_usage_mb DECIMAL(10,2) DEFAULT 0,
    network_in_mb DECIMAL(15,2) DEFAULT 0,
    network_out_mb DECIMAL(15,2) DEFAULT 0,
    server_version VARCHAR(50),
    custom_params TEXT,
    environment_vars JSONB DEFAULT '{}',
    security_settings JSONB DEFAULT '{}',
    performance_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    is_template BOOLEAN DEFAULT FALSE,
    template_name VARCHAR(100),
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for servers table
CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_servers_type ON servers(type);
CREATE INDEX IF NOT EXISTS idx_servers_ip_port ON servers(ip, port);
CREATE UNIQUE INDEX IF NOT EXISTS idx_servers_ip_port_unique ON servers(ip, port) WHERE deleted_at IS NULL;

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level log_level NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id),
    server_id UUID REFERENCES servers(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for system_logs table
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_server_id ON system_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Create server_logs table
CREATE TABLE IF NOT EXISTS server_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    file_path VARCHAR(500),
    line_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for server_logs table
CREATE INDEX IF NOT EXISTS idx_server_logs_server_id ON server_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_server_logs_type ON server_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_server_logs_created_at ON server_logs(created_at);

-- Create server_backups table
CREATE TABLE IF NOT EXISTS server_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    compressed BOOLEAN DEFAULT TRUE,
    encrypted BOOLEAN DEFAULT FALSE,
    checksum VARCHAR(64),
    backup_type VARCHAR(50) DEFAULT 'manual',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create indexes for server_backups table
CREATE INDEX IF NOT EXISTS idx_server_backups_server_id ON server_backups(server_id);
CREATE INDEX IF NOT EXISTS idx_server_backups_created_at ON server_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_server_backups_expires_at ON server_backups(expires_at);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for system_settings table
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('app.name', '"SentinelCore"', 'Application name', 'general', true),
('app.version', '"1.0.0"', 'Application version', 'general', true),
('app.description', '"Shield Scan Security - Advanced SA-MP Server Management Panel"', 'Application description', 'general', true),
('security.max_login_attempts', '5', 'Maximum login attempts before lockout', 'security', false),
('security.lockout_duration', '900', 'Lockout duration in seconds', 'security', false),
('security.session_timeout', '1800', 'Session timeout in seconds', 'security', false),
('features.registration_enabled', 'true', 'Allow new user registration', 'features', true),
('features.2fa_required', 'false', 'Require 2FA for all users', 'features', false),
('server.max_instances_per_user', '5', 'Maximum server instances per user', 'server', false),
('server.default_memory_limit', '512', 'Default memory limit in MB', 'server', false),
('server.default_disk_quota', '1024', 'Default disk quota in MB', 'server', false),
('backup.retention_days', '30', 'Backup retention period in days', 'backup', false),
('monitoring.enabled', 'true', 'Enable system monitoring', 'monitoring', false)
ON CONFLICT (key) DO NOTHING;

-- Create default admin user (password: admin123 - CHANGE THIS!)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@sentinelcore.local') THEN
        INSERT INTO users (
            username,
            email,
            password,
            first_name,
            last_name,
            role,
            status,
            email_verified
        ) VALUES (
            'admin',
            'admin@sentinelcore.local',
            '$argon2id$v=19$m=65536,t=3,p=4$salt$hash', -- This should be properly hashed
            'Administrator',
            'SentinelCore',
            'root',
            'active',
            true
        );
    END IF;
END $$;

-- Create performance monitoring views
CREATE OR REPLACE VIEW server_performance_summary AS
SELECT 
    s.id,
    s.name,
    s.status,
    s.current_players,
    s.max_players,
    s.cpu_usage_percent,
    s.memory_usage_mb,
    s.memory_limit_mb,
    ROUND((s.memory_usage_mb / s.memory_limit_mb * 100)::numeric, 2) as memory_usage_percent,
    s.disk_usage_mb,
    s.disk_quota_mb,
    ROUND((s.disk_usage_mb / s.disk_quota_mb * 100)::numeric, 2) as disk_usage_percent,
    s.uptime_seconds,
    s.crash_count,
    s.total_restarts,
    u.username as owner_username
FROM servers s
JOIN users u ON s.owner_id = u.id
WHERE s.deleted_at IS NULL;

-- Create user activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.status,
    u.last_login,
    COUNT(s.id) as server_count,
    COUNT(CASE WHEN s.status = 'running' THEN 1 END) as running_servers,
    SUM(s.disk_usage_mb) as total_disk_usage,
    u.disk_quota_mb,
    u.created_at as user_created_at
FROM users u
LEFT JOIN servers s ON u.id = s.owner_id AND s.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username, u.email, u.role, u.status, u.last_login, u.disk_quota_mb, u.created_at;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sentinel_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sentinel_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sentinel_admin;

-- Create cleanup function for old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Clean up old system logs (older than 90 days)
    DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old server logs based on server settings
    DELETE FROM server_logs sl 
    WHERE sl.created_at < NOW() - INTERVAL '1 day' * (
        SELECT COALESCE(s.log_retention_days, 30) 
        FROM servers s 
        WHERE s.id = sl.server_id
    );
    
    -- Clean up expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Clean up expired backups
    DELETE FROM server_backups WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Clean up old audit logs (older than 1 year)
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

COMMIT;