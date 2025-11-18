import '@/index.css';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '@/context/AuthContext.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from './components/views/Login';
import CreateIndent from './components/views/CreateIndent';
import Dashboard from './components/views/Dashboard';
import App from './App';
import ApproveIndent from '@/components/views/ApproveIndent';
import { SheetsProvider } from './context/SheetsContext';
import VendorUpdate from './components/views/VendorUpdate';
import RateApproval from './components/views/RateApproval';
import StoreOutApproval from './components/views/StoreOutApproval';
import TrainnigVideo from './components/views/TrainingVideo';
import Liecense from './components/views/License'
import MakePayment from './components/views/MakePayment';
import type { RouteAttributes } from './types';
import {
    LayoutDashboard,
    ClipboardList,
    UserCheck,
    Users,
    ClipboardCheck,
    Truck,
    PackageCheck,
    ShieldUser,
    FilePlus2,
    ListTodo,
    Package2,
    Store,
    KeyRound,
    VideoIcon,
    RotateCcw
} from 'lucide-react';
import type { UserPermissions } from './types/sheets';
import Administration from './components/views/Administration';
import Loading from './components/views/Loading';
import CreatePO from './components/views/CreatePO';
import PendingIndents from './components/views/PendingIndents';
import Order from './components/views/Order';
import Inventory from './components/views/Inventory';
import POMaster from './components/views/POMaster';
import StoreIssue from './components/views/StoreIssue';
import QuantityCheckInReceiveItem from './components/views/QuantityCheckInReceiveItem';
import ReturnMaterialToParty from './components/views/ReturnMaterialToParty';
import SendDebitNote from './components/views/SendDebitNote';
import IssueData from './components/views/IssueData';
import GetLift from './components/views/GetLift';
import StoreIn from './components/views/StoreIn';
import AuditData from './components/views/AuditData';
import RectifyTheMistake from './components/views/RectifyTheMistake';
import ReauditData from './components/views/ReauditData';
import TakeEntryByTally from './components/views/TakeEntryByTally';
import ExchangeMaterials from './components/views/ExchangeMaterials';
import DBforPc from './components/views/DBforPC';
import AgainAuditing from './components/views/AgainAuditing'
import BillNotReceived from './components/views/BillNotReceived';
import FullKiting from './components/views/FullKiting';
import PendingPo from './components/views/PendingPo';
import PaymentStatus from './components/views/PaymentStatus';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { loggedIn, loading } = useAuth();
    if (loading) return <Loading />;
    return loggedIn ? children : <Navigate to="/login" />;
}

function GatedRoute({
    children,
    identifier,
}: {
    children: React.ReactNode;
    identifier?: keyof UserPermissions;
}) {
    const { user } = useAuth();
    if (!identifier) return children;
    if (!user || !(user as any)[identifier]) {
        return <Navigate to="/" replace />;
    }
    return children;
}

