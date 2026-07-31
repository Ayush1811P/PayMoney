-- 1. Create 'profiles' table
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    wallet_balance NUMERIC(10, 2) DEFAULT 10000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Create 'bank_accounts' table (for the accounts linked via UPI)
CREATE TABLE bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT DEFAULT 'Bank',
    account_number TEXT NOT NULL UNIQUE,
    ifsc_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Create 'transactions' table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- (Optional) Add Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for everyone" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for users based on id" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on id" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Enable all for users based on user_id" ON bank_accounts FOR ALL USING (true);
CREATE POLICY "Enable all for sender and receiver" ON transactions FOR ALL USING (true);
