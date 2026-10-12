import test from 'node:test';import assert from 'node:assert/strict';
import {matchesRecognitionStatus} from '../src/library-recognition.js';
test('all-submission filter includes landscape-only submissions and excludes them from unsubmitted',()=>{
 const item={recognition:{species:{status:'unsubmitted'},landscape:{status:'saved'}}};
 assert.equal(matchesRecognitionStatus(item,'saved'),true);
 assert.equal(matchesRecognitionStatus(item,'unsubmitted'),false);
 assert.equal(matchesRecognitionStatus(item,'unsubmitted','species'),true);
 assert.equal(matchesRecognitionStatus({},'unsubmitted'),true);
 for(const status of ['active','review','failed','recognized']){
  const row={recognition:{landscape:{status}}};
  assert.equal(matchesRecognitionStatus(row,status),true);
  assert.equal(matchesRecognitionStatus(row,'unsubmitted'),false);
 }
});
