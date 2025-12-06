import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Shield,
    Ban,
    CheckCircle,
    AlertTriangle,
    Eye,
    Edit,
    Trash2,
    Download,
    UserPlus,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Star,
    TrendingUp
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type UserType = 'customer' | 'vendor' | 'driver' | 'landlord' | 'job_poster' | 'event_host';
type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';
type VerificationLevel = 0 | 1 | 2 | 3;

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    type: UserType;
    status: UserStatus;
    trustScore: number;
    verificationLevel: VerificationLevel;
    location?: string;
    joinedAt: string;
    lastActive: string;
    flagged: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const UserManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState<string>('all');

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (loading) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500">Manage platform users and access roles</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchUsers} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="store_admin">Store Admin</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold uppercase">
                                            {(user.full_name || user.email || '?')[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {user.full_name || 'Unnamed User'}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <select
                                        value={user.role || 'user'}
                                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-medium border-none focus:ring-2 focus:ring-trini-red cursor-pointer
                                            ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                    user.role === 'store_admin' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'}`}
                                    >
                                        <option value="user">User</option>
                                        <option value="store_admin">Store Admin</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`text-${color}-500 mb-2`}>{icon}</div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

const TypeBadge: React.FC<{ type: UserType }> = ({ type }) => {
    const labels: Record<UserType, string> = {
        customer: 'Customer',
        vendor: 'Vendor',
        driver: 'Driver',
        landlord: 'Landlord',
        job_poster: 'Job Poster',
        event_host: 'Event Host'
    };
    return (
        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
            {labels[type]}
        </span>
    );
};

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
    const config: Record<UserStatus, { bg: string; text: string }> = {
        active: { bg: 'bg-green-500/10', text: 'text-green-600' },
        pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
        suspended: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
        banned: { bg: 'bg-red-500/10', text: 'text-red-600' }
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${config[status].bg} ${config[status].text}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const TrustScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
    return (
        <span className={`font-bold ${color}`}>{score}</span>
    );
};

const VerificationBadge: React.FC<{ level: VerificationLevel }> = ({ level }) => {
    const config: Record<VerificationLevel, { label: string; color: string }> = {
        0: { label: 'None', color: 'text-gray-400' },
        1: { label: 'Basic', color: 'text-blue-500' },
        2: { label: 'ID', color: 'text-green-500' },
        3: { label: 'Pro', color: 'text-purple-500' }
    };
    return (
        <div className="flex items-center justify-center gap-1">
            <Shield className={`h-4 w-4 ${config[level].color}`} />
            <span className={`text-xs ${config[level].color}`}>{config[level].label}</span>
        </div>
    );
};

export default UserManagement;
