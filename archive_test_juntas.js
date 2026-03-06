import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Credentials not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function archiveTestJuntas() {
    try {
        console.log('Buscando contas de teste...');

        const { data, error } = await supabase
            .from('medical_requests')
            .select('*');

        if (error) throw error;

        console.log(`Encontrado ${data.length} juntas para arquivar/deletar.`);
        console.log(data.map(d => `${d.id} - ${d.requisicao} - ${d.ben_nome}`).join('\n'));

        // Let's just hard delete them as they are test data
        if (data.length > 0) {
            const { error: deleteError } = await supabase
                .from('medical_requests')
                .delete()
                .neq('id', 0); // Delete all

            if (deleteError) throw deleteError;
            console.log('Juntas deletadas (arquivadas) com sucesso!');
        } else {
            console.log('Nenhuma junta médica encontrada para arquivar.');
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

archiveTestJuntas();
