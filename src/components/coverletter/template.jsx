export const RICHARD_DEFAULT = `
{{candidate_name}}    {{candidate_email}} | {{candidate_phone}}
LinkedIn: {{candidate_linkedin}}

{{recipient_name}}
{{company_name}}
{{company_city_state_zip}}

Dear {{recipient_name}},

{{intro_mission}}

{{para_experience}}

{{para_alignment}}

{{closing}}

Warm regards,
{{candidate_name}}
`.trim();

export function fillTemplate(tpl, vars) {
  return String(tpl || "").replace(/{{\s*([\w_]+)\s*}}/g, (_, key) => {
    const v = vars && Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : "";
    return (v ?? "").toString();
  }).replace(/[ \t]+\n/g, "\n");
}