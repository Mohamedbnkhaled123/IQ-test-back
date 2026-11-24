const PERSONALITY_TRAITS = [
  'المسئولية',
  'اتخاذ القرار',
  'التمركز حول الذات',
  'المسيطر على الشخصية',
  'التعبير الكتابي',
  'الذكاء',
  'المواقف الطارئة',
  'نوع الشخصية',
  'الثبات الانفعالي',
  'تقدير الآخرين'
];

function pickDominantValue(values) {
  if (!values.length) {
    return null;
  }
  const counts = new Map();
  for (const val of values) {
    counts.set(val, (counts.get(val) || 0) + 1);
  }
  let bestVal = values[0];
  let bestCount = 0;
  for (const [val, count] of counts.entries()) {
    if (count > bestCount) {
      bestVal = val;
      bestCount = count;
    }
  }
  return bestVal;
}

function collectTraitBuckets(selectedOptions) {
  const buckets = new Map();
  for (const trait of PERSONALITY_TRAITS) {
    buckets.set(trait, { primary: [], fallback: [] });
  }
  for (const option of selectedOptions) {
    const impacts = Array.isArray(option?.traitImpacts) ? option.traitImpacts : [];
    for (const impact of impacts) {
      const entry = buckets.get(impact.traitName);
      if (!entry) continue;
      if (impact.priority === 'fallback') {
        entry.fallback.push(impact.traitValue);
      } else {
        entry.primary.push(impact.traitValue);
      }
    }
  }
  return buckets;
}

function aggregatePersonality(selectedOptions) {
  const buckets = collectTraitBuckets(selectedOptions);
  return PERSONALITY_TRAITS.map((traitName) => {
    const entry = buckets.get(traitName);
    const value = pickDominantValue(entry.primary)
      || pickDominantValue(entry.fallback)
      || 'غير محدد';
    return { traitName, traitValue: value };
  });
}

module.exports = { PERSONALITY_TRAITS, aggregatePersonality };
