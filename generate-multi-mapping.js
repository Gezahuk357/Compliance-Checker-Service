const axios = require('axios');
const fs = require('fs');

// Configuration
const EVIDENCE_ANALYZER_URL = 'http://localhost:2002';

// Documents to process
const documents = [
    { path: './sample-documents/security-policy-comprehensive.txt', name: 'security-policy-comprehensive.txt' },
    { path: './sample-documents/incident-response-plan.txt', name: 'incident-response-plan.txt' },
    { path: './sample-documents/password-policy.txt', name: 'password-policy.txt' },
    { path: './sample-documents/backup-policy.txt', name: 'backup-policy.txt' }
];

async function generateMultiMapping() {
    try {
        console.log('1. Dokumentumok feltöltése és elemzése...');
        
        const documentAnalyses = [];
        
        // Process each document
        for (const doc of documents) {
            if (!fs.existsSync(doc.path)) {
                console.log(`   FIGYELEM: ${doc.name} nem található, kihagyva.`);
                continue;
            }
            
            console.log(`   Dokumentum feldolgozása: ${doc.name}`);
            
            // Upload document for analysis
            const FormData = require('form-data');
            const form = new FormData();
            form.append('document', fs.createReadStream(doc.path));
            
            const uploadResponse = await axios.post(
                `${EVIDENCE_ANALYZER_URL}/analyze/document`,
                form,
                {
                    headers: {
                        ...form.getHeaders()
                    }
                }
            );
            
            const documentId = uploadResponse.data.document_id;
            const documentType = uploadResponse.data.analysis.document_type;
            
            console.log(`     Dokumentum feltöltve. ID: ${documentId}`);
            console.log(`     Dokumentum típusa: ${documentType}`);
            
            documentAnalyses.push({
                name: doc.name,
                id: documentId,
                type: documentType
            });
        }
        
        console.log('\n2. ISO 27001 Essential Controls leképezés generálása minden dokumentumhoz...');
        
        const allResults = [];
        
        // Generate mapping for each document
        for (const docAnalysis of documentAnalyses) {
            console.log(`   Leképezés generálása: ${docAnalysis.name}`);
            
            try {
                // Generate mapping
                const mappingResponse = await axios.post(
                    `${EVIDENCE_ANALYZER_URL}/analyze/mapping`,
                    {
                        document_id: docAnalysis.id
                    }
                );
                
                const mappingData = mappingResponse.data;
                
                console.log(`     Összes ellenőrzött tétel: ${mappingData.total_controls}`);
                console.log(`     Megfelelő tételek: ${mappingData.matched_controls}`);
                console.log(`     Nem megfelelő tételek: ${mappingData.unmatched_controls}`);
                console.log(`     Megfelelési arány: ${((mappingData.matched_controls / mappingData.total_controls) * 100).toFixed(2)}%`);
                
                // Add results to collection
                mappingData.mapping_results.forEach(result => {
                    allResults.push({
                        ...result,
                        source_document: docAnalysis.name,
                        document_type: docAnalysis.type
                    });
                });
                
            } catch (error) {
                console.log(`     Hiba a leképezés generálása közben: ${error.message}`);
            }
        }
        
        console.log('\n3. Összesített eredmények elemzése...');
        
        // Find best matches for each control
        const bestMatches = {};
        const controlIds = [...new Set(allResults.map(r => r.control_id))];
        
        for (const controlId of controlIds) {
            const matches = allResults.filter(r => r.control_id === controlId && r.matches);
            
            if (matches.length > 0) {
                // Find the match with highest confidence
                const bestMatch = matches.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                bestMatches[controlId] = bestMatch;
            } else {
                // No match found
                const nonMatch = allResults.find(r => r.control_id === controlId);
                bestMatches[controlId] = {
                    ...nonMatch,
                    matches: false,
                    confidence: 0,
                    reasoning: 'Egyik dokumentum sem felel meg ennek a követelménynek.',
                    missing_elements: 'Dokumentum szükséges, amely tartalmazza a követelménynek megfelelő szabályzatot vagy eljárást.'
                };
            }
        }
        
        const finalResults = Object.values(bestMatches);
        const matchedItems = finalResults.filter(r => r.matches);
        const unmatchedItems = finalResults.filter(r => !r.matches);
        
        const totalItems = finalResults.length;
        const complianceRate = ((matchedItems.length / totalItems) * 100).toFixed(2);
        
        console.log(`   Összes ellenőrzött tétel: ${totalItems}`);
        console.log(`   Megfelelő tételek: ${matchedItems.length}`);
        console.log(`   Nem megfelelő tételek: ${unmatchedItems.length}`);
        console.log(`   Megfelelési arány: ${complianceRate}%`);
        
        console.log('\n4. Részletes leképezés:');
        console.log('=====================\n');
        
        if (matchedItems.length > 0) {
            console.log('MEGFELELŐ TÉTELEK:\n');
            matchedItems.forEach((item, index) => {
                console.log(`${index + 1}. ${item.control_id} [${item.category}]`);
                console.log(`   Követelmény: ${item.requirement}`);
                console.log(`   Bizonyossági szint: ${(item.confidence * 100).toFixed(0)}%`);
                console.log(`   Indoklás: ${item.reasoning}`);
                console.log(`   Forrás dokumentum: ${item.source_document}\n`);
            });
        }
        
        if (unmatchedItems.length > 0) {
            console.log('NEM MEGFELELŐ TÉTELEK:\n');
            unmatchedItems.forEach((item, index) => {
                console.log(`${index + 1}. ${item.control_id} [${item.category}]`);
                console.log(`   Követelmény: ${item.requirement}`);
                console.log(`   Indoklás: ${item.reasoning}`);
                console.log(`   Hiányzó elemek: ${item.missing_elements}`);
                console.log(`   Forrás dokumentum: ${item.source_document}\n`);
            });
        }
        
        console.log('5. Jelentés mentése...');
        
        // Generate comprehensive report
        const reportContent = generateComprehensiveReport(finalResults, documentAnalyses, complianceRate);
        const reportFileName = `ISO-27001-multi-mapping-${new Date().toISOString().split('T')[0]}.txt`;
        fs.writeFileSync(reportFileName, reportContent, 'utf8');
        
        console.log(`   Jelentés mentve: ${reportFileName}`);
        
        console.log('\n6. Vizuális leképezés:');
        console.log('===================\n');
        
        generateVisualMapping(finalResults, documentAnalyses);
        
        console.log('\nA több dokumentumos leképezés sikeresen elkészült!');
        
    } catch (error) {
        console.error('Hiba történt a leképezés generálása közben:', error.message);
        if (error.response) {
            console.error('Szerver válasz:', error.response.data);
        }
    }
}

