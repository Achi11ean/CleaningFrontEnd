import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import StaffNotes from "./StaffNotes";

export default function ManagerAllStaffProfiles() {
  const { authAxios, staff } = useStaff();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await authAxios.get("/staff/all");
        setStaffList(res.data || []);
      } catch (err) {
        setError("Failed to load staff");
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading staff...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 font-semibold">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">👥 Staff Profiles</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {staffList.map((s) => (
          <ProfileCard
            key={s.id}
            username={s.username}
            role={s.role}
            profile={s.profile}
            staffId={s.id}
            axios={authAxios}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ username, role, profile, staffId, axios }) {
  return (
    <div className="border rounded-xl p-5 bg-gray-50 space-y-4">

      <div className="flex space-x-4 items-start">
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

          {profile && (
            <>
              <p className="mt-1 text-sm">
                <span className="font-semibold">Name:</span>{" "}
                {profile.first_name || "-"} {profile.last_name || ""}
              </p>

              {profile.bio && (
                <p className="mt-2 text-sm text-gray-700 italic">
                  {profile.bio}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🔒 Manager notes */}
      <StaffNotes axios={axios} staffId={staffId} />
    </div>
  );
}
