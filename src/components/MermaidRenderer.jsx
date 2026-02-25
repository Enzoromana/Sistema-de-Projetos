import { useEffect, useRef } from 'react';

export default function MermaidRenderer({ chart, id = 'mermaid-chart' }) {
    const mermaidRef = useRef(null);

    useEffect(() => {
        if (window.mermaid && chart) {
            const cleanChart = chart.replace(/\\n/g, '\n');
            window.mermaid.render(id, cleanChart).then(({ svg }) => {
                if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = svg;
                }
            }).catch(err => {
                console.error('Mermaid render error:', err);
                if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = `<div class="p-4 bg-red-50 text-red-500 rounded-xl text-xs font-mono">Erro no Diagrama: ${err.message}</div>`;
                }
            });
        }
    }, [chart, id]);

    return (
        <div
            ref={mermaidRef}
            className="flex justify-center p-6 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-inner overflow-x-auto min-h-[200px] transition-all duration-500 hover:shadow-2xl"
        />
    );
}
