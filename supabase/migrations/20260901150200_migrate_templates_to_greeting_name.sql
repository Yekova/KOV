-- The variable engine (src/lib/email/variables.ts) introduces {{greeting_name}}
-- as a computed variable specifically to handle the fallback the spec calls
-- out (section 9): "{{title}} {{last_name}}", civility-then-last-name,
-- collapsing to the first name alone when no civility is on file — never a
-- half-empty "Bonjour  Dupont,". The 7 templates seeded before this engine
-- existed hardcoded the two raw tokens side by side; this rewrites them to
-- use the new computed variable instead, so the fallback actually applies.
-- A plain string replace on the JSON's text form is safe here — the target
-- substring only ever appears inside a text node's string value, no escaping
-- collisions with '{{title}} {{last_name}}' as a literal token.
update email_templates
set
  body = replace(body::text, '{{title}} {{last_name}}', '{{greeting_name}}')::jsonb,
  body_html = replace(body_html, '{{title}} {{last_name}}', '{{greeting_name}}'),
  variables = array_replace(array_replace(variables, 'title', 'greeting_name'), 'last_name', 'greeting_name')
where body_html like '%{{title}} {{last_name}}%';

-- array_replace above can leave duplicate 'greeting_name' entries (both
-- 'title' and 'last_name' map to it) — de-duplicate.
update email_templates
set variables = (select array_agg(distinct v) from unnest(variables) as v)
where 'greeting_name' = any(variables);
