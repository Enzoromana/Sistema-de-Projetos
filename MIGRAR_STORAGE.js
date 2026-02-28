import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// CONFIGURAÇÃO DOS PROJETOS
const OLD_PROJECT = {
    url: 'https://vyibcbedcilkxpdrizet.supabase.co',
    key: 'INSERIR_SERVICE_ROLE_KEY_ANTIGA' // Use a SERVICE_ROLE_KEY para ter permissão total de leitura
};

const NEW_PROJECT = {
    url: 'https://kllrggoiumxeaifumhlj.supabase.co',
    key: 'INSERIR_SERVICE_ROLE_KEY_NOVA' // Use a SERVICE_ROLE_KEY para ter permissão total de escrita
};

const BUCKET_NAME = 'medical-board';

const oldSupabase = createClient(OLD_PROJECT.url, OLD_PROJECT.key);
const newSupabase = createClient(NEW_PROJECT.url, NEW_PROJECT.key);

async function migrateStorage() {
    console.log(`🚀 Iniciando migração do bucket: ${BUCKET_NAME}...`);

    try {
        // 1. Listar todos os arquivos recursivamente
        const { data: files, error: listError } = await oldSupabase.storage
            .from(BUCKET_NAME)
            .list('', { limit: 1000, recursive: true });

        if (listError) throw listError;

        console.log(`📦 Encontrados ${files.length} itens para migrar.`);

        for (const file of files) {
            // Pular pastas (o Supabase cria pastas automaticamente no upload do arquivo)
            if (!file.id) continue;

            const filePath = file.name;
            console.log(` 🔄 Migrando: ${filePath}...`);

            // 2. Download do projeto antigo
            const { data: blob, error: downloadError } = await oldSupabase.storage
                .from(BUCKET_NAME)
                .download(filePath);

            if (downloadError) {
                console.error(` ❌ Erro no download (${filePath}):`, downloadError.message);
                continue;
            }

            // 3. Upload para o projeto novo
            const { error: uploadError } = await newSupabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, blob, {
                    upsert: true,
                    contentType: file.metadata?.mimetype
                });

            if (uploadError) {
                console.error(` ❌ Erro no upload (${filePath}):`, uploadError.message);
            } else {
                console.log(` ✅ Sucesso: ${filePath}`);
            }
        }

        console.log('\n✨ Migração de Storage concluída!');
    } catch (err) {
        console.error('\n💥 Erro crítico na migração:', err.message);
    }
}

migrateStorage();
