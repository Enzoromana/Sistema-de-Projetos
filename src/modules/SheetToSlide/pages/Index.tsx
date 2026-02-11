import { useState, useEffect } from "react";
import { Upload, Download, Presentation } from "lucide-react";
import { Button } from "@/modules/SheetToSlide/components/ui/button";
import { Card } from "@/modules/SheetToSlide/components/ui/card";
import { useToast } from "@/modules/SheetToSlide/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PricingTable } from "@/modules/SheetToSlide/components/PricingTable";
import { DemographicsTable } from "@/modules/SheetToSlide/components/DemographicsTable";
import { CompanyHeader } from "@/modules/SheetToSlide/components/CompanyHeader";
import { AgeBasedPricingTable } from "@/modules/SheetToSlide/components/AgeBasedPricingTable";
import { LogoUpload as CoverImageUpload } from "@/modules/SheetToSlide/components/LogoUpload";
import { exportToPPTX } from "@/modules/SheetToSlide/utils/pptxExport";
import KLINI_LOGO from "@/modules/SheetToSlide/assets/logo-klini.webp";
import DEFAULT_COVER from "@/modules/SheetToSlide/assets/default-cover.png";
import { Checkbox } from "@/modules/SheetToSlide/components/ui/checkbox";
import { Label } from "@/modules/SheetToSlide/components/ui/label";

interface SheetData {
  plansWithCopay: any[];
  plansWithoutCopay: any[];
  ageBasedPricingCopay: any[];
  ageBasedPricingNoCopay: any[];
}

interface ParsedData {
  companyName: string;
  concessionaire: string;
  broker: string;
  emissionDate: string;
  validityDate: string;
  demographics: any[];
  mainSheet: SheetData;
  productsG?: SheetData;
}

