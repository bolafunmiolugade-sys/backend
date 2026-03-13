-- Create password_resets table for OTPs
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'user' or 'lecturer'
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups when verifying codes
CREATE INDEX IF NOT EXISTS idx_password_resets_email_type ON password_resets(email, user_type);
