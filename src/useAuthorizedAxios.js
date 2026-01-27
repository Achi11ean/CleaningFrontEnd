// useAuthorizedAxios.js
import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";

export function useAuthorizedAxios() {
  const { admin, authAxios: adminAxios } = useAdmin();
  const { staff, authAxios: staffAxios } = useStaff();

  if (admin) {
    return { role: "admin", axios: adminAxios };
  }

  if (staff && staff.role === "manager") {
    return { role: "manager", axios: staffAxios };
  }

  return { role: null, axios: null };
}