const Index = () => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(DEFAULT_COVER);
  const [includeProductsG, setIncludeProductsG] = useState(false);
  const { toast } = useToast();

  const parseCurrency = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const parseKliniSheet = (worksheet: XLSX.WorkSheet): SheetData => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    let plansWithCopayIdx = -1;
    let plansWithoutCopayIdx = -1;
    let agePricingWithCopayIdx = -1;
    let agePricingWithoutCopayIdx = -1;

    // Find anchors
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[1] || '').toUpperCase();
      const firstCellA = String(row[0] || '').toUpperCase();

      if (firstCell.includes("PLANOS COM COPARTICIPAÇÃO")) {
        plansWithCopayIdx = i;
      } else if (firstCell.includes("PLANOS SEM COPARTICIPAÇÃO")) {
        plansWithoutCopayIdx = i;
      } else if (firstCellA.includes("FAIXA ETÁRIA") || firstCell.includes("FAIXA ETÁRIA")) {
        if (plansWithCopayIdx !== -1 && agePricingWithCopayIdx === -1) {
          agePricingWithCopayIdx = i;
        } else if (plansWithoutCopayIdx !== -1 && agePricingWithoutCopayIdx === -1) {
          agePricingWithoutCopayIdx = i;
        }
      }
    }

    const parsePlans = (startIdx: number, endIdx: number) => {
      const plans: any[] = [];
      if (startIdx === -1) return plans;

      let ansColIdx = 4;
      let perCapitaColIdx = 5;
      let invoiceColIdx = 6;

      // Find column headers near the section start
      for (let i = startIdx; i < startIdx + 5; i++) {
        const row = jsonData[i] as any[];
        if (!row) continue;

        const ansIdx = row.findIndex(c => String(c).toUpperCase().includes("REGISTRO ANS") || String(c).toUpperCase().includes("CÓDIGO ANS"));
        const perCapitaIdx = row.findIndex(c => String(c).toUpperCase().includes("VALOR PER CAPITA") || String(c).toUpperCase().includes("PER CAPITA"));
        const invoiceIdx = row.findIndex(c => String(c).toUpperCase().includes("FATURA ESTIMADA") || String(c).toUpperCase().includes("FATURA"));

        if (ansIdx !== -1) ansColIdx = ansIdx;
        if (perCapitaIdx !== -1) perCapitaColIdx = perCapitaIdx;
        if (invoiceIdx !== -1) invoiceColIdx = invoiceIdx;

        if (ansIdx !== -1 || perCapitaIdx !== -1 || invoiceIdx !== -1) break;
      }

      // Plans usually start after the table header
      for (let i = startIdx + 1; i < (endIdx !== -1 ? endIdx : jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (!row || !row[1]) continue;
        const planName = String(row[1]).trim();

        // Stop if we hit the next section (Age-based pricing often follows)
        if (planName.toUpperCase().includes("FAIXA ETÁRIA")) break;
        if (!planName.startsWith("KLINI")) continue;

        plans.push({
          name: planName,
          ansCode: String(row[ansColIdx] || '').trim(),
          perCapita: parseCurrency(row[perCapitaColIdx]) || 0,
          estimatedInvoice: parseCurrency(row[invoiceColIdx]) || 0,
        });
      }
      return plans;
    };

    const parseAgePricing = (headerIdx: number) => {
      const pricing: any[] = [];
      if (headerIdx === -1) return pricing;

      const headerRow = jsonData[headerIdx] as any[];
      const ageColIdx = headerRow.findIndex(c => String(c).toUpperCase().includes("FAIXA ETÁRIA"));
      if (ageColIdx === -1) return pricing;

      const planNames = headerRow.slice(ageColIdx + 1).filter((name: string) => name && String(name).trim() !== "");

      for (let i = headerIdx + 1; i < headerIdx + 15; i++) {
        const row = jsonData[i] as any[];
        if (!row || !row[ageColIdx]) continue;
        const ageRange = String(row[ageColIdx]).trim();
        if (!ageRange.match(/\d+\s*-\s*\d+|59\+/)) {
          if (pricing.length > 0) break; // End of table
          continue;
        }

        const item: any = { ageRange };
        planNames.forEach((planName: string, idx: number) => {
          item[planName] = parseCurrency(row[ageColIdx + 1 + idx]) || 0;
        });
        pricing.push(item);
      }
      return pricing;
    };

    const allPlansWithCopay = parsePlans(plansWithCopayIdx, agePricingWithCopayIdx);
    const allAgeBasedPricingCopay = parseAgePricing(agePricingWithCopayIdx);
    const allPlansWithoutCopay = parsePlans(plansWithoutCopayIdx, agePricingWithoutCopayIdx);
    const allAgeBasedPricingNoCopay = parseAgePricing(agePricingWithoutCopayIdx);

    return {
      plansWithCopay: allPlansWithCopay,
      plansWithoutCopay: allPlansWithoutCopay,
      ageBasedPricingCopay: allAgeBasedPricingCopay,
      ageBasedPricingNoCopay: allAgeBasedPricingNoCopay,
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const readWorkbook = XLSX.read(data);
      setWorkbook(readWorkbook);

      toast({
        title: "Arquivo carregado!",
        description: "Agora você pode configurar as opções de exportação.",
      });
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Erro ao ler arquivo",
        description: "Verifique se o arquivo está no formato correto.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!workbook) {
      setParsedData(null);
      return;
    }

    try {
      // 1. Identificar planilha principal (ACIMA DE 100 VIDAS)
      // Procura por nome específico ou usa a primeira que não seja "Tabela de preços" ou "PRODUTOS G"
      let mainSheetName = workbook.SheetNames.find(name =>
        name.toUpperCase().includes("ACIMA DE 100") ||
        name.toUpperCase().includes("100 VIDAS")
      );

      if (!mainSheetName) {
        // Fallback: primeira planilha que não seja de dados auxiliares
        mainSheetName = workbook.SheetNames.find(name =>
          !name.toUpperCase().includes("TABELA DE PREÇO") &&
          !name.toUpperCase().includes("PRODUTOS G")
        ) || workbook.SheetNames[0];
      }

      const worksheet = workbook.Sheets[mainSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      // Parse company info (always from first sheet)
      const companyName = (jsonData[1] as any)?.[1] || "";
      const concessionaire = (jsonData[2] as any)?.[1] || "";
      const broker = (jsonData[3] as any)?.[1] || "";

      // Parse demographics (always from first sheet)
      const allDemographics: any[] = [];
      for (let i = 7; i <= 16; i++) {
        const row = jsonData[i] as any[];
        if (!row || !row[1]) continue;
        const ageRange = String(row[1]).trim();
        if (ageRange === "TOTAL" || ageRange === "IDADE MÉDIA:" || ageRange === "") continue;
        allDemographics.push({
          ageRange,
          titularM: row[2] || 0,
          titularF: row[3] || 0,
          dependentM: row[4] || 0,
          dependentF: row[5] || 0,
          agregadoM: 0,
          agregadoF: 0,
          totalM: row[8] || 0,
          totalF: row[9] || 0,
          total: row[10] || 0,
          percentage: row[11] || "0%",
        });
      }

      const mainSheetData = parseKliniSheet(worksheet);
      let productsGData: SheetData | undefined = undefined;

      // 2. Identificar e processar automaticamente "Produtos G" se existir
      const productsGSheetName = workbook.SheetNames.find(name =>
        name.toUpperCase().includes("PRODUTOS G")
      );

      if (productsGSheetName) {
        productsGData = parseKliniSheet(workbook.Sheets[productsGSheetName]);
        // Atualiza checkbox visualmente para refletir que foi encontrado
        setIncludeProductsG(true);
      } else {
        setIncludeProductsG(false);
      }

      const emissionDate = new Date().toLocaleDateString('pt-BR');
      const validityDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

      setParsedData({
        companyName,
        concessionaire,
        broker,
        emissionDate,
        validityDate,
        demographics: allDemographics,
        mainSheet: mainSheetData,
        productsG: productsGData,
      });
    } catch (error) {
      console.error("Error parsing workbook:", error);
      toast({
        title: "Erro ao processar dados",
        description: "Houve um problema ao organizar as informações da planilha.",
        variant: "destructive",
      });
    }
  }, [workbook, includeProductsG]);

  const handleExportPPTX = async () => {
    if (!parsedData) return;

    try {
      toast({
        title: "Gerando PowerPoint...",
        description: "Aguarde enquanto preparamos sua apresentação.",
      });

      await exportToPPTX(parsedData, coverImage);

      toast({
        title: "PowerPoint gerado com sucesso!",
        description: "Sua proposta foi exportada.",
      });
    } catch (error) {
      console.error("Error generating PPTX:", error);
      toast({
        title: "Erro ao gerar PowerPoint",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    const proposalElement = document.getElementById('proposal-content');
    if (!proposalElement) return;

    try {
      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto preparamos sua proposta.",
      });

      const canvas = await html2canvas(proposalElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`Proposta_${parsedData?.companyName || 'Klini_Saude'}.pdf`);

      toast({
        title: "PDF gerado com sucesso!",
        description: "Sua proposta foi exportada.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleCoverImageChange = (imageDataUrl: string | null) => {
    setCoverImage(imageDataUrl);
    if (imageDataUrl) {
      toast({
        title: "Imagem da capa carregada!",
        description: "A capa personalizada será usada no PowerPoint.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1D7874] via-[#1a6b67] to-[#164e4b]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <img
                  src={KLINI_LOGO}
                  alt="Klini Logo"
                  className="h-20 w-auto"
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
              Sistema de Cotação Klini Saúde
            </h1>
            <p className="text-xl text-white/90 font-light max-w-2xl mx-auto">
              Transforme suas planilhas em propostas profissionais com apenas alguns cliques
            </p>
          </div>

          {/* Main Upload Card */}
          <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Excel Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    📊 Planilha de Cotação
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    variant="outline"
                    className="w-full h-32 border-2 border-dashed border-[#1D7874] hover:border-[#F7931E] hover:bg-[#FFF8F0] transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-[#1D7874] group-hover:bg-[#F7931E] rounded-full transition-colors duration-300">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-700">Clique para fazer upload</p>
                        <p className="text-xs text-gray-500">Arquivos Excel (.xlsx ou .xls)</p>
                      </div>
                    </div>
                  </Button>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="products-g"
                      checked={includeProductsG}
                      onCheckedChange={(checked) => setIncludeProductsG(checked as boolean)}
                    />
                    <Label htmlFor="products-g" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Incluir aba "Produtos G" se disponível
                    </Label>
                  </div>
                </div>

                {/* Cover Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    🎨 Capa da Proposta
                  </label>
                  <CoverImageUpload onLogoChange={handleCoverImageChange} currentLogo={coverImage} />
                </div>
              </div>

              {/* Export Buttons */}
              {parsedData && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handleExportPDF}
                      className="h-14 bg-gradient-to-r from-[#1D7874] to-[#164e4b] hover:from-[#164e4b] hover:to-[#1D7874] text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold"
                      size="lg"
                    >
                      <Download className="h-6 w-6 mr-3" />
                      Exportar para PDF
                    </Button>
                    <Button
                      onClick={handleExportPPTX}
                      className="h-14 bg-gradient-to-r from-[#F7931E] to-[#e67e0a] hover:from-[#e67e0a] hover:to-[#F7931E] text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold"
                      size="lg"
                    >
                      <Presentation className="h-6 w-6 mr-3" />
                      Exportar para PowerPoint
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Preview Section */}
          {parsedData && (
            <div id="proposal-content" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center py-4">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  📋 Pré-visualização da Proposta
                </h2>
              </div>

              <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl overflow-hidden p-0">
                <CompanyHeader
                  companyName={parsedData.companyName}
                  concessionaire={parsedData.concessionaire}
                  broker={parsedData.broker}
                  emissionDate={parsedData.emissionDate}
                  validityDate={parsedData.validityDate}
                />
              </Card>

              <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 text-[#1D7874] flex items-center gap-3">
                  <span className="text-3xl">👥</span> Demografia
                </h2>
                <DemographicsTable data={parsedData.demographics} />
              </Card>

              {parsedData.mainSheet.plansWithCopay.length > 0 && (
                <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                  <PricingTable
                    title="Planos com Coparticipação"
                    plans={parsedData.mainSheet.plansWithCopay}
                  />
                </Card>
              )}

              {parsedData.mainSheet.plansWithoutCopay.length > 0 && (
                <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                  <PricingTable
                    title="Planos sem Coparticipação"
                    plans={parsedData.mainSheet.plansWithoutCopay}
                  />
                </Card>
              )}

              {parsedData.mainSheet.ageBasedPricingCopay.length > 0 && (
                <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                  <AgeBasedPricingTable
                    data={parsedData.mainSheet.ageBasedPricingCopay}
                    title="Valores por Faixa Etária - COM Coparticipação"
                  />
                </Card>
              )}

              {parsedData.mainSheet.ageBasedPricingNoCopay.length > 0 && (
                <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                  <AgeBasedPricingTable
                    data={parsedData.mainSheet.ageBasedPricingNoCopay}
                    title="Valores por Faixa Etária - SEM Coparticipação"
                  />
                </Card>
              )}

              {/* Seção Produtos G */}
              {parsedData.productsG && (
                <div className="space-y-6 pt-8 border-t-2 border-dashed border-white/20">
                  <div className="text-center py-4">
                    <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                      📦 Produtos G
                    </h2>
                  </div>

                  {parsedData.productsG.plansWithCopay.length > 0 && (
                    <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                      <PricingTable
                        title="Produtos G - Com Coparticipação"
                        plans={parsedData.productsG.plansWithCopay}
                      />
                    </Card>
                  )}

                  {parsedData.productsG.plansWithoutCopay.length > 0 && (
                    <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                      <PricingTable
                        title="Produtos G - Sem Coparticipação"
                        plans={parsedData.productsG.plansWithoutCopay}
                      />
                    </Card>
                  )}

                  {parsedData.productsG.ageBasedPricingCopay.length > 0 && (
                    <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                      <AgeBasedPricingTable
                        data={parsedData.productsG.ageBasedPricingCopay}
                        title="Produtos G - COM Coparticipação - Faixa Etária"
                      />
                    </Card>
                  )}

                  {parsedData.productsG.ageBasedPricingNoCopay.length > 0 && (
                    <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8">
                      <AgeBasedPricingTable
                        data={parsedData.productsG.ageBasedPricingNoCopay}
                        title="Produtos G - SEM Coparticipação - Faixa Etária"
                      />
                    </Card>
                  )}
                </div>
              )}

              <Card className="backdrop-blur-xl bg-white/95 border-none shadow-2xl p-8 text-center">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Esta proposta foi elaborada levando em consideração as informações fornecidas através
                  do formulário de cotação enviado pela Corretora. No caso de implantação do contrato,
                  qualquer incompatibilidade implicará na inviabilidade ou reanálise da proposta.
                </p>
                <p className="text-xs text-gray-500 mt-4 font-semibold">ANS - Nº 42.202-9</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

