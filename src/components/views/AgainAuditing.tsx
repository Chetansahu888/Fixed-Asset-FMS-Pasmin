import { Package2 } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import type { TallyEntrySheet } from '@/types';
import { useAuth } from '@/context/AuthContext';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { toast } from 'sonner';
import { postToSheet } from '@/lib/fetchers';
import { PuffLoader as Loader } from 'react-spinners';

export default function PcReportTable() {
  const { tallyEntrySheet, poMasterLoading, updateAll } = useSheets();
  const [data, setData] = useState<TallyEntrySheet[]>([]);
  const [selectedRow, setSelectedRow] = useState<TallyEntrySheet | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
      const { user } = useAuth();
  
  
  // Update table data whenever tallyEntrySheet changes
  // useEffect(() => {
  //   if (!tallyEntrySheet) return;
    
  //   console.log("Raw Tally Entry Sheet:", tallyEntrySheet);
    
  //   // Filter the data according to planned5 has value and actual5 is empty/null
  //   const filteredData = tallyEntrySheet.filter(
  //     (row) => 
  //       (row.planned5 !== null && row.planned5 !== undefined && row.planned5 !== '') && 
  //       (row.actual5 === null || row.actual5 === undefined || row.actual5 === '')
  //   );

  //   console.log("Filtered Tally Entry Sheet:", filteredData);
  //   setData(filteredData);
  // }, [tallyEntrySheet]);

  // Update table data whenever tallyEntrySheet changes
useEffect(() => {
    if (!tallyEntrySheet) return;
    
    console.log("Raw Tally Entry Sheet:", tallyEntrySheet);
    
    // Pehle firm name se filter karo (case-insensitive)
    const filteredByFirm = tallyEntrySheet.filter(item => 
        user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
    );
    
    // Filter the data according to planned5 has value and actual5 is empty/null
    const filteredData = filteredByFirm.filter(
      (row) => 
        (row.planned5 !== null && row.planned5 !== undefined && row.planned5 !== '') && 
        (row.actual5 === null || row.actual5 === undefined || row.actual5 === '')
    );

    console.log("Filtered Tally Entry Sheet:", filteredData);
    setData(filteredData);
}, [tallyEntrySheet, user.firmNameMatch]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!openDialog) {
      form.reset({ status: undefined });
    }
  }, [openDialog]);

  // Validation schema
  const schema = z.object({
    status: z.enum(['okey', 'not okey']),
  });

  // Form setup
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      status: undefined,
    },
  });

  // Handle form submission
 async function onSubmit(values: z.infer<typeof schema>) {
  if (!selectedRow) {
    toast.error('No row selected!');
    return;
  }

  try {
    // Prepare data to post
    const mappedData = [
      {
        rowIndex: selectedRow.rowIndex,      // Required for identifying the row in Sheet
        actual5: new Date().toISOString(),   // Update actual5 to current timestamp
        status5: values.status,              // Update status5 from form
      }
    ];

    console.log('Selected Row:', selectedRow);
    console.log('Mapped Data to post:', mappedData);

    // Post to Google Sheet
    await postToSheet(mappedData, 'update', 'TALLY ENTRY');

    toast.success(`Status updated for Indent ${selectedRow.indentNo}`);

    // Close dialog and refresh data
    setOpenDialog(false);
    setTimeout(() => updateAll(), 1000);

  } catch (err) {
    console.error('Error in onSubmit:', err);
    toast.error('Failed to update');
  }
}


  function onError(e: any) {
    console.log(e);
    toast.error('Please fill all required fields');
  }

  // Columns for TallyEntrySheet
  const columns: ColumnDef<TallyEntrySheet>[] = [
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }: { row: Row<TallyEntrySheet> }) => {
        const rowData = row.original;
        return (
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedRow(rowData);
              }}
            >
              Action
            </Button>
          </DialogTrigger>
        );
      },
    },
  { accessorKey: 'indentNo', header: 'Indent Number' },
  { accessorKey: 'indentDate', header: 'Indent Date' },
  { accessorKey: 'purchaseDate', header: 'Purchase Date' },
  { accessorKey: 'materialInDate', header: 'Material In Date' },
  { accessorKey: 'productName', header: 'Product Name' },
   { accessorKey: 'firmNameMatch', header: 'Firm Name' }, 
  { accessorKey: 'billNo', header: 'Bill No' },
  { accessorKey: 'qty', header: 'Quantity' },
  { accessorKey: 'partyName', header: 'Party Name' },
  { accessorKey: 'billAmt', header: 'Bill Amount' },
  { accessorKey: 'billImage', header: 'Bill Image' },
  { accessorKey: 'billReceivedLater', header: 'Bill Received Later' },
  { accessorKey: 'notReceivedBillNo', header: 'Not Received Bill No' },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'typeOfBills', header: 'Type Of Bills' },
  { accessorKey: 'productImage', header: 'Product Image' },
  { accessorKey: 'area', header: 'Area' },
  { accessorKey: 'indentedFor', header: 'Indented For' },
  { accessorKey: 'approvedPartyName', header: 'Approved Party Name' },
  { accessorKey: 'rate', header: 'Rate' },
  { accessorKey: 'indentQty', header: 'Indent Qty' },
  { accessorKey: 'totalRate', header: 'Total Rate' },
  ];

  return (
    <div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <Heading heading="Again Auditing" subtext="">
          <Package2 size={50} className="text-primary" />
        </Heading>

        <DataTable
          data={data}
          columns={columns}
          searchFields={['productName', 'indentNo', 'partyName']}
          dataLoading={poMasterLoading}
          className='h-[80dvh]'
        />

        {selectedRow && (
          <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-5"
              >
                <DialogHeader>
                  <DialogTitle>
                    Update Status for Indent {selectedRow.indentNo}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="okey">Okey</SelectItem>
                              <SelectItem value="not okey">Not Okey</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Loader
                        size={20}
                        color="white"
                        aria-label="Loading Spinner"
                      />
                    )}
                    Submit
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}