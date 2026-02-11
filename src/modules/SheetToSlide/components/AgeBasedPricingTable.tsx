import { Card } from "@/modules/SheetToSlide/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/SheetToSlide/components/ui/table";

interface AgeBasedPricingTableProps {
  data: any[];
  title?: string;
}

export const AgeBasedPricingTable = ({ data, title = "Valores por Faixa Etária" }: AgeBasedPricingTableProps) => {
  if (!data || data.length === 0) return null;

  const planColumns = Object.keys(data[0]).filter(key => key !== 'ageRange');

  return (
    <Card className="p-6 shadow-md border-none">
      <div className="mb-6 text-center">
        <h3 className="text-3xl font-bold mb-2 text-secondary">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header border-b-2 border-table-header">
              <TableHead className="text-primary-foreground font-bold">
                Faixa Etária
              </TableHead>
              {planColumns.map((col, index) => (
                <TableHead
                  key={index}
                  className="text-center text-primary-foreground font-bold"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-background" : "bg-table-row-alt"}
              >
                <TableCell className="font-semibold text-table-header">{row.ageRange}</TableCell>
                {planColumns.map((col, colIndex) => {
                  const value = row[col];
                  const formattedValue = typeof value === 'number' && value > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                    : '-';
                  
                  return (
                    <TableCell key={colIndex} className="text-center">
                      {formattedValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

