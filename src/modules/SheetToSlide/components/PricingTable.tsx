import { Card } from "@/modules/SheetToSlide/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/SheetToSlide/components/ui/table";

interface Plan {
  name: string;
  ansCode: string | number;
  perCapita: string | number;
  estimatedInvoice: string | number;
}

interface PricingTableProps {
  title: string;
  plans: Plan[];
  variant?: "copay" | "no-copay";
}

export const PricingTable = ({ title, plans, variant = "copay" }: PricingTableProps) => {
  return (
    <Card className="p-6 shadow-md border-none">
      <div className="mb-6 text-center">
        <h3 className="text-3xl font-bold mb-2 text-secondary">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header border-b-2 border-table-header">
              <TableHead className="text-primary-foreground font-bold">
                Plano
              </TableHead>
              <TableHead className="text-primary-foreground font-bold">
                Registro ANS
              </TableHead>
              <TableHead className="text-primary-foreground font-bold">
                Valor Per Capita
              </TableHead>
              <TableHead className="text-primary-foreground font-bold">
                Fatura Estimada
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan, index) => (
              <TableRow
                key={index}
                className={index % 2 === 0 ? "bg-background" : "bg-table-row-alt"}
              >
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.ansCode}</TableCell>
                <TableCell className="font-semibold">
                  {typeof plan.perCapita === 'number' && plan.perCapita > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.perCapita)
                    : '-'}
                </TableCell>
                <TableCell className="font-semibold">
                  {typeof plan.estimatedInvoice === 'number' && plan.estimatedInvoice > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.estimatedInvoice)
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