function generateComprehensiveReport(results, documentAnalyses, complianceRate) {
    const matchedItems = results.filter(r => r.matches);
    const nonMatchedItems = results.filter(r => !r.matches);
    
    let report = `ISO 27001 ESSENTIAL CONTROLS TÖBB DOKUMENTUMOS LEKÉPEZÉS JELENTÉS\n`;
    report += `====================================================================\n\n`;
    
    // Source documents list
    const sourceDocs = documentAnalyses.map(doc => `${doc.name} (${doc.type})`);
    report += `Forrás dokumentumok: ${sourceDocs.join(', ')}\n`;
    report += `Jelentés dátuma: ${new Date().toLocaleString('hu-HU')}\n\n`;
    
    report += `ÖSSZESZEDÉS:\n`;
    report += `- Összes ellenőrzött tétel: ${results.length}\n`;
    report += `- Megfelelő tételek: ${matchedItems.length}\n`;
    report += `- Nem megfelelő tételek: ${nonMatchedItems.length}\n`;
    report += `- Megfelelési arány: ${complianceRate}%\n\n`;
    
    report += `RÉSZLETES LEKÉPEZÉS:\n`;
    report += `===================\n\n`;
    
    if (matchedItems.length > 0) {
        report += `MEGFELELŐ TÉTELEK (${matchedItems.length} db):\n`;
        report += `-----------------------------------\n\n`;
        
        matchedItems.forEach((item, index) => {
            report += `${index + 1}. Tétel: ${item.control_id} [${item.category}]\n`;
            report += `   Követelmény: ${item.requirement}\n`;
            report += `   Bizonyossági szint: ${(item.confidence * 100).toFixed(0)}%\n`;
            report += `   Indoklás: ${item.reasoning}\n`;
            report += `   Forrás dokumentum: ${item.source_document}\n`;
            
            if (item.relevant_sections && item.relevant_sections.length > 0) {
                report += `   \n   Releváns szakaszok:\n`;
                item.relevant_sections.forEach(section => {
                    report += `   - "${section}"\n`;
                });
            }
            
            report += '\n';
        });
    }
    
    if (nonMatchedItems.length > 0) {
        report += `NEM MEGFELELŐ TÉTELEK (${nonMatchedItems.length} db):\n`;
        report += `---------------------------------------\n\n`;
        
        nonMatchedItems.forEach((item, index) => {
            report += `${index + 1}. Tétel: ${item.control_id} [${item.category}]\n`;
            report += `   Követelmény: ${item.requirement}\n`;
            report += `   Indoklás: ${item.reasoning}\n`;
            report += `   Hiányzó elemek: ${item.missing_elements}\n`;
            report += `   Forrás dokumentum: ${item.source_document}\n`;
            
            report += `   \n   Javaslatok:\n`;
            const suggestions = item.missing_elements.split('.').filter(s => s.trim());
            suggestions.forEach(suggestion => {
                report += `   - ${suggestion.trim()}\n`;
            });
            
            report += '\n';
        });
    }
    
    report += `DOKUMENTUMONKÉNTI STATISZTIKA:\n`;
    report += `========================\n\n`;
    
    // Document-wise statistics
    const docStats = {};
    matchedItems.forEach(item => {
        if (!docStats[item.source_document]) {
            docStats[item.source_document] = 0;
        }
        docStats[item.source_document]++;
    });
    
    Object.entries(docStats).forEach(([doc, count]) => {
        const docAnalysis = documentAnalyses.find(d => d.name === doc);
        const docType = docAnalysis ? docAnalysis.type : 'Ismeretlen';
        report += `- ${doc} (${docType}): ${count} megfelelő tétel\n`;
    });
    
    report += `\nÖSSZEGZÉS ÉS JAVASLATOK:\n`;
    report += `=======================\n\n`;
    
    report += `A dokumentumok elemzése alapján az alábbi megállapításokat tehetjük:\n\n`;
    
    report += `1. ERŐSSÉGEK:\n`;
    report += `   - A dokumentumok ${matchedItems.length} ISO 27001 Essential Controls tételnek felelnek meg\n`;
    if (matchedItems.length > 0) {
        const categories = [...new Set(matchedItems.map(item => item.category))];
        report += `   - Kiemelkedően kezelt területek: ${categories.join(', ')}\n`;
    }
    
    report += `\n2. GYENGESÉGEK:\n`;
    report += `   - ${nonMatchedItems.length} tétel esetében hiányos a dokumentáció\n`;
    if (nonMatchedItems.length > 0) {
        const categories = [...new Set(nonMatchedItems.map(item => item.category))];
        report += `   - Kiegészítésre szoruló területek: ${categories.join(', ')}\n`;
    }
    
    report += `\n3. JAVASOLT INTÉZKEDÉSEK:\n`;
    report += `   - Hiányzó dokumentumok készítése a nem megfelelő tételekhez\n`;
    report += `   - Meglévő dokumentumok kiegészítése a hiányzó elemekkel\n`;
    report += `   - Rendszeres felülvizsgálat és frissítés\n\n`;
    
    report += `Ez a jelentés automatikusan generálódott a Compliance Checker Service által.\n`;
    
    return report;
}

