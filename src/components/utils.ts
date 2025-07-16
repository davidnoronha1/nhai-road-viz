// Utility function to get color scheme based on quality score percentage
export const getQualityColorScheme = (scorePercentage: number) => {
  if (scorePercentage >= 80) {
    return {
      badgeColor: 'green' as const,
      backgroundColor: 'var(--green-4)',
      textColor: 'var(--green-12)'
    };
  } else if (scorePercentage >= 60) {
    return {
      badgeColor: 'yellow' as const,
      backgroundColor: 'var(--yellow-4)',
      textColor: 'var(--yellow-12)'
    };
  } else if (scorePercentage >= 40) {
    return {
      badgeColor: 'orange' as const,
      backgroundColor: 'var(--orange-4)',
      textColor: 'var(--orange-12)'
    };
  } else {
    return {
      badgeColor: 'red' as const,
      backgroundColor: 'var(--red-4)',
      textColor: 'var(--red-12)'
    };
  }
};

// Helper function to expand structure abbreviations
export const expandStructureAbbreviations = (structure: string): string => {
  const abbreviations: { [key: string]: string } = {
    'SVUP': 'Small Vehicle Under Pass',
    'VUP': 'Vehicle Under Pass',
    'LVUP': 'Large Vehicle Under Pass',
    'PUP': 'Pedestrian Under Pass',
    'CUP': 'Cattle Under Pass',
    'AUP': 'Animal Under Pass'
  };

  let expandedStructure = structure;

  Object.entries(abbreviations).forEach(([abbr, fullForm]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    expandedStructure = expandedStructure.replace(regex, `${abbr} (${fullForm})`);
  });

  return expandedStructure;
};
