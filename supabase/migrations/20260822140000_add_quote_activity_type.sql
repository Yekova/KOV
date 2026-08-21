alter table activity_log drop constraint activity_log_type_check;
alter table activity_log add constraint activity_log_type_check
  check (type in ('document', 'message', 'invoice', 'milestone', 'quote'));
