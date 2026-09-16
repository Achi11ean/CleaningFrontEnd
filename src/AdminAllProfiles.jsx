import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Save,
  User,
  X,
} from "lucide-react";
import { useAdmin } from "./AdminContext";
import StaffNotes from "./StaffNotes";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

const EMPTY_PROFILE = {
  first_name: "",
  last_name: "",
  phone_number: "",
  photo_url: "",
  bio: "",
};

export default function AdminAllProfiles() {
  return <CleaningTheme className="ap-theme"><style>{PROFILE_STYLES}</style><div className="ap-board">
    <header className="ap-heading"><span className="ap-mark" aria-hidden="true"><CleaningSparkle /></span><div><p>The people behind the sparkle</p><h2>Team profiles</h2><span>Meet your team and keep staff details up to date.</span></div></header>
    <ProfilesContent />
  </div></CleaningTheme>;
}

function ProfilesContent() {
  const { authAxios } = useAdmin();

  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [staffRes, adminRes] = await Promise.all([
        authAxios.get("/staff/all"),
        authAxios.get("/admin/all"),
      ]);

      setStaff(Array.isArray(staffRes.data) ? staffRes.data : []);
      setAdmins(Array.isArray(adminRes.data) ? adminRes.data : []);
    } catch (err) {
      console.error("Failed to load profiles:", err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load profiles."
      );
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleStaffProfileSaved = (staffId, savedProfile) => {
    setStaff((currentStaff) =>
      currentStaff.map((staffMember) =>
        staffMember.id === staffId
          ? {
              ...staffMember,
              profile: savedProfile,
            }
          : staffMember
      )
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[#7dd3fc33] bg-[#10283d] px-5 py-4 text-sm font-semibold text-[#a9cddd] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#98e7c7]" />
          Loading profiles...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#efabc344] bg-[#42283b] p-5 text-center">
        <p className="font-semibold text-[#ffd1e2]">{error}</p>

        <button
          type="button"
          onClick={loadAll}
          className="
            mt-4 inline-flex items-center justify-center rounded-xl
            bg-[#813c57] px-4 py-2 text-sm font-bold text-white
            transition hover:bg-[#934562]
          "
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Admin Profiles */}
      <section>
        <SectionHeader
          title="Admins"
          count={admins.length}
          description="Administrator profile information."
        />

        {admins.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {admins.map((admin) => (
              <ProfileCard
                key={`admin-${admin.id}`}
                username={admin.username}
                role="Admin"
                profile={admin.profile}
              />
            ))}
          </div>
        ) : (
          <EmptySection message="No administrators were found." />
        )}
      </section>

      {/* Staff Profiles */}
      <section>
        <SectionHeader
          title="Staff"
          count={staff.length}
          description="Create, review, and update staff profiles."
        />

        {staff.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {staff.map((staffMember) => (
              <ProfileCard
                key={`staff-${staffMember.id}`}
                username={staffMember.username}
                role={staffMember.role || "Staff"}
                profile={staffMember.profile}
                staffId={staffMember.id}
                axios={authAxios}
                isStaff
                onProfileSaved={handleStaffProfileSaved}
              />
            ))}
          </div>
        ) : (
          <EmptySection message="No staff members were found." />
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, count, description }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold tracking-tight text-[#e1f2fa]">
            {title}
          </h3>

          <span className="rounded-full bg-[#1e4555] px-2.5 py-1 text-xs font-bold text-white">
            {count}
          </span>
        </div>

        <p className="mt-1 text-sm text-[#9ec1d3]">{description}</p>
      </div>
    </div>
  );
}

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length < 4) return digits;
  if (digits.length < 7)
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function EmptySection({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#8ecfdf44] bg-[#0b2134] p-8 text-center text-sm font-medium text-[#9ec1d3]">
      {message}
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
  onProfileSaved,
}) {
  const [showEditor, setShowEditor] = useState(false);

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    username;

  return (
    <>
      <article
        className="
          ap-card overflow-hidden rounded-3xl border border-[#7dd3fc33]
          bg-[#10283d] shadow-sm transition
          hover:-translate-y-0.5 hover:shadow-lg
        "
      >
        <div className="border-b border-[#7dd3fc26] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5">
          <div className="flex items-start gap-4">
            <ProfilePhoto
              photoUrl={profile?.photo_url}
              displayName={displayName}
            />

            <div className="min-w-0 flex-1">
              <h4 className="ap-name text-lg font-bold text-white">
                {displayName}
              </h4>

              <p className="mt-0.5 truncate text-sm text-[#accdda]">
                @{username}
              </p>

              <span
                className="
                  mt-3 inline-flex rounded-full border border-emerald-300/20
                  bg-emerald-400/10 px-2.5 py-1 text-[10px]
                  font-bold uppercase tracking-[0.16em] text-emerald-200
                "
              >
                {role}
              </span>
            </div>

            {isStaff && staffId && (
              <button
                type="button"
                onClick={() => setShowEditor(true)}
                className={`
                  inline-flex shrink-0 items-center justify-center gap-1.5
                  rounded-xl px-3 py-2 text-xs font-bold transition
                  ${
                    profile
                      ? "border border-white/15 bg-[#10283d]/10 text-white hover:bg-[#10283d]/20"
                      : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  }
                `}
              >
                {profile ? (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Create
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {profile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ProfileDetail
                  label="First name"
                  value={profile.first_name}
                />

                <ProfileDetail
                  label="Last name"
                  value={profile.last_name}
                />
              </div>

              {profile.phone_number && (
                <div className="flex items-center gap-2 rounded-xl bg-[#0b2134] px-3 py-2.5 text-sm text-[#bbd9e8]">
                  <Phone className="h-4 w-4 shrink-0 text-[#98e7c7]" />
                  <a
                    href={`tel:${profile.phone_number}`}
                    className="font-semibold hover:text-[#baf2d8]"
                  >
                    {profile.phone_number}
                  </a>
                </div>
              )}

              {profile.bio ? (
                <div className="rounded-2xl border border-[#7dd3fc26] bg-[#0b2134] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8bafc2]">
                    Bio
                  </p>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#bbd9e8]">
                    {profile.bio}
                  </p>
                </div>
              ) : (
                <p className="text-sm italic text-[#8bafc2]">
                  No biography has been added.
                </p>
              )}

              {isStaff && staffId && (
                <div className="border-t border-[#7dd3fc26] pt-4">
                  <StaffNotes axios={axios} staffId={staffId} />
                </div>
              )}
            </div>
          ) : (
            <div className="py-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#493d2d]">
                <User className="h-5 w-5 text-[#ead3aa]" />
              </div>

              <p className="mt-3 font-bold text-[#d4eaf4]">
                No profile created
              </p>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-[#9ec1d3]">
                Create a profile to add this team member&apos;s name, phone
                number, photo, and biography.
              </p>

              {isStaff && staffId && (
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="
                    mt-4 inline-flex items-center justify-center gap-2
                    rounded-xl bg-[#2a7c68] px-4 py-2.5
                    text-sm font-bold text-white shadow-sm
                    transition hover:bg-[#318c76] active:scale-[0.98]
                  "
                >
                  <Plus className="h-4 w-4" />
                  Create Staff Profile
                </button>
              )}

              {isStaff && staffId && (
                <div className="mt-5 border-t border-[#7dd3fc26] pt-4 text-left">
                  <StaffNotes axios={axios} staffId={staffId} />
                </div>
              )}
            </div>
          )}
        </div>
      </article>

      {showEditor && isStaff && staffId && (
        <StaffProfileModal
          username={username}
          staffId={staffId}
          existingProfile={profile}
          axios={axios}
          onClose={() => setShowEditor(false)}
          onSaved={(savedProfile) => {
            onProfileSaved?.(staffId, savedProfile);
            setShowEditor(false);
          }}
        />
      )}
    </>
  );
}

function ProfilePhoto({ photoUrl, displayName }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const initials = String(displayName || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      className="
        ap-photo flex h-20 w-20 shrink-0 items-center justify-center
        overflow-hidden rounded-2xl border border-white/15
        bg-[#10283d]/10 shadow-xl
      "
    >
      {photoUrl && !imageFailed ? (
        <img
          src={photoUrl}
          alt={displayName}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xl font-bold text-white">
          {initials || <User className="h-6 w-6" />}
        </span>
      )}
    </div>
  );
}

function ProfileDetail({ label, value }) {
  return (
    <div className="rounded-xl border border-[#7dd3fc26] bg-[#0b2134] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8bafc2]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-[#d4eaf4]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function StaffProfileModal({
  username,
  staffId,
  existingProfile,
  axios,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    first_name: existingProfile?.first_name || "",
    last_name: existingProfile?.last_name || "",
    phone_number: existingProfile?.phone_number || "",
    photo_url: existingProfile?.photo_url || "",
    bio: existingProfile?.bio || "",
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const isCreating = !existingProfile;

  useEffect(() => {
    setPreviewFailed(false);
  }, [form.photo_url]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, saving]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setSaveError("");
    setSuccess(false);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
        photo_url: form.photo_url.trim(),
        bio: form.bio.trim(),
      };

      const response = await axios.patch(
        `/admin/staff/${staffId}/profile`,
        payload
      );

      const savedProfile = response?.data?.profile;

      if (!savedProfile) {
        throw new Error("The server did not return the saved profile.");
      }

      setSuccess(true);

      window.setTimeout(() => {
        onSaved(savedProfile);
      }, 450);
    } catch (err) {
      console.error("Failed to save staff profile:", err);

      setSaveError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save this profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const previewName =
    [form.first_name, form.last_name].filter(Boolean).join(" ") || username;

  return (
    <div
      className="
        fixed inset-0 z-[10000] overflow-y-auto
        bg-slate-950/80 p-3 backdrop-blur-md sm:p-6
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-profile-modal-title"
          className="
            relative w-full max-w-2xl overflow-hidden rounded-3xl
            border border-white/10 bg-[#10283d]
            shadow-[0_30px_100px_rgba(0,0,0,0.55)]
          "
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 sm:px-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close profile editor"
              className="
                absolute right-4 top-4 z-10 flex h-9 w-9
                items-center justify-center rounded-full
                border border-white/15 bg-[#10283d]/10 text-white
                transition hover:bg-[#10283d]/20 disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative flex items-center gap-4 pr-12">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-[#10283d]/10">
                {form.photo_url && !previewFailed ? (
                  <img
                    src={form.photo_url}
                    alt={previewName}
                    onError={() => setPreviewFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-emerald-200" />
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Staff Management
                </p>

                <h2
                  id="staff-profile-modal-title"
                  className="mt-1 text-xl font-bold text-white sm:text-2xl"
                >
                  {isCreating ? "Create Staff Profile" : "Edit Staff Profile"}
                </h2>

                <p className="mt-1 text-sm text-[#accdda]">@{username}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileInput
                label="First Name"
                value={form.first_name}
                onChange={(value) => updateField("first_name", value)}
                placeholder="First name"
                autoComplete="given-name"
              />

              <ProfileInput
                label="Last Name"
                value={form.last_name}
                onChange={(value) => updateField("last_name", value)}
                placeholder="Last name"
                autoComplete="family-name"
              />

<ProfileInput
  label="Phone Number"
  value={form.phone_number}
  onChange={(value) =>
    updateField("phone_number", formatPhoneNumber(value))
  }
  placeholder="(555) 555-5555"
  type="tel"
  autoComplete="tel"
/>

              <ProfileInput
                label="Photo URL"
                value={form.photo_url}
                onChange={(value) => updateField("photo_url", value)}
                placeholder="https://example.com/photo.jpg"
                type="url"
                autoComplete="url"
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#a9cddd]">
                Biography
              </span>

              <textarea
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                placeholder="Add a short staff biography..."
                rows={5}
                maxLength={2000}
                className="
                  w-full resize-y rounded-2xl border border-[#7dd3fc33]
                  bg-[#0b2134] px-4 py-3 text-sm text-[#e1f2fa]
                  outline-none transition
                  placeholder:text-[#8bafc2]
                  focus:border-emerald-500 focus:bg-[#10283d]
                  focus:ring-4 focus:ring-emerald-500/10
                "
              />

              <div className="mt-1 flex justify-end">
                <span className="text-xs text-[#8bafc2]">
                  {form.bio.length}/2000
                </span>
              </div>
            </label>

            {saveError && (
              <div className="mt-4 rounded-xl border border-[#efabc344] bg-[#42283b] px-4 py-3 text-sm font-semibold text-[#ffd1e2]">
                {saveError}
              </div>
            )}

            {success && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#91e0b944] bg-[#173e32] px-4 py-3 text-sm font-bold text-[#baf2d8]">
                <Check className="h-4 w-4" />
                Profile saved successfully.
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="
                  inline-flex items-center justify-center rounded-xl
                  border border-[#7dd3fc33] bg-[#10283d] px-4 py-2.5
                  text-sm font-bold text-[#bbd9e8] transition
                  hover:bg-[#0b2134] disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || success}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl bg-[#2a7c68] px-5 py-2.5
                  text-sm font-bold text-white shadow-lg
                  shadow-emerald-600/20 transition
                  hover:bg-[#318c76] active:scale-[0.98]
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isCreating ? "Create Profile" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#a9cddd]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="
          w-full rounded-xl border border-[#7dd3fc33] bg-[#0b2134]
          px-4 py-3 text-sm text-[#e1f2fa] outline-none
          transition placeholder:text-[#8bafc2]
          focus:border-emerald-500 focus:bg-[#10283d]
          focus:ring-4 focus:ring-emerald-500/10
        "
      />
    </label>
  );
}
const PROFILE_STYLES = `
.cleaning-theme.ap-theme{min-height:0;background:radial-gradient(ellipse at top right,#24637744,transparent 60%),#071321;color:#dceff8;border-radius:20px;overflow:visible}.cleaning-theme .ap-theme .ct-page-atmosphere{display:none}.ap-board{position:relative;padding:22px;max-width:1350px;margin:auto;min-width:0}.ap-heading{display:flex;align-items:center;gap:12px;margin-bottom:25px}.ap-mark{width:42px;height:42px;flex-shrink:0;display:grid;place-items:center;border:1px solid #94e5d844;border-radius:13px;background:#1b434f;color:#b3f0dc}.ap-mark svg{width:24px;height:24px}.ap-heading p{font-size:9px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:#97d8d8;margin:0 0 4px!important}.ap-heading h2{font-size:24px;line-height:1.3;letter-spacing:-.03em;font-weight:700;margin:0}.ap-heading>div>span{display:block;font-size:11px;line-height:1.7;color:#9cbfd0;margin-top:6px}.ap-card{border-radius:17px!important;background:linear-gradient(135deg,#142f44,#0e2135)!important;min-width:0}.ap-card>div:first-child{background:radial-gradient(ellipse at top right,#2a6c6344,transparent 65%),#0c2135;padding:17px}.ap-card>div:nth-child(2){padding:17px}.ap-name{overflow-wrap:anywhere;line-height:1.45;font-size:18px}.ap-photo{width:64px!important;height:64px!important;border-radius:14px!important;background:linear-gradient(140deg,#225566,#275347)!important;box-shadow:0 7px 20px #0003!important}.ap-card button{min-height:42px}.ap-card a[href^="tel:"]{min-height:36px;display:inline-flex;align-items:center;overflow-wrap:anywhere}.ap-card [class*="tracking-"]{letter-spacing:.07em}.ap-card h4+ p{font-size:11px}.ap-board button:focus-visible,.ap-board a:focus-visible{outline:3px solid #a0efd6;outline-offset:3px}.ap-board [role=dialog]{background:radial-gradient(ellipse at top,#20526444,transparent 60%),#0e2438!important;border:1px solid #8ad5df44;border-radius:20px}.ap-board [role=dialog] form input,.ap-board [role=dialog] form textarea{color-scheme:dark;background:#0a1e31;color:#e3f2fa;border-color:#7dd3fc38;min-height:46px}.ap-board [role=dialog] form button{min-height:44px}.ap-board [role=dialog] form textarea:focus,.ap-board [role=dialog] form input:focus{outline:2px solid #94e5d0;outline-offset:2px}.ap-board [role=dialog] label>span{font-size:10px;letter-spacing:.07em}.ap-board [role=dialog]>div:first-child{background:radial-gradient(ellipse at top right,#326e6544,transparent 70%),#0b2033}
@media(max-width:640px){.ap-board{padding:13px}.ap-heading{gap:9px;margin-bottom:20px}.ap-heading h2{font-size:21px}.ap-heading p{font-size:8px;letter-spacing:.05em}.ap-mark{width:35px;height:35px}.ap-card>div:first-child,.ap-card>div:nth-child(2){padding:13px}.ap-card>div:first-child>div{gap:10px;flex-wrap:wrap}.ap-name{font-size:16px}.ap-photo{width:52px!important;height:52px!important}.ap-card>div:first-child button{margin-left:auto}.ap-board [role=dialog] form input,.ap-board [role=dialog] form textarea{font-size:16px}.ap-board [role=dialog] h2{font-size:19px}.ap-board [role=dialog] form{padding:15px}.ap-board [role=dialog]>div:first-child{padding:19px 15px}}
@media(prefers-reduced-motion:reduce){.ap-card{transition:none!important;transform:none!important}}
`;
