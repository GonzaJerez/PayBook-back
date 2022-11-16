export const getNumberOfWeek = (date: Date) => {
  date.setHours(0, 0, 0, 0); //Nos aseguramos de limpiar la hora.
  date.setDate(date.getDate() + 4 - (date.getDay() || 7)); // Recorremos los días para asegurarnos de estar "dentro de la semana"
  //Finalmente, calculamos redondeando y ajustando por la naturaleza de los números en JS:
  return Math.ceil(
    ((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 8.64e7 +
      1) /
      7,
  );
};
