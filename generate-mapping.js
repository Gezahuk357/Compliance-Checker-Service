const axios = require('axios');
const fs = require('fs');

// Configuration
const EVIDENCE_ANALYZER_URL = 'http://localhost:2002';
const DOCUMENT_PATH = './sample-documents/security-policy-comprehensive.txt';

async function generateMapping() {
  try {
    console.log('1. Dokumentum feltöltése és elemzése...');
    
    // Read document
    const documentContent = fs.readFileSync(DOCUMENT_PATH, 'utf8');
    
    // Upload document for analysis
    const FormData = require('form-data');
    const form = new FormData();
    form.append('document', fs.createReadStream(DOCUMENT_PATH));
    
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
    console.log(`   Dokumentum feltöltve. ID: ${documentId}`);
    console.log(`   Dokumentum típusa: ${uploadResponse.data.analysis.document_type}`);
    
    console.log('\n2. ISO 27001 Essential Controls leképezés generálása...');
    
    // Generate mapping
    const mappingResponse = await axios.post(
      `${EVIDENCE_ANALYZER_URL}/analyze/mapping`,
      {
        document_id: documentId
      }
    );
    
    const mappingData = mappingResponse.data;
    
    console.log(`   Összes ellenőrzött tétel: ${mappingData.total_controls}`);
    console.log(`   Megfelelő tételek: ${mappingData.matched_controls}`);
    console.log(`   Nem megfelelő tételek: ${mappingData.unmatched_controls}`);
    console.log(`   Megfelelési arány: ${((mappingData.matched_controls / mappingData.total_controls) * 100).toFixed(2)}%`);
    
    console.log('\n3. Részletes leképezés:');
    console.log('=====================');
    
    // Display matched items
    const matchedItems = mappingData.mapping_results.filter(item => item.matches);
    if (matchedItems.length > 0) {
      console.log('\nMEGFELELŐ TÉTELEK:');
      matchedItems.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.control_id} [${item.category}]`);
        console.log(`   Követelmény: ${item.requirement}`);
        console.log(`   Bizonyossági szint: ${(item.confidence * 100).toFixed(0)}%`);
        console.log(`   Indoklás: ${item.reasoning}`);
        console.log(`   Forrás dokumentum: ${item.source_document}`);
      });
    }
    
    // Display unmatched items
    const unmatchedItems = mappingData.mapping_results.filter(item => !item.matches);
    if (unmatchedItems.length > 0) {
      console.log('\nNEM MEGFELELŐ TÉTELEK:');
      unmatchedItems.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.control_id} [${item.category}]`);
        console.log(`   Követelmény: ${item.requirement}`);
        console.log(`   Indoklás: ${item.reasoning}`);
        console.log(`   Hiányzó elemek: ${item.missing_elements}`);
        console.log(`   Forrás dokumentum: ${item.source_document}`);
      });
    }
    
    console.log('\n4. Jelentés mentése...');
    
    // Save report to file
    const reportFileName = `ISO-27001-mapping-${new Date().toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(reportFileName, mappingData.report_content);
    console.log(`   Jelentés mentve: ${reportFileName}`);
    
    console.log('\n5. Vizuális leképezés:');
    console.log('==================');
    
    // Create visual mapping
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    ISO 27001 ESSENTIAL CONTROLS               │');
    console.log('│                         LEKÉPEZÉS                            │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Forrás dokumentum: ${mappingData.document_filename.padEnd(51)} │`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    
    mappingData.mapping_results.forEach(item => {
      const status = item.matches ? '✓' : '✗';
      const confidence = item.matches ? `(${(item.confidence * 100).toFixed(0)}%)` : '';
      const line = `│ ${status} ${item.control_id} [${item.category}] ${confidence}`.padEnd(58) + '│';
      console.log(line);
    });
    
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    console.log('\nA leképezés sikeresen elkészült!');
    
  } catch (error) {
    console.error('Hiba történt a leképezés generálása közben:', error.message);
    if (error.response) {
      console.error('Szerver válasz:', error.response.data);
    }
  }
}

// Run the mapping generation
generateMapping();