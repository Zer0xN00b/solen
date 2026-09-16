// The realistic budget engine (Scope doc §21-23).
// Multi-factor cost model: destination x style x interests x experience x premium.

export const destinationCostMultipliers = {
  'Amalfi Coast': 1.45,
  Bali: 0.82,
  Iceland: 1.3,
  Kyoto: 1.05,
  Maldives: 1.55,
  Morocco: 0.78,
  Paris: 1.35,
};

export const styleCostMultipliers = {
  'Slow & Peaceful': 0.92,
  Adventure: 1.08,
  Luxury: 1.32,
  Culture: 0.98,
  'Food & Nightlife': 1.12,
  Nature: 1.02,
};

export const interestCostMultipliers = {
  Food: 0.06,
  Beaches: 0.02,
  Adventure: 0.07,
  Culture: 0.02,
  Shopping: 0.08,
  Nature: 0.02,
  Nightlife: 0.08,
  Art: 0.03,
  Wellness: 0.07,
  Photography: 0.02,
};

export function getJourneyDailyEstimate(
  baseBudget,
  destination,
  travelStyle,
  selectedInterests,
  selectedExperience,
  isPremiumPlus,
  dayIndex,
) {
  const destinationFactor = destinationCostMultipliers[destination] || 1;
  const styleFactor = styleCostMultipliers[travelStyle] || 1;
  const interestFactor = (selectedInterests || []).reduce(
    (total, interest) => total + (interestCostMultipliers[interest] || 0),
    0,
  );
  const experienceFactor =
    selectedExperience === 'wild'
      ? 0.08
      : selectedExperience === 'table'
        ? 0.1
        : selectedExperience === 'soul'
          ? 0.05
          : selectedExperience === 'escape'
            ? 0.08
            : 0;
  const dayRhythm = [0.9, 1, 1.12, 0.96, 1.08, 1.15, 0.94][dayIndex % 7];
  const premiumFactor = isPremiumPlus ? 1.35 : 1;

  return Math.round(
    Math.max(800, baseBudget) *
      destinationFactor *
      styleFactor *
      (1 + interestFactor + experienceFactor) *
      dayRhythm *
      premiumFactor,
  );
}
