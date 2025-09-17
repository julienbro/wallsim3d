// Test rapide des modifications de sauvegarde
console.log('🧪 Test des modifications de sauvegarde');

// Simuler la présence des gestionnaires
window.MeasurementAnnotationManager = {
    getMeasurementData: () => [
        { id: 'test1', distance: 150, units: 'cm' },
        { id: 'test2', distance: 200, units: 'cm' }
    ],
    getAnnotationData: () => [
        { id: 'ann1', text: 'Test annotation', position: {x: 0, y: 0, z: 0} }
    ],
    getTextLeaderData: () => [
        { id: 'text1', text: 'Test texte', position: {x: 10, y: 10, z: 0} }
    ]
};

// Test de la fonction updateProjectData modifiée
const testProject = {
    name: 'Test Project',
    version: '1.0',
    created: new Date().toISOString(),
    elements: [],
    settings: { gridSpacing: 10 }
};

function testUpdateProjectData(project) {
    console.log('📊 Test updateProjectData...');
    
    project.modified = new Date().toISOString();
    
    // Récupérer les données des mesures, annotations et textes
    if (window.MeasurementAnnotationManager) {
        if (typeof window.MeasurementAnnotationManager.getMeasurementData === 'function') {
            project.measurements = window.MeasurementAnnotationManager.getMeasurementData();
            console.log(`✅ Mesures récupérées: ${project.measurements.length}`);
        }
        
        if (typeof window.MeasurementAnnotationManager.getAnnotationData === 'function') {
            project.annotations = window.MeasurementAnnotationManager.getAnnotationData();
            console.log(`✅ Annotations récupérées: ${project.annotations.length}`);
        }
        
        if (typeof window.MeasurementAnnotationManager.getTextLeaderData === 'function') {
            project.textLeaders = window.MeasurementAnnotationManager.getTextLeaderData();
            console.log(`✅ Textes récupérés: ${project.textLeaders.length}`);
        }
    }
    
    return project;
}

function testExportProjectData(project) {
    console.log('📤 Test exportProjectData...');
    
    const projectData = {
        ...project,
        modified: new Date().toISOString(),
        elements: project.elements || [],
        settings: project.settings || {},
        measurements: project.measurements || [],
        annotations: project.annotations || [],
        textLeaders: project.textLeaders || []
    };

    const jsonData = JSON.stringify(projectData, null, 2);
    console.log(`✅ Export réussi: ${jsonData.length} caractères`);
    console.log('📋 Contenu du projet:', {
        measurements: projectData.measurements.length,
        annotations: projectData.annotations.length,
        textLeaders: projectData.textLeaders.length
    });
    
    return jsonData;
}

// Exécution des tests
try {
    const updatedProject = testUpdateProjectData(testProject);
    const exportedJson = testExportProjectData(updatedProject);
    
    // Vérification que les données sont bien incluses
    const parsedData = JSON.parse(exportedJson);
    if (parsedData.measurements && parsedData.annotations && parsedData.textLeaders) {
        console.log('🎉 SUCCESS: Toutes les données sont bien incluses dans la sauvegarde !');
        console.log('📊 Résumé final:', {
            measurements: parsedData.measurements.length,
            annotations: parsedData.annotations.length,
            textLeaders: parsedData.textLeaders.length,
            elements: parsedData.elements.length
        });
    } else {
        console.error('❌ ERREUR: Certaines données manquent dans la sauvegarde');
    }
    
} catch (error) {
    console.error('❌ Erreur lors du test:', error);
}