import axios from "axios";

export const fetchHolidays = async (setHolidays) => {
  try {
    const year = new Date().getFullYear();
    const response = await axios.get(
      `https://api.argentinadatos.com/v1/feriados/${year}`
    );
    setHolidays(response.data.map((holiday) => holiday.fecha));
  } catch (error) {
    console.error("Error fetching holidays", error);
  }
};