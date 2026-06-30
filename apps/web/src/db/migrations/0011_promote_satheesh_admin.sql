-- Promote program admin account
UPDATE users
SET role = 'admin'
WHERE lower(email) = lower('satheesh@raak-advisory.co.in');
