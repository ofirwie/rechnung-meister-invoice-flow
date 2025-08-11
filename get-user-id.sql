-- Run this first to get your user ID
SELECT 
    id as user_id,
    email,
    raw_user_meta_data->>'full_name' as name
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'; -- Replace with your email
