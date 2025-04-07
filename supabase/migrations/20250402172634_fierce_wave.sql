/*
  # Add default role for new users

  1. Changes
    - Modify the handle_new_user function to set a default role of 'student'
    - This ensures all new users start as students and can be upgraded to tutors later
*/

-- Update the handle_new_user function to include role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'student'
  );
  return new;
end;
$$ language plpgsql security definer;