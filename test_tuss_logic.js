
const TUSS_DATA = [
    { code: "10101012", label: "10101012 - Consulta em consultório", description: "Consulta em consultório" },
    { code: "10101020", label: "10101020 - Consulta em domicílio", description: "Consulta em domicílio" },
    { code: "20104010", label: "20104010 - Teste longo", description: "Teste longo" }
];

function handleSearch(term) {
    console.log(`Searching for: "${term}"`);
    if (term.length < 2) {
        console.log("Term too short");
        return;
    }

    const lowerTerm = term.toLowerCase().trim();

    const filtered = TUSS_DATA.filter(item =>
        item.code !== 'Código' && (
            item.label.toLowerCase().includes(lowerTerm) ||
            (item.code && item.code.toLowerCase().includes(lowerTerm))
        )
    ).sort((a, b) => {
        const aCode = (a.code || '').toLowerCase();
        const bCode = (b.code || '').toLowerCase();

        // 1. Exact code match
        if (aCode === lowerTerm && bCode !== lowerTerm) return -1;
        if (aCode !== lowerTerm && bCode === lowerTerm) return 1;

        // 2. Code starts with term
        const aCodeStarts = aCode.startsWith(lowerTerm);
        const bCodeStarts = bCode.startsWith(lowerTerm);
        if (aCodeStarts && !bCodeStarts) return -1;
        if (!aCodeStarts && bCodeStarts) return 1;

        // 3. String length difference
        if (aCodeStarts && bCodeStarts) {
            return aCode.length - bCode.length;
        }

        // 4. Alphabetical
        return aCode.localeCompare(bCode);
    });

    console.log("Results:", filtered.map(f => f.code));
}

handleSearch("10");
handleSearch("1010");
handleSearch("10101012");
handleSearch("Con");
