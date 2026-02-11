import pptxgen from "pptxgenjs";

interface SheetData {
  plansWithCopay: any[];
  plansWithoutCopay: any[];
  ageBasedPricingCopay: any[];
  ageBasedPricingNoCopay: any[];
}

interface ExportData {
  companyName: string;
  concessionaire: string;
  broker: string;
  emissionDate: string;
  validityDate: string;
  demographics: any[];
  mainSheet: SheetData;
  productsG?: SheetData;
}

const formatPercentage = (value: any): string => {
  if (typeof value === 'string' && value.includes('%')) {
    return value;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0%';
  return `${Math.round(num * 100)}%`;
};

const urlToBase64 = async (url: string): Promise<string> => {
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Erro ao converter imagem em base64:", err);
    return url;
  }
};

export const exportToPPTX = async (data: ExportData, coverImage?: string | null) => {
  const pptx = new pptxgen();

  pptx.defineLayout({ name: "PORTRAIT_A4", width: 8.26, height: 11.69 });
  pptx.layout = "PORTRAIT_A4";

  // Define cores Klini
  const kliniTeal = "1D7874";
  const kliniOrange = "F7931E";
  const lightTeal = "B8D4D3";

  // Helper function for currency formatting
  const formatCurrency = (value: string | number) => {
    if (value === undefined || value === null) return "R$ 0,00";
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) : value;
    if (isNaN(numValue)) return "R$ 0,00";
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Slide 1: Capa
  const slide1 = pptx.addSlide();

  if (coverImage) {
    const base64Cover = await urlToBase64(coverImage);
    slide1.addImage({
      data: base64Cover,
      x: 0,
      y: 0,
      w: 8.26,
      h: 11.69,
      sizing: { type: "cover" }
    });
  } else {
    slide1.background = { color: "1D7874" };

    slide1.addShape(pptx.ShapeType.ellipse, {
      x: 1.5,
      y: 3.0,
      w: 5.0,
      h: 5.0,
      fill: { color: "164E4B", transparency: 30 },
      line: { type: "none" }
    });

    slide1.addText([
      { text: "klini", options: { fontSize: 72, bold: true, color: "FFFFFF" } }
    ], {
      x: 1.8,
      y: 1.8,
      w: 4.66,
      h: 1.5,
      align: "center"
    });

    slide1.addText([
      { text: "saúde", options: { fontSize: 48, bold: false, color: "FFFFFF" } }
    ], {
      x: 2.3,
      y: 2.8,
      w: 3.66,
      h: 1.0,
      align: "center"
    });

    slide1.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 6.8,
      w: 7.26,
      h: 1.0,
      fill: { color: "FFFFFF" },
      line: { type: "none" }
    });

    slide1.addText("PROPOSTA COMERCIAL", {
      x: 0.5,
      y: 6.85,
      w: 7.26,
      h: 0.9,
      fontSize: 32,
      bold: true,
      color: kliniTeal,
      align: "center",
      valign: "middle"
    });

    const currentDate = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    slide1.addShape(pptx.ShapeType.rect, {
      x: 4.7,
      y: 8.0,
      w: 2.8,
      h: 0.6,
      fill: { color: kliniOrange },
      line: { type: "none" }
    });

    slide1.addText(currentDate.toUpperCase(), {
      x: 4.7,
      y: 8.05,
      w: 2.8,
      h: 0.5,
      fontSize: 16,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
      italic: true
    });

    slide1.addText("V2.00/070251.3.4", {
      x: 0.3,
      y: 11.35,
      w: 2.0,
      h: 0.25,
      fontSize: 7,
      color: "FFFFFF",
      align: "left",
    });

    slide1.addText("ANS - Nº 42.202-9", {
      x: 6.0,
      y: 11.35,
      w: 2.0,
      h: 0.25,
      fontSize: 7,
      color: "FFFFFF",
      align: "right",
    });
  }

  // Slide 2: Dados da Empresa + Demografia
  const slide2 = pptx.addSlide();
  slide2.background = { color: "FFFFFF" };

  slide2.addText([
    { text: "Tabela de ", options: { color: kliniOrange, fontSize: 28, bold: true } },
    { text: "Preços", options: { color: kliniOrange, fontSize: 28, bold: true } },
  ], {
    x: 0.5,
    y: 0.5,
    w: 7.26,
    h: 0.5,
    align: "center",
  });

  slide2.addText("DEMOGRAFIA", {
    x: 0.5,
    y: 1.1,
    w: 7.26,
    h: 0.3,
    fontSize: 12,
    color: "666666",
    align: "center",
  });

  slide2.addText(`Razão Social: ${data.companyName}`, {
    x: 0.5,
    y: 1.6,
    w: 7.26,
    h: 0.3,
    fontSize: 10,
    color: "333333",
  });

  slide2.addText(`Concessionária: ${data.concessionaire}`, {
    x: 0.5,
    y: 1.9,
    w: 7.26,
    h: 0.3,
    fontSize: 10,
    color: "333333",
  });

  slide2.addText(`Corretor(a): ${data.broker}`, {
    x: 0.5,
    y: 2.2,
    w: 7.26,
    h: 0.3,
    fontSize: 10,
    color: "333333",
  });

  const demoRows: any[] = [
    [
      { text: "FAIXA ETÁRIA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, rowspan: 2 } },
      { text: "TITULAR", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, colspan: 2 } },
      { text: "DEPENDENTE", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, colspan: 2 } },
      { text: "AGREGADO", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, colspan: 2 } },
      { text: "TOTAL", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, colspan: 3 } },
      { text: "%", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, rowspan: 2 } },
    ],
    [
      { text: "M", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "F", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "M", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "F", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "M", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "F", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "M", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "F", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
      { text: "TOTAL", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal } } },
    ],
  ];

  let totalTitularM = 0, totalTitularF = 0, totalDependentM = 0, totalDependentF = 0;
  let totalAgregadoM = 0, totalAgregadoF = 0, totalTotalM = 0, totalTotalF = 0, grandTotal = 0;

  data.demographics.forEach((row, index) => {
    const isAlt = index % 2 === 1;
    demoRows.push([
      { text: row.ageRange, options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.titularM || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.titularF || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.dependentM || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.dependentF || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.agregadoM || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.agregadoF || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.totalM || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.totalF || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: String(row.total || '0'), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
      { text: formatPercentage(row.percentage), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" } } },
    ]);

    totalTitularM += (row.titularM || 0);
    totalTitularF += (row.titularF || 0);
    totalDependentM += (row.dependentM || 0);
    totalDependentF += (row.dependentF || 0);
    totalAgregadoM += (row.agregadoM || 0);
    totalAgregadoF += (row.agregadoF || 0);
    totalTotalM += (row.totalM || 0);
    totalTotalF += (row.totalF || 0);
    grandTotal += (row.total || 0);
  });

  const darkTeal = "164E4B";
  demoRows.push([
    { text: "TOTAL", options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalTitularM), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalTitularF), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalDependentM), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalDependentF), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalAgregadoM), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalAgregadoF), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalTotalM), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(totalTotalF), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: String(grandTotal), options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
    { text: "100%", options: { bold: true, color: "FFFFFF", fill: { color: darkTeal } } },
  ]);

  slide2.addTable(demoRows, {
    x: 0.3,
    y: 2.7,
    w: 7.66,
    fontSize: 7,
    border: { pt: 0.5, color: "CCCCCC" },
    align: "center",
  });

  slide2.addText("ANS - Nº 42.202-9", {
    x: 6.5,
    y: 0.2,
    w: 1.5,
    h: 0.3,
    fontSize: 9,
    color: "333333",
    align: "right",
  });

  slide2.addText(
    "Esta proposta foi elaborada levando em consideração as informações fornecidas através do formulário de cotação enviado pela Corretora. No caso de implantação do contrato, qualquer incompatibilidade implicará na inviabilidade ou reanálise da proposta.",
    {
      x: 0.5,
      y: 10.8,
      w: 7.26,
      h: 0.6,
      fontSize: 7,
      color: "666666",
      align: "center",
      valign: "top",
    }
  );

  // Slide 3: Planos COM Coparticipação (Planilha Principal)
  if (data.mainSheet.plansWithCopay && data.mainSheet.plansWithCopay.length > 0) {
    const slide3 = pptx.addSlide();
    slide3.background = { color: "FFFFFF" };

    slide3.addText("ANS - Nº 42.202-9", {
      x: 6.5,
      y: 0.2,
      w: 1.5,
      h: 0.3,
      fontSize: 9,
      color: "333333",
      align: "right",
    });

    slide3.addText("Planos com Coparticipação", {
      x: 0.5,
      y: 0.5,
      w: 7.26,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: kliniOrange,
      align: "center",
    });

    const copayRows: any[] = [
      [
        { text: "PLANO", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "Registro ANS", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "Valor Per Capita", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "Fatura Estimada", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
      ],
    ];

    data.mainSheet.plansWithCopay.forEach((plan, index) => {
      const isAlt = index % 2 === 1;
      copayRows.push([
        { text: plan.name, options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
        { text: String(plan.ansCode), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
        { text: formatCurrency(plan.perCapita), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
        { text: formatCurrency(plan.estimatedInvoice), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
      ]);
    });

    slide3.addTable(copayRows, {
      x: 0.5,
      y: 1.2,
      w: 7.26,
      border: { pt: 0.5, color: "CCCCCC" },
      align: "center",
    });

    const firstTableHeight = 0.4 + (copayRows.length - 1) * 0.25;
    const secondSectionY = 1.2 + firstTableHeight + 0.4;

    slide3.addText("Valores por Faixa Etária - COM Coparticipação", {
      x: 0.5,
      y: secondSectionY,
      w: 7.26,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: kliniOrange,
      align: "center",
    });

    if (data.mainSheet.ageBasedPricingCopay && data.mainSheet.ageBasedPricingCopay.length > 0) {
      const planColumns = Object.keys(data.mainSheet.ageBasedPricingCopay[0]).filter(key => key !== 'ageRange');

      const ageRows: any[] = [
        [
          { text: "FAIXA ETÁRIA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 } },
          ...planColumns.map((planName) => ({
            text: planName,
            options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 }
          }))
        ],
      ];

      data.mainSheet.ageBasedPricingCopay.forEach((row, rowIndex) => {
        const isAlt = rowIndex % 2 === 1;
        ageRows.push([
          { text: row.ageRange, options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 6 } },
          ...planColumns.map(col => ({
            text: row[col] ? formatCurrency(row[col]) : '-',
            options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 6 }
          }))
        ]);
      });

      const colWidth = (7.26 - 0.8) / planColumns.length;

      slide3.addTable(ageRows, {
        x: 0.5,
        y: secondSectionY + 0.5,
        w: 7.26,
        border: { pt: 0.5, color: "CCCCCC" },
        align: "center",
        colW: [0.8, ...Array(planColumns.length).fill(colWidth)]
      });
    }

    slide3.addText(
      "Esta proposta foi elaborada levando em consideração as informações fornecidas através do formulário de cotação enviado pela Corretora. No caso de implantação do contrato, qualquer incompatibilidade implicará na inviabilidade ou reanálise da proposta.",
      {
        x: 0.5,
        y: 10.8,
        w: 7.26,
        h: 0.6,
        fontSize: 6,
        color: "666666",
        align: "center",
        valign: "top",
      }
    );
  }

  // Slide 4: Planos SEM Coparticipação (Planilha Principal)
  if (data.mainSheet.plansWithoutCopay && data.mainSheet.plansWithoutCopay.length > 0) {
    const slide4 = pptx.addSlide();
    slide4.background = { color: "FFFFFF" };

    slide4.addText("ANS - Nº 42.202-9", {
      x: 6.5,
      y: 0.2,
      w: 1.5,
      h: 0.3,
      fontSize: 9,
      color: "333333",
      align: "right",
    });

    slide4.addText("Planos sem Coparticipação", {
      x: 0.5,
      y: 0.5,
      w: 7.26,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: kliniOrange,
      align: "center",
    });

    const noCopayRows: any[] = [
      [
        { text: "PLANO", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "Registro ANS", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "Valor Per Capita", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "Fatura Estimada", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
      ],
    ];

    data.mainSheet.plansWithoutCopay.forEach((plan, index) => {
      const isAlt = index % 2 === 1;
      noCopayRows.push([
        { text: plan.name, options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
        { text: String(plan.ansCode), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
        { text: formatCurrency(plan.perCapita), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
        { text: formatCurrency(plan.estimatedInvoice), options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 7 } },
      ]);
    });

    slide4.addTable(noCopayRows, {
      x: 0.5,
      y: 1.2,
      w: 7.26,
      border: { pt: 0.5, color: "CCCCCC" },
      align: "center",
    });

    const firstTableHeight = 0.4 + (noCopayRows.length - 1) * 0.25;
    const secondSectionY = 1.2 + firstTableHeight + 0.4;

    slide4.addText("Valores por Faixa Etária - SEM Coparticipação", {
      x: 0.5,
      y: secondSectionY,
      w: 7.26,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: kliniOrange,
      align: "center",
    });

    if (data.mainSheet.ageBasedPricingNoCopay && data.mainSheet.ageBasedPricingNoCopay.length > 0) {
      const planColumns = Object.keys(data.mainSheet.ageBasedPricingNoCopay[0]).filter(key => key !== 'ageRange');

      const ageRows: any[] = [
        [
          { text: "FAIXA ETÁRIA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 } },
          ...planColumns.map((planName) => ({
            text: planName,
            options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 }
          }))
        ],
      ];

      data.mainSheet.ageBasedPricingNoCopay.forEach((row, rowIndex) => {
        const isAlt = rowIndex % 2 === 1;
        ageRows.push([
          { text: row.ageRange, options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 6 } },
          ...planColumns.map(col => ({
            text: row[col] ? formatCurrency(row[col]) : '-',
            options: { bold: false, color: "333333", fill: { color: isAlt ? lightTeal : "FFFFFF" }, fontSize: 6 }
          }))
        ]);
      });

      const colWidth = (7.26 - 0.8) / planColumns.length;

      slide4.addTable(ageRows, {
        x: 0.5,
        y: secondSectionY + 0.5,
        w: 7.26,
        border: { pt: 0.5, color: "CCCCCC" },
        align: "center",
        colW: [0.8, ...Array(planColumns.length).fill(colWidth)]
      });
    }

    slide4.addText(
      "Esta proposta foi elaborada levando em consideração as informações fornecidas através do formulário de cotação enviado pela Corretora. No caso de implantação do contrato, qualquer incompatibilidade implicará na inviabilidade ou reanálise da proposta.",
      {
        x: 0.5,
        y: 10.8,
        w: 7.26,
        h: 0.6,
        fontSize: 6,
        color: "666666",
        align: "center",
        valign: "top",
      }
    );
  }

  // ==================== PRODUTOS G - COM COPARTICIPAÇÃO ====================
  if (data.productsG && data.productsG.plansWithCopay && data.productsG.plansWithCopay.length > 0) {
    const slideG1 = pptx.addSlide();
    slideG1.background = { color: "FFFFFF" };

    slideG1.addText("ANS - Nº 42.202-9", {
      x: 6.5, y: 0.2, w: 1.5, h: 0.3,
      fontSize: 9, color: "333333", align: "right",
    });

    slideG1.addText("PRODUTOS G - Planos com Coparticipação", {
      x: 0.5, y: 0.5, w: 7.26, h: 0.4,
      fontSize: 14, bold: true, color: kliniOrange, align: "center",
    });

    const copayRowsG: any[] = [
      [
        { text: "PLANO", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "CÓDIGO ANS", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "PER CAPITA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "FATURA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
      ],
    ];

    data.productsG.plansWithCopay.forEach((plan, idx) => {
      const bgColor = idx % 2 === 0 ? "FFFFFF" : lightTeal;
      copayRowsG.push([
        { text: plan.name, options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
        { text: String(plan.ansCode), options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
        { text: formatCurrency(plan.perCapita), options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
        { text: formatCurrency(plan.estimatedInvoice), options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
      ]);
    });

    slideG1.addTable(copayRowsG, {
      x: 0.5, y: 1.1, w: 7.26,
      border: { pt: 0.5, color: "CCCCCC" },
      align: "center",
    });

    const firstTableHeight = 0.4 + (copayRowsG.length - 1) * 0.25;
    const secondSectionY = 1.1 + firstTableHeight + 0.4;

    if (data.productsG.ageBasedPricingCopay && data.productsG.ageBasedPricingCopay.length > 0) {
      slideG1.addText("Valores por Faixa Etária - COM Coparticipação", {
        x: 0.5, y: secondSectionY, w: 7.26, h: 0.35,
        fontSize: 11, bold: true, color: kliniOrange, align: "center",
      });

      const planColumnsG = Object.keys(data.productsG.ageBasedPricingCopay[0]).filter((key) => key !== "ageRange");
      const ageRowsCopayG: any[] = [
        [
          { text: "FAIXA ETÁRIA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 } },
          ...planColumnsG.map((planName) => ({
            text: planName,
            options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 },
          })),
        ],
      ];

      data.productsG.ageBasedPricingCopay.forEach((row, idx) => {
        const bgColor = idx % 2 === 0 ? "FFFFFF" : lightTeal;
        ageRowsCopayG.push([
          { text: row.ageRange, options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 6 } },
          ...planColumnsG.map((col) => ({
            text: row[col] ? formatCurrency(row[col]) : "-",
            options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 6 },
          })),
        ]);
      });

      const colWidthG = (7.26 - 0.8) / planColumnsG.length;
      slideG1.addTable(ageRowsCopayG, {
        x: 0.5, y: secondSectionY + 0.4, w: 7.26,
        border: { pt: 0.5, color: "CCCCCC" },
        align: "center",
        colW: [0.8, ...Array(planColumnsG.length).fill(colWidthG)],
      });
    }

    slideG1.addText("Esta proposta foi elaborada levando em consideração as informações fornecidas através do formulário de cotação enviado pela Corretora.", {
      x: 0.5, y: 10.8, w: 7.26, h: 0.7,
      fontSize: 6, color: "999999", align: "center", valign: "top",
    });
  }

  // ==================== PRODUTOS G - SEM COPARTICIPAÇÃO ====================
  if (data.productsG && data.productsG.plansWithoutCopay && data.productsG.plansWithoutCopay.length > 0) {
    const slideG2 = pptx.addSlide();
    slideG2.background = { color: "FFFFFF" };

    slideG2.addText("ANS - Nº 42.202-9", {
      x: 6.5, y: 0.2, w: 1.5, h: 0.3,
      fontSize: 9, color: "333333", align: "right",
    });

    slideG2.addText("PRODUTOS G - Planos sem Coparticipação", {
      x: 0.5, y: 0.5, w: 7.26, h: 0.4,
      fontSize: 14, bold: true, color: kliniOrange, align: "center",
    });

    const noCopayRowsG: any[] = [
      [
        { text: "PLANO", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "CÓDIGO ANS", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "PER CAPITA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
        { text: "FATURA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 8 } },
      ],
    ];

    data.productsG.plansWithoutCopay.forEach((plan, idx) => {
      const bgColor = idx % 2 === 0 ? "FFFFFF" : lightTeal;
      noCopayRowsG.push([
        { text: plan.name, options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
        { text: String(plan.ansCode), options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
        { text: formatCurrency(plan.perCapita), options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
        { text: formatCurrency(plan.estimatedInvoice), options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 7 } },
      ]);
    });

    slideG2.addTable(noCopayRowsG, {
      x: 0.5, y: 1.1, w: 7.26,
      border: { pt: 0.5, color: "CCCCCC" },
      align: "center",
    });

    const firstTableHeight = 0.4 + (noCopayRowsG.length - 1) * 0.25;
    const secondSectionY = 1.1 + firstTableHeight + 0.4;

    if (data.productsG.ageBasedPricingNoCopay && data.productsG.ageBasedPricingNoCopay.length > 0) {
      slideG2.addText("Valores por Faixa Etária - SEM Coparticipação", {
        x: 0.5, y: secondSectionY, w: 7.26, h: 0.35,
        fontSize: 11, bold: true, color: kliniOrange, align: "center",
      });

      const planColumnsG2 = Object.keys(data.productsG.ageBasedPricingNoCopay[0]).filter((key) => key !== "ageRange");
      const ageRowsNoCopayG: any[] = [
        [
          { text: "FAIXA ETÁRIA", options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 } },
          ...planColumnsG2.map((planName) => ({
            text: planName,
            options: { bold: true, color: "FFFFFF", fill: { color: kliniTeal }, fontSize: 6 },
          })),
        ],
      ];

      data.productsG.ageBasedPricingNoCopay.forEach((row, idx) => {
        const bgColor = idx % 2 === 0 ? "FFFFFF" : lightTeal;
        ageRowsNoCopayG.push([
          { text: row.ageRange, options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 6 } },
          ...planColumnsG2.map((col) => ({
            text: row[col] ? formatCurrency(row[col]) : "-",
            options: { bold: false, color: "333333", fill: { color: bgColor }, fontSize: 6 },
          })),
        ]);
      });

      const colWidthG2 = (7.26 - 0.8) / planColumnsG2.length;
      slideG2.addTable(ageRowsNoCopayG, {
        x: 0.5, y: secondSectionY + 0.4, w: 7.26,
        border: { pt: 0.5, color: "CCCCCC" },
        align: "center",
        colW: [0.8, ...Array(planColumnsG2.length).fill(colWidthG2)],
      });
    }

    slideG2.addText("Esta proposta foi elaborada levando em consideração as informações fornecidas através do formulário de cotação enviado pela Corretora.", {
      x: 0.5, y: 10.8, w: 7.26, h: 0.7,
      fontSize: 6, color: "999999", align: "center", valign: "top",
    });
  }

  // Salvar arquivo
  await pptx.writeFile({ fileName: `Proposta_${data.companyName || 'Klini_Saude'}.pptx` });
};

