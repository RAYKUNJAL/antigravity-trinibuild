import React, { useState } from 'react';
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
    const [typeFilter, setTypeFilter] = useState<UserType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Mock data
    const users: User[] = [
        { id: '1', name: 'Marcus Johnson', email: 'marcus.j@gmail.com', phone: '+1868-555-0123', type: 'vendor', status: 'active', trustScore: 87, verificationLevel: 2, location: 'Port of Spain', joinedAt: '2024-03-15', lastActive: '2024-12-05', flagged: false },
        { id: '2', name: 'Sarah Williams', email: 'sarah.w@yahoo.com', type: 'customer', status: 'active', trustScore: 72, verificationLevel: 1, location: 'San Fernando', joinedAt: '2024-06-22', lastActive: '2024-12-04', flagged: false },
        { id: '3', name: 'Kevin Baptiste', email: 'kevin.b@outlook.com', phone: '+1868-555-0456', type: 'driver', status: 'active', trustScore: 94, verificationLevel: 3, location: 'Chaguanas', joinedAt: '2024-01-10', lastActive: '2024-12-05', flagged: false },
        { id: '4', name: 'Lisa Ramkissoon', email: 'lisa.r@gmail.com', type: 'landlord', status: 'pending', trustScore: 45, verificationLevel: 0, location: 'Arima', joinedAt: '2024-11-28', lastActive: '2024-12-03', flagged: true },
        { id: '5', name: 'David Charles', email: 'david.c@hotmail.com', type: 'job_poster', status: 'suspended', trustScore: 32, verificationLevel: 1, location: 'Diego Martin', joinedAt: '2024-08-05', lastActive: '2024-11-15', flagged: true },
        { id: '6', name: 'Michelle Pierre', email: 'michelle.p@gmail.com', type: 'event_host', status: 'active', trustScore: 91, verificationLevel: 3, location: 'Port of Spain', joinedAt: '2024-02-20', lastActive: '2024-12-05', flagged: false },
    ];

    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        flagged: users.filter(u => u.flagged).length,
        newToday: 8
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || user.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500">Manage all platform users, vendors, and drivers</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
                        <Download className="h-5 w-5" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-trini-red text-white rounded-lg hover:bg-red-600">
                        <UserPlus className="h-5 w-5" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.total} icon={<Users className="h-5 w-5" />} color="blue" />
                <StatCard label="Active" value={stats.active} icon={<CheckCircle className="h-5 w-5" />} color="green" />
                <StatCard label="Flagged" value={stats.flagged} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
                <StatCard label="New Today" value={stats.newToday} icon={<TrendingUp className="h-5 w-5" />} color="purple" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                    <option value="all">All Types</option>
                    <option value="customer">Customers</option>
                    <option value="vendor">Vendors</option>
                    <option value="driver">Drivers</option>
                    <option value="landlord">Landlords</option>
                    <option value="job_poster">Job Posters</option>
                    <option value="event_host">Event Hosts</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Verified</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${user.flagged ? 'bg-red-500/5' : ''}`}>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                                {user.name}
                                                {user.flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <TypeBadge type={user.type} />
                                </td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={user.status} />
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <TrustScoreBadge score={user.trustScore} />
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <VerificationBadge level={user.verificationLevel} />
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    {user.location || '-'}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex justify-end gap-1">
                                        <button className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded" title="View">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 text-gray-500 hover:bg-gray-500/10 rounded" title="Edit">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 text-red-500 hover:bg-red-500/10 rounded" title="Ban">
                                            <Ban className="h-4 w-4" />
                                        </button>
                                    </div>
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
