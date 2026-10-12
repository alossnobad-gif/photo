import test from 'node:test';import assert from 'node:assert/strict';import {libraryStatuses} from './library-status.js';
test('library tracks exact photo and kind independently, including saved photos without queue history',()=>{
 const items=[{photo:'/photos/a.jpeg',sourceFile:'same.arw'},{photo:'/photos/b.jpeg',sourceFile:'same.arw'},{photo:'/photos/c.jpeg'}];
 const result=libraryStatuses(items,[{photo:'/photos/a.jpeg'}],[],[{photo:'/photos/b.jpeg',kind:'species',status:'review'},{photo:'/photos/b.jpeg',kind:'landscape',status:'processing'},{photo:'/photos/c.jpeg',kind:'species',status:'completed'}]);
 assert.equal(result[0].recognition.species.status,'saved');assert.equal(result[0].recognition.landscape.status,'unsubmitted');assert.equal(result[1].recognition.species.status,'review');assert.equal(result[1].recognition.landscape.status,'active');assert.equal(result[2].recognition.species.status,'recognized');assert.equal(items[0].recognition,undefined);
});
test('direct landscape saves update library without queue history',()=>{
 const [item]=libraryStatuses([{photo:'/photos/a.jpeg'}],[],[{photo:'/photos/a.jpeg'}],[]);
 assert.equal(item.recognition.landscape.status,'saved');
 assert.equal(item.recognition.species.status,'unsubmitted');
});
