/*
  # Update Admin User Role

  1. Changes
    - Update existing user's role to admin in profiles table
    - Only updates if the user exists

  2. Security
    - Uses safe update operation
    - Checks for existing user before update
*/

do $$
declare
  user_id uuid;
begin
  -- Get the user ID for the email
  select id into user_id
  from auth.users
  where email = 'alkbysyfysl499@gmail.com';

  -- Update the profile to set admin role if user exists
  if user_id is not null then
    update public.profiles
    set 
      role = 'admin',
      updated_at = now()
    where id = user_id;
  end if;
end;
$$;