// src/features/admin/ManageUsers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Pencil,
  Search as SearchIcon,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import Card from "@/components/Card.jsx";

const roleDisplayNames = {
  admin: "Admin",
  doctor: "Doctor",
  patient: "Patient",
};

const rolePalette = {
  admin: "bg-purple-50 text-purple-700 border border-purple-100",
  doctor: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  patient: "bg-sky-50 text-sky-700 border border-sky-100",
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [loading, setLoading] = useState(true);

  const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${laravelUrl}/api/admin/users`);
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [laravelUrl]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${laravelUrl}/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("User deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting user");
    }
  };

  const roleCounts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const roleKey = (user.role || "").toLowerCase();
        if (roleKey in acc) {
          acc[roleKey] += 1;
        }
        acc.total += 1;
        return acc;
      },
      { total: 0, admin: 0, doctor: 0, patient: 0 }
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        (u.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        roleFilter === "All Roles" ||
        (u.role ?? "").toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-8">
      <Card className="border-0 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100/60 shadow-xl px-6 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <UsersIcon size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Admin console</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Manage Users</h1>
              <p className="text-xs text-emerald-400 mt-1">
                Onboard clinicians, assign roles, and keep your patient portal secure.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-500">
            <HeroMetric icon={<UserPlus size={14} />} label="Total accounts" value={roleCounts.total} />
            <HeroMetric icon={<ShieldCheck size={14} />} label="Admin team" value={roleCounts.admin} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          tone="emerald"
          icon={<UsersIcon size={18} />}
          label="All users"
          value={roleCounts.total}
        />
        <SummaryTile
          tone="purple"
          icon={<ShieldCheck size={18} />}
          label="Admins"
          value={roleCounts.admin}
        />
        <SummaryTile
          tone="cyan"
          icon={<Stethoscope size={18} />}
          label="Doctors"
          value={roleCounts.doctor}
        />
        <SummaryTile
          tone="sky"
          icon={<UserIcon size={18} />}
          label="Patients"
          value={roleCounts.patient}
        />
      </div>

      <Card className="rounded-2xl bg-white shadow-md ring-1 ring-emerald-100/70 px-6 py-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-[0.2em]">
            <SearchIcon size={16} className="text-emerald-400" />
            <span>Filters</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:w-72">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <FilterPill
                label="Role"
                icon={<ShieldCheck size={14} className="text-emerald-400" />}
              >
                <select
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option>All Roles</option>
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Patient</option>
                </select>
              </FilterPill>
            </div>
          </div>
        </div>
        {(roleFilter !== "All Roles" || searchTerm.trim() !== "") && (
          <div className="flex flex-wrap gap-2">
            {roleFilter !== "All Roles" && (
              <ActiveFilter label={`Role: ${roleFilter}`} onClear={() => setRoleFilter("All Roles")} />
            )}
            {searchTerm.trim() !== "" && (
              <ActiveFilter label={`Query: ${searchTerm}`} onClear={() => setSearchTerm("")} />
            )}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden rounded-2xl ring-1 ring-slate-100 shadow-sm p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Linked Patient</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-sm">
                      <Loader2 className="animate-spin" size={16} />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/30 transition border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${rolePalette[(u.role || '').toLowerCase()] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {roleDisplayNames[(u.role || '').toLowerCase()] || u.role || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.patient_id ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/users/${u.id}/edit`}
                          title="Edit user"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(u.id)}
                          title="Delete user"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const SummaryTile = ({ tone = "emerald", icon, label, value }) => {
  const toneStyles = {
    emerald: {
      card: "bg-emerald-50 border border-emerald-100 text-emerald-700",
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    purple: {
      card: "bg-purple-50 border border-purple-100 text-purple-700",
      iconWrap: "bg-purple-100 text-purple-700",
    },
    cyan: {
      card: "bg-cyan-50 border border-cyan-100 text-cyan-700",
      iconWrap: "bg-cyan-100 text-cyan-700",
    },
    sky: {
      card: "bg-sky-50 border border-sky-100 text-sky-700",
      iconWrap: "bg-sky-100 text-sky-700",
    },
  };
  const palette = toneStyles[tone] ?? toneStyles.emerald;

  return (
    <Card className={`flex items-center gap-3 px-4 py-3 shadow-sm ${palette.card}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${palette.iconWrap}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
      </div>
    </Card>
  );
};

const HeroMetric = ({ icon, label, value }) => (
  <div className="rounded-xl bg-white/80 border border-white/70 px-4 py-3 shadow-sm flex items-center gap-3 text-slate-600">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-500">
      {icon}
    </div>
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  </div>
);

const FilterPill = ({ label, icon, children }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.2em] text-emerald-400">
      {icon}
      {label}
    </span>
    {children}
  </div>
);

const ActiveFilter = ({ label, onClear }) => (
  <button
    onClick={onClear}
    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
  >
    {label}
    <span className="text-slate-400">×</span>
  </button>
);

export default ManageUsers;
