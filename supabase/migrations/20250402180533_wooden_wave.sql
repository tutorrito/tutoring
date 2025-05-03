/*
  # Update Admin User Role

  1. Changes
    - Remove hardcoded admin user
    - Add function to promote users to admin role

  2. Security
    - Uses safe update operation
    - Requires existing user ID
*/

-- Create function to promote user to admin
create or replace function promote_to_admin(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set 
    role = 'admin',
    updated_at = now()
  where id = user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function promote_to_admin to authenticated;