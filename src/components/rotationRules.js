// Rotation overrides are overlays; the original cycle and anchor remain untouched.
export function activeRule(rules, group, date) {
  return [...(rules || [])].reverse().find(r => r.group === group && r.from <= date && (!r.to || date <= r.to));
}
export function applyRotationRules(schedule, rules = []) {
  if (!rules.length) return schedule;
  for (const week of schedule) {
    for (const day of week.days) {
      const date = day.date.toISOString().slice(0,10);
      const operators = activeRule(rules,"operators",date);
      const admins = activeRule(rules,"admins",date);
      if (operators) day.shifts = day.shifts.map((emp,h) => day.date.getDay() === 6 && h >= 10 && h < 14 ? emp : (operators.mapping?.[emp] || emp));
      if (admins && day.date.getDay() === 6 && admins.order?.length) {
        const delta = Math.floor((Date.parse(date)-Date.parse(admins.from))/604800000);
        // Count Saturdays from the first Saturday on or after the rule start.
        const emp = admins.order[delta % admins.order.length];
        for (let h=10;h<14;h++) day.shifts[h]=emp;
      }
    }
    const rule = activeRule(rules,"operators",week.date);
    if (rule) week.summary = Object.fromEntries(Object.entries(week.summary).map(([shift,emp])=>[shift,rule.mapping?.[emp] || emp]));
  }
  return schedule;
}
export function makeMapping(original, desired) {
  if (original.length !== desired.length || new Set(original).size !== original.length || new Set(desired).size !== desired.length || desired.some(e=>!original.includes(e))) throw Error("Cada persona debe aparecer una sola vez.");
  return Object.fromEntries(original.map((e,i)=>[e,desired[i]]));
}
