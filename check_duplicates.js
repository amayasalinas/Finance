// Script to check for duplicate transactions in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysvjobfgxovbhahxnkfi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmpvYmZneG92YmhhaHhua2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MDQ4MjgsImV4cCI6MjA1MTE4MDgyOH0.0n5wQmcTjp07qcslD6W1kxQl5qhtFP5iVrxSx2C7kGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    // Get all transactions for familia user (family_id = 'default')
    const { data, error } = await supabase
        .from('movimientos')
        .select('*')
        .eq('family_id', 'default')
        .order('fecha', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log(`\n📊 Total transactions in DB: ${data.length}`);

    // Check for duplicates (same fecha, valor, detalle)
    const duplicateGroups = {};
    data.forEach((t, idx) => {
        const key = `${t.fecha}_${t.valor}_${t.detalle}`;
        if (!duplicateGroups[key]) {
            duplicateGroups[key] = [];
        }
        duplicateGroups[key].push({ idx: idx + 1, id: t.id, ...t });
    });

    const duplicates = Object.values(duplicateGroups).filter(g => g.length > 1);

    if (duplicates.length > 0) {
        console.log(`\n⚠️  FOUND ${duplicates.length} GROUPS OF DUPLICATES:\n`);
        duplicates.slice(0, 10).forEach((group, i) => {
            console.log(`Group ${i + 1}: ${group.length} copies`);
            group.forEach(t => {
                console.log(`  - ID: ${t.id} | Fecha: ${t.fecha} | Valor: ${t.valor} | Cat: ${t.categoria} | Det: ${t.detalle}`);
            });
            console.log('');
        });

        const totalDuplicateCount = duplicates.reduce((sum, g) => sum + (g.length - 1), 0);
        console.log(`\n🔢 Total duplicate records: ${totalDuplicateCount}`);
    } else {
        console.log('\n✅ No duplicates found');
    }

    // Check Restaurantes in Jan 2026
    const restaurantes = data.filter(t =>
        t.categoria === 'Restaurantes' &&
        t.fecha && t.fecha.startsWith('2026-01')
    );

    console.log(`\n🍽️  Restaurantes in Jan 2026: ${restaurantes.length} transactions`);
    const totalRestaurantes = restaurantes.reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
    console.log(`💰 Total Restaurantes: $${totalRestaurantes.toLocaleString('es-CO')}`);

    // Show first 5
    console.log('\nFirst 5 Restaurantes transactions:');
    restaurantes.slice(0, 5).forEach(t => {
        console.log(`  ${t.fecha} | $${t.valor} | ${t.detalle || 'N/A'}`);
    });

    // Group by fecha to find duplicates
    const byDate = {};
    restaurantes.forEach(t => {
        if (!byDate[t.fecha]) byDate[t.fecha] = [];
        byDate[t.fecha].push(t);
    });

    const dateDuplicates = Object.entries(byDate).filter(([_, arr]) => arr.length > 1);
    if (dateDuplicates.length > 0) {
        console.log(`\n⚠️  Found ${dateDuplicates.length} dates with multiple Restaurantes transactions:`);
        dateDuplicates.slice(0, 5).forEach(([fecha, arr]) => {
            console.log(`  ${fecha}: ${arr.length} transactions, total: $${arr.reduce((s, t) => s + t.valor, 0)}`);
        });
    }
}

checkDuplicates();