function generateVisualMapping(results, documentAnalyses) {
    const boxWidth = 70;
    const border = '┌' + '─'.repeat(boxWidth) + '┐';
    const bottomBorder = '└' + '─'.repeat(boxWidth) + '┘';
    
    console.log(border);
    console.log('│' + ' '.repeat(Math.floor((boxWidth - 42) / 2)) + 'ISO 27001 ESSENTIAL CONTROLS - TÖBB DOKUMENTUMOS LEKÉPEZÉS' + ' '.repeat(Math.ceil((boxWidth - 42) / 2)) + '│');
    console.log('├' + '─'.repeat(boxWidth) + '┤');
    
    // Source documents
    const sourceDocs = documentAnalyses.map(doc => doc.name);
    if (sourceDocs.length > 0) {
        const sourceLine = `Forrás dokumentumok: ${sourceDocs.join(', ')}`;
        if (sourceLine.length <= boxWidth - 2) {
            console.log('│ ' + sourceLine.padEnd(boxWidth - 1) + '│');
        } else {
            // Multiple lines
            const words = sourceLine.split(' ');
            let currentLine = '│ ';
            for (const word of words) {
                if (currentLine.length + word.length + 1 <= boxWidth - 1) {
                    currentLine += word + ' ';
                } else {
                    console.log(currentLine.padEnd(boxWidth - 1) + '│');
                    currentLine = '│ ' + word + ' ';
                }
            }
            console.log(currentLine.padEnd(boxWidth - 1) + '│');
        }
        console.log('├' + '─'.repeat(boxWidth) + '┤');
    }
    
    // Results
    results.forEach(result => {
        const status = result.matches ? '✓' : '✗';
        const sourceInfo = result.matches ? ` (${result.source_document})` : '';
        const confidence = result.matches ? ` (${(result.confidence * 100).toFixed(0)}%)` : '';
        const line = `${status} ${result.control_id} [${result.category}]${confidence}${sourceInfo}`;
        
        if (line.length <= boxWidth - 2) {
            console.log('│ ' + line.padEnd(boxWidth - 1) + '│');
        } else {
            // Multiple lines
            console.log('│ ' + line.substring(0, boxWidth - 2) + '│');
            if (line.length > boxWidth - 2) {
                console.log('│ ' + line.substring(boxWidth - 2).padEnd(boxWidth - 1) + '│');
            }
        }
    });
    
    console.log(bottomBorder);
}

// Run the multi-document mapping generation
generateMultiMapping();