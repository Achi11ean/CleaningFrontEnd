import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import StaffNotes from "./StaffNotes";

export default function AdminAllProfiles() {
  const { authAxios } = useAdmin();

  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [staffRes, adminRes] = await Promise.all([
          authAxios.get("/staff/all"),
          authAxios.get("/admin/all"),
        ]);

        setStaff(staffRes.data || []);
        setAdmins(adminRes.data || []);
      } catch (err) {
        setError("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading profiles...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 font-semibold">{error}</p>;
  }

  return (
    <div className="space-y-10">

      {/* Admin Profiles */}
      <div>
        <h3 className="text-xl font-bold mb-4">Admins</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {admins.map((a) => (
            <ProfileCard
              key={`admin-${a.id}`}
              username={a.username}
              role="Admin"
              profile={a.profile}
            />
          ))}
        </div>
      </div>

      {/* Staff Profiles */}
      <div>
        <h3 className="text-xl font-bold mb-4">Staff</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {staff.map((s) => (
  <ProfileCard
    key={`staff-${s.id}`}
    username={s.username}
    role={s.role}
    profile={s.profile}
    staffId={s.id}          // 👈 ADD
    axios={authAxios}       // 👈 ADD
    isStaff                 // 👈 FLAG
  />
))}

        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  username,
  role,
  profile,
  staffId,
  axios,
  isStaff = false,
}) {
  return (
    <div className="border rounded-xl p-5 flex space-x-4 items-start bg-gray-50">

      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {profile?.photo_url ? (
          <img
            src={profile.photo_url}
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500 text-sm">No Photo</span>
        )}
      </div>

      <div className="flex-1">
        <h4 className="text-lg font-bold">{username}</h4>
        <p className="text-sm text-gray-500 capitalize">{role}</p>

        {profile ? (
          <>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Name:</span>{" "}
              {profile.first_name || "-"} {profile.last_name || ""}
            </p>

            {profile.bio && (
              <p className="mt-2 text-sm text-gray-700 italic">
                {profile.bio}
              </p>
            )}
            {isStaff && staffId && (
  <div className="mt-4">
    <StaffNotes
      axios={axios}
      staffId={staffId}
    />
  </div>
)}

          </>
        ) : (
          <p className="mt-2 text-sm text-orange-600">
            No profile yet
          </p>
        )}
      </div>
      
    </div>
    
  );
}