const routes: RouteAttributes[] = [
    {
        path: '',
        name: 'Dashboard',
        icon: <LayoutDashboard size={20} />,
        element: <Dashboard />,
        notifications: () => 0,
    },
    {
        path: 'store-issue',
        gateKey: 'storeIssue',
        name: 'Store Issue',
        icon: <ClipboardList size={20} />,
        element: <StoreIssue />,
        notifications: () => 0,
    },

    {
    path: 'Issue-data',
    gateKey: 'issueData',
    name: 'Issue Data',
    icon: <ClipboardCheck size={20} />,
    element: <IssueData />,
    notifications: (issueSheet: any[]) =>
        issueSheet.filter((sheet: any) =>
            sheet.planned1 &&
            sheet.planned1.toString().trim() !== '' &&
            (!sheet.actual1 || sheet.actual1.toString().trim() === '')
        ).length,
},


    {
        path: 'inventory',
        name: 'Inventory',
        icon: <Store size={20} />,
        element: <Inventory />,
        notifications: () => 0,
    },

    {
        path: 'create-indent',
        gateKey: 'createIndent',
        name: 'Create Indent',
        icon: <ClipboardList size={20} />,
        element: <CreateIndent />,
        notifications: () => 0,
    },
    {
        path: 'approve-indent',
        gateKey: 'indentApprovalView',
        name: 'Approve Indent',
        icon: <ClipboardCheck size={20} />,
        element: <ApproveIndent />,
        notifications: (sheets: any[]) =>
            sheets.filter(
                (sheet: any) =>
                    sheet.planned1 !== '' &&
                    sheet.vendorType === '' 
            ).length,
    },
    {
        path: 'vendor-rate-update',
        gateKey: 'updateVendorView',
        name: 'Vendor Rate Update',
        icon: <UserCheck size={20} />,
        element: <VendorUpdate />,
        notifications: (sheets: any[]) =>
            sheets.filter((sheet: any) => sheet.planned2 !== '' && sheet.actual2 === '').length,
    },
    {
        path: 'three-party-approval',
        gateKey: 'threePartyApprovalView',
        name: 'Three Party Approval',
        icon: <Users size={20} />,
        element: <RateApproval />,
        notifications: (sheets: any[]) =>
            sheets.filter(
                (sheet: any) =>
                    sheet.planned3 !== '' &&
                    sheet.actual3 === '' &&
                    sheet.vendorType === 'Three Party'
            ).length,
    },
    // {
    //     path: 'pending-pos',
    //     gateKey: 'pendingIndentsView',
    //     name: 'PO to Make/Not',
    //     icon: <ListTodo size={20} />,
    //     element: <PendingIndents />,
    //     notifications: (sheets: any[]) =>
    //         sheets.filter((sheet: any) => sheet.planned4 !== '' && sheet.actual4 === '').length,
    // },
//     {
//     path: 'pending-poss',
//     name: 'Pending PO',
//     icon: <FilePlus2 size={20} />,
//     element: <PendingPo />,
//     notifications: (sheets: any[]) =>
//         sheets.filter((sheet: any) => 
//             sheet.poRequred && 
//             sheet.poRequred.toString().trim() === 'Yes'
//         ).length,
// },
    {
        path: 'create-po',
        gateKey: 'createPo',
        name: 'Create PO',
        icon: <FilePlus2 size={20} />,
        element: <CreatePO />,
        notifications: () => 0,
    },

    {
    path: 'po-history',
    gateKey: 'ordersView',
    name: 'PO History',
    icon: <Package2 size={20} />,
    element: <Order />,
    notifications: (sheets: any[]) => {
        // Get all unique PO numbers
        const uniquePoNumbers = new Set(
            sheets
                .filter((sheet: any) => 
                    sheet.poNumber && 
                    sheet.poNumber.toString().trim() !== ''
                )
                .map((sheet: any) => sheet.poNumber.toString().trim())
        );
        
        // Return count of unique PO numbers
        return uniquePoNumbers.size;
    },
},


    {
    path: 'get-lift',
    gateKey: 'ordersView',
    name: 'Lifting',
    icon: <Package2 size={20} />,
    element: <GetLift />,
    notifications: (sheets: any[]) =>
        sheets.filter(
            (sheet: any) =>
                sheet.liftingStatus === 'Pending' &&
                sheet.planned5 &&
                sheet.planned5.toString().trim() !== ''
        ).length,
},


   {
    path: 'store-in',
    gateKey: 'storeIn',
    name: 'Store In',
    icon: <Truck size={20} />,
    element: <StoreIn />,
    notifications: (sheets: any[]) =>
        sheets.filter((sheet: any) => 
            sheet.planned6 !== '' && 
            sheet.actual6 === ''
        ).length,
},

 {
    path: 'Full-Kiting',
    gateKey: 'ordersView',
    name: 'Freight Payment',
    icon: <FilePlus2 size={20} />,
    element: <FullKiting />,
    notifications: (sheets: any[]) =>
        sheets.filter((sheet: any) => 
            sheet.planned && 
            sheet.planned.toString().trim() !== '' && 
            (!sheet.actual || sheet.actual.toString().trim() === '')
        ).length,
},

    {
    path: 'Make-Payment',
    name: 'Make Payment',
    icon: <FilePlus2 size={20} />,
    element: <MakePayment />,
    notifications: (sheets: any[]) =>
        sheets.filter((sheet: any) =>
            sheet.planned7 &&
            sheet.planned7.toString().trim() !== '' &&
            (!sheet.actual7 || sheet.actual7.toString().trim() === '') &&
            sheet.makePaymentLink &&
            sheet.makePaymentLink.toString().trim() !== ''
        ).length,
},
 {
        path: 'Exchange-Materials',
        gateKey: 'exchangeMaterials',
        name: 'PI Approval',
        icon: <PackageCheck  size={20} />,
        element: <ExchangeMaterials />,
        notifications: () => 0,
    },


{
    path: 'Payment-Status',
    name: 'Payment Status',
    icon: <RotateCcw size={20} />,
    element: <PaymentStatus />,
    notifications: (paymentHistorySheet: any[]) => {
        if (!paymentHistorySheet || paymentHistorySheet.length === 0) {
            return 0;
        }
        
        // Count records where status is "Yes"
        return paymentHistorySheet.filter((record: any) => {
            const status = record.status || record.Status || '';
            return status.toString().trim().toLowerCase() === 'yes';
        }).length;
    }
},
   

    {
    path: 'Quality-Check-In-Received-Item',
    gateKey: 'insteadOfQualityCheckInReceivedItem',
    name: 'Reject For GRN',
    icon: <Users size={20} />,
    element: <QuantityCheckInReceiveItem />,
    notifications: (sheets: any[]) =>
        sheets.filter((sheet: any) => 
            sheet.planned7 && 
            sheet.planned7.toString().trim() !== '' && 
            (!sheet.actual7 || sheet.actual7.toString().trim() === '')
        ).length,
},


   
    // {
    //     path: 'Return-Material-To-Party',
    //     gateKey: 'returnMaterialToParty',
    //     name: 'Return Material To Party',
    //     icon: <Users size={20} />,
    //     element: <ReturnMaterialToParty />,
    //     notifications: () => 0,
    // },

    {
    path: 'Send-Debit-Note',
    gateKey: 'sendDebitNote',
    name: 'Send Debit Note',
    icon: <FilePlus2 size={20} />,
    element: <SendDebitNote />,
    notifications: (sheets: any[]) =>
        sheets.filter((sheet: any) => 
            sheet.planned9 && 
            sheet.planned9.toString().trim() !== '' && 
            (!sheet.actual9 || sheet.actual9.toString().trim() === '')
        ).length,
},

    {
    path: 'audit-data',
    gateKey: 'auditData',
    name: 'Audit Data',
    icon: <Users size={20} />,
    element: <AuditData />,
    notifications: (sheets: any[]) =>
        sheets.filter((sheet: any) => 
            sheet.planned1 && 
            sheet.planned1.toString().trim() !== '' && 
            (!sheet.actual1 || sheet.actual1.toString().trim() === '')
        ).length,
},

    {
        path: 'rectify-the-mistake',
        gateKey: 'rectifyTheMistake',
        name: 'Rectify the mistake',
        icon: <Users size={20} />,
        element: <RectifyTheMistake />,
        notifications: () => 0,
    },
    {
        path: 'reaudit-data',
        gateKey: 'reauditData',
        name: 'Reaudit Data',
        icon: <Users size={20} />,
        element: <ReauditData />,
        notifications: () => 0,
    },
    {
        path: 'take-entry-by-tally',
        gateKey: 'takeEntryByTelly',
        name: 'Take Entry By Tally',
        icon: <ClipboardList  size={20} />,
        element: <TakeEntryByTally />,
        notifications: () => 0,
    },
    {
        path: 'AgainAuditing',
        gateKey: 'againAuditing',
        name: 'Again Auditing',
        icon: <UserCheck  size={20} />,
        element: <AgainAuditing />,
        notifications: () => 0,
    },

    // {
    //     path: 'store-out-approval',
    //     gateKey: 'storeOutApprovalView',
    //     name: 'Store Out Approval',
    //     icon: <PackageCheck size={20} />,
    //     element: <StoreOutApproval />,
    //     notifications: (sheets: any[]) =>
    //         sheets.filter(
    //             (sheet: any) =>
    //                 sheet.planned6 !== '' &&
    //                 sheet.actual6 === '' &&
    //                 sheet.indentType === 'Store Out'
    //         ).length,
    // },
    {
    path: 'Bill-Not-Received',
    gateKey: 'billNotReceived',
    name: 'Bill Not Received',
    icon: <ClipboardList size={20} />,
    element: <BillNotReceived />,
    notifications: (sheets: any[]) => {
        // Count items where planned11 is set but actual11 is not
        return sheets.filter((sheet: any) => {
            const hasPlanned11 = sheet.planned11 && sheet.planned11.toString().trim() !== '';
            const noActual11 = !sheet.actual11 || sheet.actual11.toString().trim() === '';
            
            return hasPlanned11 && noActual11;
        }).length;
    },
},

    {
        path: 'DBforPc',
        gateKey: 'dbForPc',
        name: 'DB For PC',
        icon: <PackageCheck  size={20} />,
        element: <DBforPc />,
        notifications: () => 0,
    },
    {
        path: 'administration',
        gateKey: 'administrate',
        name: 'Adminstration',
        icon: <ShieldUser size={20} />,
        element: <Administration />,
        notifications: () => 0,
    },
{
        path:'training-video',
        name:'Training Video',
        icon:<VideoIcon size={20}/>,
        element:<TrainnigVideo/>,
        notifications: () => 0,
    },
    {
        path:'license',
        name:'License',
        icon:<KeyRound size={20}/>,
        element:<Liecense/>,
        notifications: () => 0,

    },

];

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <SheetsProvider>
                                        <App routes={routes} />
                                    </SheetsProvider>
                                </ProtectedRoute>
                            }
                        >
                            {routes.map(({ path, element, gateKey }) => (
                                <Route
                                    key={path}
                                    path={path}
                                    element={
                                        <GatedRoute identifier={gateKey}>
                                            {element}
                                        </GatedRoute>
                                    }
                                />
                            ))}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </StrictMode>
    );
}