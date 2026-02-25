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
                    const svgElement = mermaidRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.removeAttribute('height');
                        svgElement.style.width = '100%';
                        svgElement.style.height = '100%';
                        svgElement.style.maxWidth = '100%';
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
            className="flex justify-center bg-black/5 hover:bg-black/10 transition-colors p-4 md:p-8 rounded-[2rem] w-full h-full min-h-[inherit]"
        />
    );
}
