import { useEffect, useRef } from 'react';

export default function MermaidRenderer({ chart, id = 'mermaid-chart' }) {
    const mermaidRef = useRef(null);

    useEffect(() => {
        if (window.mermaid && chart) {
            const cleanChart = chart.replace(/\\n/g, '\n');

            // Configuração de tema personalizada para cada render
            window.mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                themeVariables: {
                    primaryColor: '#6366f1',
                    primaryTextColor: '#fff',
                    primaryBorderColor: '#818cf8',
                    lineColor: '#475569',
                    secondaryColor: '#1e293b',
                    tertiaryColor: '#0f172a',
                    mainBkg: '#0f172a',
                    nodeBorder: '#334155',
                    clusterBkg: 'rgba(99, 102, 241, 0.05)',
                    clusterBorder: 'rgba(99, 102, 241, 0.2)',
                    fontSize: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                }
            });

            window.mermaid.render(id, cleanChart).then(({ svg }) => {
                if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = svg;
                    // Ajustar SVG para ser responsivo
                    const svgElement = mermaidRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.maxWidth = '100%';
                        svgElement.style.height = 'auto';
                    }
                }
            }).catch(err => {
                console.error('Mermaid render error:', err);
                if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = `<div class="p-4 bg-red-500/10 text-red-400 rounded-2xl text-xs font-mono border border-red-500/20 shadow-lg">Erro no Diagrama: ${err.message}</div>`;
                }
            });
        }
    }, [chart, id]);

    return (
        <div
            ref={mermaidRef}
            className="flex justify-center p-10 bg-black/20 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-inner overflow-x-auto min-h-[300px] w-full transition-all duration-700 hover:bg-black/40"
        />
    );
}
