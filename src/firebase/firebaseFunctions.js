import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const fetchCustomSchedules = async (setCustomSchedules) => {
  const querySnapshot = await getDocs(collection(db, "customSchedules"));
  const schedules = querySnapshot.docs.map(doc => doc.data());
  setCustomSchedules(schedules);
};

const fetchInactiveSchedules = async (setInactiveSchedules) => {
  const querySnapshot = await getDocs(collection(db, "inactiveSchedules"));
  const schedules = querySnapshot.docs.map(doc => doc.data());
  setInactiveSchedules(schedules);
};

const fetchVacaciones = async (setVacaciones) => {
  const querySnapshot = await getDocs(collection(db, "vacaciones"));
  const vacaciones = querySnapshot.docs.map(doc => doc.data());
  setVacaciones(vacaciones);
};

const fetchVacacionesByMonth = async (month, year, setVacaciones) => {
  const q = query(
    collection(db, "vacaciones"),
    where("desde", ">=", `${year}-${month.toString().padStart(2, '0')}-01`),
    where("desde", "<=", `${year}-${month.toString().padStart(2, '0')}-31`)
  );
  const querySnapshot = await getDocs(q);
  const vacaciones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setVacaciones(vacaciones);
};

const deleteVacacion = async (id) => {
  await deleteDoc(doc(db, "vacaciones", id));
};

const handleSaveCustomSchedule = async (customSchedule, setCustomSchedules, customSchedules, setModalOpen) => {
  try {
    const q = query(
      collection(db, "customSchedules"),
      where("dates", "array-contains-any", customSchedule.dates),
      where("startHour", "==", customSchedule.startHour),
      where("endHour", "==", customSchedule.endHour)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Update existing custom schedule
      querySnapshot.forEach(async (docSnapshot) => {
        await updateDoc(doc(db, "customSchedules", docSnapshot.id), customSchedule);
      });
      setCustomSchedules(customSchedules.map(cs => 
        cs.dates.some(date => customSchedule.dates.includes(date)) && 
        cs.startHour === customSchedule.startHour && 
        cs.endHour === customSchedule.endHour ? customSchedule : cs
      ));
    } else {
      // Add new custom schedule
      await addDoc(collection(db, "customSchedules"), customSchedule);
      setCustomSchedules([...customSchedules, customSchedule]);
    }
    setModalOpen(false);
  } catch (error) {
    console.error("Error saving custom schedule: ", error);
  }
};

const handleSaveInactiveSchedule = async (inactiveSchedule, setInactiveSchedules, inactiveSchedules, setInactiveModalOpen) => {
  try {
    await addDoc(collection(db, "inactiveSchedules"), inactiveSchedule);
    setInactiveSchedules([...inactiveSchedules, inactiveSchedule]);
    setInactiveModalOpen(false);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

const handleSaveVacaciones = async (vacacion, setVacaciones, vacaciones, setVacacionesModalOpen) => {
  try {
    await addDoc(collection(db, "vacaciones"), vacacion);
    setVacaciones([...vacaciones, vacacion]);
    setVacacionesModalOpen(false);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

const fetchCustomSchedulesByDate = async (date, setSchedules) => {
  const q = query(
    collection(db, "customSchedules"),
    where("dates", "array-contains", date)
  );
  const querySnapshot = await getDocs(q);
  const schedules = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setSchedules(schedules);
};

const updateCustomSchedule = async (id, updatedSchedule) => {
  await updateDoc(doc(db, "customSchedules", id), updatedSchedule);
};

const deleteCustomSchedule = async (id) => {
  await deleteDoc(doc(db, "customSchedules", id));
};

export {
  fetchCustomSchedules,
  fetchInactiveSchedules,
  fetchVacaciones,
  fetchVacacionesByMonth,
  deleteVacacion,
  handleSaveCustomSchedule,
  handleSaveInactiveSchedule,
  handleSaveVacaciones,
  fetchCustomSchedulesByDate,
  updateCustomSchedule,
  deleteCustomSchedule
};