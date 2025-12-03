import { Eye, EyeClosed, MoreHorizontal, Pencil, ShieldUser, Trash, UserPlus, Key, User } from 'lucide-react';
import Heading from '../element/Heading';
import { useEffect, useState } from 'react';
import { fetchSheet, postToSheet } from '@/lib/fetchers';
import { allPermissionKeys, type UserPermissions } from '@/types/sheets';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '@/context/AuthContext';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface UsersTableData {
    username: string;
    name: string;
    password: string;
    permissions: string[];
    rowIndex: number;
}

function camelToTitleCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (char) => char.toUpperCase());
}

export default () => {
    const { user: currentUser } = useAuth();

    const [tableData, setTableData] = useState<UsersTableData[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UsersTableData | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        if (!openDialog) {
            setSelectedUser(null);
        }
    }, [openDialog]);

    function fetchUser() {
        setDataLoading(true);
        fetchSheet('USER').then((res) => {
            setTableData(
                (res as UserPermissions[]).map((user) => {
                    const permissionKeys = Object.keys(user).filter(
                        (key): key is keyof UserPermissions =>
                            !['username', 'password', 'name', 'rowIndex'].includes(key) &&
                            user[key as keyof UserPermissions] === true
                    );

                    return {
                        username: user.username,
                        name: user.name,
                        password: user.password,
                        permissions: permissionKeys,
                        rowIndex: user.rowIndex,
                    };
                })
            );
            setDataLoading(false);
        });
    }

    useEffect(() => {
        fetchUser();
    }, []);

    const columns: ColumnDef<UsersTableData>[] = [
        {
            accessorKey: 'username',
            header: 'Username',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User size={20} className="text-primary" />
                    </div>
                    <div className="text-center">
                        <div className="font-semibold">{row.original.username}</div>
                        <div className="text-sm text-gray-500">{row.original.name}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'permissions',
            header: 'Permissions',
            cell: ({ row }) => {
                const permissions = row.original.permissions;
                return (
                    <div className="flex justify-center">
                        <HoverCard>
                            <HoverCardTrigger>
                                <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                                    {permissions.slice(0, 3).map((perm, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {camelToTitleCase(perm)}
                                        </Badge>
                                    ))}
                                    {permissions.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{permissions.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto p-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold">All Permissions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {permissions.map((perm, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {camelToTitleCase(perm)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const user = row.original;
                const isCurrentUser = user.username === currentUser.username;
                const isAdmin = user.username === 'admin';
                
                return (
                    <div className="flex justify-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                asChild
                                disabled={isAdmin || isCurrentUser}
                            >
                                <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    disabled={isAdmin || isCurrentUser}
                                >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-6 w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setOpenDialog(true);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        try {
                                            if (isAdmin) {
                                                throw new Error();
                                            }
                                            await postToSheet(
                                                [{ rowIndex: user.rowIndex }],
                                                'delete',
                                                'USER'
                                            );
                                            toast.success(`Deleted ${user.name} successfully`);
                                            setTimeout(fetchUser, 1000);
                                        } catch {
                                            toast.error('Failed to delete user');
                                        }
                                    }}
                                    className="cursor-pointer text-destructive"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete User
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const schema = z.object({
        name: z.string().nonempty(),
        username: z.string().nonempty(),
        password: z.string().nonempty(),
        permissions: z.array(z.string()),
    });

    const form = useForm({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (selectedUser) {
            form.reset({
                username: selectedUser.username,
                name: selectedUser.name,
                password: selectedUser.password,
                permissions: selectedUser.permissions,
            });
            return;
        }
        form.reset();
    }, [selectedUser]);

    async function onSubmit(value: z.infer<typeof schema>) {
        if (
            tableData.map((d) => d.username).includes(value.username) &&
            value.username !== selectedUser?.username
        ) {
            toast.error('Username already exists');
            return;
        }
        if (selectedUser) {
            try {
                const row: Partial<UserPermissions> = {
                    rowIndex: selectedUser.rowIndex,
                    username: value.username,
                    name: value.name,
                    password: value.password,
                };

                allPermissionKeys.forEach((perm) => {
                    row[perm] = value.permissions.includes(perm);
                });

                await postToSheet([row], 'update', 'USER');
                setOpenDialog(false);
                setTimeout(fetchUser, 1000);
                toast.success('Updated user settings');
            } catch {
                toast.error('Failed to update user settings');
            }
            return;
        }
        try {
            const row: Partial<UserPermissions> = {
                username: value.username,
                name: value.name,
                password: value.password,
            };

            allPermissionKeys.forEach((perm) => {
                row[perm] = value.permissions.includes(perm);
            });

            await postToSheet([row], 'insert', 'USER');
            setOpenDialog(false);
            setTimeout(fetchUser, 1000);
            toast.success('Created user successfully');
        } catch {
            toast.error('Failed to update user settings');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    const stats = {
        totalUsers: tableData.length,
        adminUsers: tableData.filter(u => u.username === 'admin').length,
        activePermissions: allPermissionKeys.length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Dialog open={openDialog} onOpenChange={(open) => setOpenDialog(open)}>
                <div className="p-4 md:p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header Section */}
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border">
                                        <ShieldUser size={32} className="text-primary" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            Administration
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            Manage user permissions and access control
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="flex gap-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                                        <div className="text-sm font-medium text-gray-500">Total Users</div>
                                        <div className="text-2xl font-bold text-primary mt-1">
                                            {stats.totalUsers}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                                        <div className="text-sm font-medium text-gray-500">Permissions</div>
                                        <div className="text-2xl font-bold text-blue-600 mt-1">
                                            {stats.activePermissions}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-6">
                                    <div className="mb-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    User Management
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    View and manage system users and their permissions
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm text-gray-500">
                                                    Showing {tableData.length} users
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        setOpenDialog(true);
                                                        setSelectedUser(null);
                                                    }}
                                                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                                                >
                                                    <UserPlus className="mr-2" />
                                                    Create User
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <DataTable
                                            data={tableData}
                                            columns={columns}
                                            searchFields={['name', 'username', 'permissions']}
                                            dataLoading={dataLoading}
                                            className="h-[60dvh]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="mt-6">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Administration Guidelines</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    <ShieldUser size={16} />
                                                    Admin Protection
                                                </div>
                                                <p>The "admin" user cannot be edited or deleted</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    <User size={16} />
                                                    Self Protection
                                                </div>
                                                <p>You cannot edit or delete your own account</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    <Key size={16} />
                                                    Permissions
                                                </div>
                                                <p>Grant only necessary permissions to users</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Dialog */}
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                            <DialogHeader className="text-center">
                                <DialogTitle className="text-2xl">
                                    {selectedUser ? 'Edit User' : 'Create New User'}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedUser 
                                        ? `Modify settings for ${selectedUser.name}`
                                        : 'Add a new user to the system'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border">
                                <h3 className="text-lg font-bold mb-4 text-gray-800">User Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Username *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Enter username" 
                                                        {...field}
                                                        className="h-12"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Full Name *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter user's full name"
                                                        {...field}
                                                        className="h-12"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base">Password *</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showPassword ? 'text' : 'password'}
                                                                placeholder="Enter password"
                                                                {...field}
                                                                className="h-12 pr-12"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                type="button"
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent active:bg-transparent"
                                                                tabIndex={-1}
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800">Permissions</h3>
                                    <span className="text-sm text-gray-500">
                                        {form.watch('permissions')?.length || 0} selected
                                    </span>
                                </div>
                                
                                <FormField
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50">
                                                {allPermissionKeys.map((perm) => (
                                                    <FormField
                                                        key={perm}
                                                        control={form.control}
                                                        name="permissions"
                                                        render={() => (
                                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        id={perm}
                                                                        checked={field.value?.includes(perm)}
                                                                        onCheckedChange={(checked) => {
                                                                            const values = field.value || [];
                                                                            checked
                                                                                ? field.onChange([...values, perm])
                                                                                : field.onChange(values.filter(p => p !== perm));
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel
                                                                    className="font-normal cursor-pointer text-sm"
                                                                    htmlFor={perm}
                                                                >
                                                                    {camelToTitleCase(perm)}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-3">
                                <DialogClose asChild>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        Cancel
                                    </Button>
                                </DialogClose>

                                <Button 
                                    type="submit" 
                                    disabled={form.formState.isSubmitting}
                                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                                >
                                    {form.formState.isSubmitting && (
                                        <Loader
                                            size={20}
                                            color="white"
                                            className="mr-2"
                                        />
                                    )}
                                    {selectedUser ? 'Save Changes' : 'Create User'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};