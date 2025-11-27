import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
    SidebarFooter,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useSheets } from '@/context/SheetsContext';
import type { RouteAttributes } from '@/types';
import { LogOut, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from './Logo';

interface AppSidebarProps {
    items: RouteAttributes[];
}

export default function AppSidebar({ items }: AppSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    
    const { 
        indentSheet, 
        storeInSheet, 
        issueSheet,
        fullkittingSheet,
        pcReportSheet,
        poMasterSheet,
        tallyEntrySheet,
        receivedSheet,
        paymentHistorySheet,
        updateAll, 
        allLoading 
    } = useSheets();
    
    const { user, logout } = useAuth();

    const filteredItems = items.filter((item) => {
        if (item.gateKey) {
            return user[item.gateKey as keyof typeof user] === true || 
                   user[item.gateKey as keyof typeof user] === "true";
        }
        return true;
    });

    const getSheetData = (path: string) => {
        switch (path) {
            case 'Issue-data':
            case 'store-issue':
                return issueSheet || [];
            case 'store-in':
                return storeInSheet || [];
            case 'Full-Kiting':
                return fullkittingSheet || [];
            case 'take-entry-by-tally':
                return tallyEntrySheet || [];
            case 'po-history':
            case 'create-po':
                return poMasterSheet || [];
            case 'pending-poss':
                return indentSheet || [];
            case 'Bill-Not-Received':
            case 'Quality-Check-In-Received-Item':
            case 'Send-Debit-Note':
                return storeInSheet || [];
            case 'audit-data':
                return tallyEntrySheet || [];
            case 'Payment-Status':
                return paymentHistorySheet || [];
            case 'DBforPc':
                return pcReportSheet || [];
            default:
                return indentSheet || [];
        }
    };

    const getNotificationCount = (item: RouteAttributes) => {
        if (!item.notifications) return 0;
        
        const sheetData = getSheetData(item.path);
        return item.notifications(sheetData);
    };

    const isActivePath = (path: string) => {
        return location.pathname.slice(1) === path;
    };

    return (
        <Sidebar 
            side="left" 
            variant="inset" 
            collapsible="offcanvas" 
            className="border-r border-gray-300 bg-green-50 min-w-[280px]"
        >
            {/* Header Section */}
            <SidebarHeader className="p-6 border-b border-gray-300 bg-green-50">
                <div className="flex flex-col gap-4">
                    {/* Logo and Title */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                                <Logo size={100} />
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Fixed Asset
                                    </h2>
                                    <p className="text-xs font-medium text-gray-600 uppercase">
                                        MANAGEMENT SYSTEM
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                    </div>

                    <SidebarSeparator className="bg-gray-300" />

                    {/* User Info Card */}
                    <div className="rounded-lg bg-green-100 p-3 border border-green-200">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-md bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        @{user.username}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => logout()}
                                className="h-8 w-8 rounded-md border border-gray-300"
                            >
                                <LogOut className="h-4 w-4 text-gray-700" />
                            </Button>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            {/* Navigation Menu */}
            <SidebarContent className="flex-1 py-3 px-2">
                <SidebarGroup>
                    <SidebarMenu className="space-y-1">
                        {filteredItems.map((item, index) => {
                            const notificationCount = getNotificationCount(item);
                            const isActive = isActivePath(item.path);

                            return (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton
                                        className={`rounded-lg py-3 px-3 flex justify-between items-center font-medium
                                            ${isActive 
                                                ? "bg-green-600 text-white border-l-4 border-green-700" 
                                                : "text-gray-700 hover:bg-green-100 hover:text-gray-900 border-l-2 border-transparent"
                                            }`}
                                        onClick={() => navigate(item.path)}
                                        isActive={isActive}
                                    >
                                        <div className="flex gap-3 items-center min-w-0 flex-1">
                                            <div className={isActive ? "text-white" : "text-gray-600"}>
                                                {item.icon}
                                            </div>
                                            <span className="font-medium text-sm truncate flex-1">
                                                {item.name}
                                            </span>
                                        </div>
                                        
                                        {/* Notification Badge */}
                                        {notificationCount > 0 && (
                                            <div className="ml-2 flex-shrink-0">
                                                <span className={`
                                                    min-w-6 h-6 rounded-md px-1 text-xs font-bold
                                                    bg-red-500 text-white 
                                                    flex items-center justify-center
                                                    ${notificationCount > 99 ? 'min-w-7 text-xs' : ''}
                                                `}>
                                                    {notificationCount > 99 ? '99+' : notificationCount}
                                                </span>
                                            </div>
                                        )}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-4 border-t border-gray-300 bg-green-50">
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Powered by{' '}
                        <a 
                            className="font-medium text-green-600 hover:text-green-700" 
                            href="https://botivate.in" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Botivate
                        </a>
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}