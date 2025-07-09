// Simplified date utils - direct imports for better tree shaking
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import { addDays } from "date-fns/addDays";
import { subDays } from "date-fns/subDays";
import { startOfDay } from "date-fns/startOfDay";
import { endOfDay } from "date-fns/endOfDay";
import { isToday } from "date-fns/isToday";
import { isSameDay } from "date-fns/isSameDay";

// Re-export for consistent usage
export {
  format as formatDate,
  parseISO,
  isAfter,
  isBefore,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isToday,
  isSameDay
};