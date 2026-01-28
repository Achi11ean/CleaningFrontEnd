import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";

export function useAuthorizedAxios() {
  const { admin, authAxios: adminAxios } = useAdmin();
  const { staff, authAxios: staffAxios } = useStaff();

  if (admin) {
    return { role: "admin", axios: adminAxios };
  }

  if (staff) {
    return {
      role: staff.role,   // "staff" | "manager"
      axios: staffAxios,
    };
  }

  return { role: null, axios: null };
}
