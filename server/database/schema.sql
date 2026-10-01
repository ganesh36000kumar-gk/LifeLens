-- ====================================================================
-- LIFE DECISION SIMULATOR — POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Normalized architecture for persistent simulation modeling
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    monthly_ai_runs_used INT DEFAULT 0
);

-- 2. Decisions Master Table
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'car', 'home_rent', 'job_career', 'education', 'business',
        'loan_debt', 'investment', 'relocation', 'major_purchase', 'custom'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3. Simulation Runs
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    duration_years NUMERIC(5, 2) NOT NULL,
    raw_input_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_demo BOOLEAN DEFAULT FALSE
);

-- 4. Scenarios Table
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
    scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN (
        'base', 'conservative', 'expected', 'optimistic', 'stress', 'custom'
    )),
    name VARCHAR(255) NOT NULL,
    financial_cost_total NUMERIC(16, 2) NOT NULL,
    monthly_cash_flow NUMERIC(16, 2) NOT NULL,
    long_term_net_value NUMERIC(16, 2) NOT NULL,
    liquidity_impact NUMERIC(16, 2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    flexibility VARCHAR(20) NOT NULL CHECK (flexibility IN ('LOW', 'MEDIUM', 'HIGH')),
    reversibility VARCHAR(20) NOT NULL,
    opportunity_cost_total NUMERIC(16, 2) NOT NULL,
    time_commitment_weekly NUMERIC(5, 2) DEFAULT 0,
    break_even_months INT,
    break_even_explanation TEXT,
    yearly_projections JSONB NOT NULL,
    risk_profile JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Assumptions Audit Log
CREATE TABLE IF NOT EXISTS simulation_assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    value VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    source VARCHAR(50) CHECK (source IN ('user', 'default', 'estimated', 'external')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI Explanations Audit Cache
CREATE TABLE IF NOT EXISTS ai_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    what_numbers_show JSONB NOT NULL,
    key_assumptions JSONB NOT NULL,
    tradeoffs JSONB NOT NULL,
    risks JSONB NOT NULL,
    sensitivity_factors JSONB NOT NULL,
    questions_to_consider JSONB NOT NULL,
    model_version VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Secure Shared Snapshots
CREATE TABLE IF NOT EXISTS shared_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_token VARCHAR(64) UNIQUE NOT NULL,
    simulation_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INT DEFAULT 0
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_decisions_user ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_decision ON simulation_runs(decision_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_sim_run ON scenarios(simulation_run_id);
CREATE INDEX IF NOT EXISTS idx_shared_token ON shared_snapshots(share_token);
