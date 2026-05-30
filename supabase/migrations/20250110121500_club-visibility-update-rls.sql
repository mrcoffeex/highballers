-- Only All-Star admins can set a club to private on update (open is always allowed).

drop policy if exists "Club admins can update clubs" on public.clubs;

create policy "Club admins can update clubs"
  on public.clubs for update to authenticated
  using (auth.uid() = admin_id)
  with check (
    auth.uid() = admin_id
    and (
      visibility = 'open'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.subscription_tier = 'all_star'
      )
    )
  );
