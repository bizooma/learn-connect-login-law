
export const getLevelColor = (level: string) => {
  // Extract the numeric part for color coding
  if (level.includes('-100')) {
    return "bg-green-100 text-green-800"; // Level 100 (entry level)
  } else if (level.includes('-200')) {
    return "bg-yellow-100 text-yellow-800"; // Level 200 (intermediate)
  } else if (level.includes('-300')) {
    return "bg-red-100 text-red-800"; // Level 300 (advanced)
  }
  
  // Fallback for old system or unknown levels
  switch (level) {
    case "Beginner":
      return "bg-green-100 text-green-800";
    case "Intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "Advanced":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getLevelDisplayName = (level: string) => {
  // Convert level codes to display names
  const levelMap: { [key: string]: string } = {
    'Sales-100': 'Sales Level 100',
    'Sales-200': 'Sales Level 200',
    'Sales-300': 'Sales Level 300',
    'Legal-100': 'Legal Level 100',
    'Legal-200': 'Legal Level 200',
    'Legal-300': 'Legal Level 300',
    'Customer-Service-100': 'Customer Service Level 100',
    'Customer-Service-200': 'Customer Service Level 200',
    'Customer-Service-300': 'Customer Service Level 300',
    'Leadership-100': 'Leadership Level 100',
    'Leadership-200': 'Leadership Level 200',
    'Leadership-300': 'Leadership Level 300',
  };
  
  return levelMap[level] || level;
};
