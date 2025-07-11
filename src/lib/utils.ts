export const getGradeDisplayName = (grade: number): string => {
  switch (grade) {
    case 7: return '1st Preparatory'
    case 8: return '2nd Preparatory'
    case 9: return '3rd Preparatory'
    case 10: return '1st Secondary'
    case 11: return '2nd Secondary'
    case 12: return '3rd Secondary'
    default: return `Grade ${grade}`
  }
}

export const getGradeDisplayWithNumber = (grade: number): string => {
  return `${getGradeDisplayName(grade)} (${grade})`
}

export const MAX_PLAYERS_PER_GRADE = 4
export const GRADES = [7, 8, 9, 10, 11, 12] as const 