import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connectFjuProjects,FJU_PROJECT_SLIDES,FJU_PROJECTS} from '../src/utils/fju-content.ts';
import {isSharedStateUpdate,readSharedStorage} from '../src/utils/shared-state.ts';

test('project chapters stay together after an old or interleaved order, without disturbing other media',()=>{
 const input=['seat','fju_project_media','custom_a','fju_projects','verse_1','fju_project_culture','fju_project_sports'];
 assert.deepEqual(connectFjuProjects(input),['seat',...FJU_PROJECT_SLIDES,'custom_a','verse_1']);
 assert.deepEqual(input,['seat','fju_project_media','custom_a','fju_projects','verse_1','fju_project_culture','fju_project_sports']);
 assert.deepEqual(connectFjuProjects(['seat','verse_1']),['seat','verse_1']);
 assert.deepEqual(FJU_PROJECTS.map(p=>p.name),['Esportes','Cultura','Mídia']);
});
test('optional project selection is portable and rejects malformed remote values',()=>{
 for(const value of [true,false,'true','false'])assert.equal(isSharedStateUpdate('fjuProjectsEnabled',value),true);
 for(const value of [null,1,'yes',{},[]])assert.equal(isSharedStateUpdate('fjuProjectsEnabled',value),false);
 assert.deepEqual(readSharedStorage({projection_fjuProjectsEnabled:'true'}),{projection_fjuProjectsEnabled:'true'});
});
