export const getFullWeekStartAndEndDates = () => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  startDate.setDate(today.getDate() - 3);
  endDate.setDate(today.getDate() + 3);

  return {
    startDate,
    endDate,
  };
};
