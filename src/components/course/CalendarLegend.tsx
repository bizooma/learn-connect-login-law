
const CalendarLegend = () => {
  return (
    <div className="mt-3 text-xs text-gray-500 space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded"></div>
        <span>Meetings & Sessions</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-indigo-200 border border-indigo-300 rounded"></div>
        <span>Other Events</span>
      </div>
    </div>
  );
};

export default CalendarLegend;
