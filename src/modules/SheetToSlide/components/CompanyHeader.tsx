import { Card } from "@/modules/SheetToSlide/components/ui/card";
import kliniLogo from "@/modules/SheetToSlide/assets/logo-klini.webp";

interface CompanyHeaderProps {
  companyName: string;
  concessionaire: string;
  broker: string;
  emissionDate: string;
  validityDate: string;
}

export const CompanyHeader = ({
  companyName,
  concessionaire,
  broker,
  emissionDate,
  validityDate,
}: CompanyHeaderProps) => {
  return (
    <Card className="p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20 shadow-md border-none">
      {/* Klini Logo */}
      <div className="flex justify-center mb-8">
        <img src={kliniLogo} alt="Klini Saúde" className="h-16 object-contain" />
      </div>

      {/* Company Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Razão Social</p>
          <p className="text-lg font-semibold text-foreground bg-table-row-alt px-4 py-3 rounded">
            {companyName}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Concessionária</p>
          <p className="text-lg font-semibold text-foreground bg-table-row-alt px-4 py-3 rounded">
            {concessionaire}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Corretor(a)</p>
          <p className="text-lg font-semibold text-foreground bg-table-row-alt px-4 py-3 rounded">
            {broker}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Data de Emissão</p>
          <p className="text-lg font-semibold text-foreground bg-table-row-alt px-4 py-3 rounded">
            {emissionDate}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Validade</p>
          <p className="text-lg font-semibold text-foreground bg-table-row-alt px-4 py-3 rounded">
            {validityDate}
          </p>
        </div>
      </div>

      {/* ANS Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">ANS - Nº 42.202-9</p>
      </div>
    </Card>
  );
};

