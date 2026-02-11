import { Card } from "@/modules/SheetToSlide/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/SheetToSlide/components/ui/table";

interface DemographicsData {
  ageRange: string;
  titularM: string | number;
  titularF: string | number;
  dependentM: string | number;
  dependentF: string | number;
  agregadoM: string | number;
  agregadoF: string | number;
  totalM: string | number;
  totalF: string | number;
  total: string | number;
  percentage: string | number;
}

interface DemographicsTableProps {
  data: DemographicsData[];
}

export const DemographicsTable = ({ data }: DemographicsTableProps) => {
  return (
    <Card className="p-6 shadow-md border-none">
      <div className="mb-6 text-center">
        <h3 className="text-3xl font-bold mb-2">
          <span className="text-secondary">Tabela de </span>
          <span className="text-secondary">Preços</span>
        </h3>
        <p className="text-muted-foreground uppercase tracking-wider text-sm">
          DISTRIBUIÇÃO DEMOGRÁFICA
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header border-b-2 border-table-header">
              <TableHead className="text-primary-foreground font-bold">
                Faixa Etária
              </TableHead>
              <TableHead colSpan={2} className="text-center text-primary-foreground font-bold border-l border-primary-foreground/20">
                Titular
              </TableHead>
              <TableHead colSpan={2} className="text-center text-primary-foreground font-bold border-l border-primary-foreground/20">
                Dependente
              </TableHead>
              <TableHead colSpan={2} className="text-center text-primary-foreground font-bold border-l border-primary-foreground/20">
                Agregado
              </TableHead>
              <TableHead colSpan={3} className="text-center text-primary-foreground font-bold border-l border-primary-foreground/20">
                Total
              </TableHead>
              <TableHead className="text-primary-foreground font-bold border-l border-primary-foreground/20">
                %
              </TableHead>
            </TableRow>
            <TableRow className="bg-table-header/90 hover:bg-table-header/90">
              <TableHead className="text-primary-foreground"></TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold">M</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold">F</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold border-l border-primary-foreground/20">M</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold">F</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold border-l border-primary-foreground/20">M</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold">F</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold border-l border-primary-foreground/20">M</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold">F</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold">Total</TableHead>
              <TableHead className="text-center text-primary-foreground font-semibold border-l border-primary-foreground/20">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                className={index % 2 === 0 ? "bg-background" : "bg-table-row-alt"}
              >
                <TableCell className="font-semibold text-table-header">{row.ageRange}</TableCell>
                <TableCell className="text-center">{row.titularM}</TableCell>
                <TableCell className="text-center">{row.titularF}</TableCell>
                <TableCell className="text-center border-l">{row.dependentM}</TableCell>
                <TableCell className="text-center">{row.dependentF}</TableCell>
                <TableCell className="text-center border-l">{row.agregadoM}</TableCell>
                <TableCell className="text-center">{row.agregadoF}</TableCell>
                <TableCell className="text-center border-l">{row.totalM}</TableCell>
                <TableCell className="text-center">{row.totalF}</TableCell>
                <TableCell className="text-center font-bold bg-table-header text-primary-foreground">{row.total}</TableCell>
                <TableCell className="text-center border-l font-bold bg-table-header text-primary-foreground">{row.percentage}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

