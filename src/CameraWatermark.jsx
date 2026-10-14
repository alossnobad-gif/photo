import React,{useEffect,useRef,useState} from 'react';
import {equipmentLines} from './camera-equipment';
import {libraryRequest} from './library-request';
import './camera-watermark.css';
const requests=new Map();let pending=Promise.resolve();
export default function CameraWatermark({photo,equipment}){
 const [value,setValue]=useState(equipment||null),anchor=useRef(null);
 useEffect(()=>{setValue(equipment||null);if(equipment)return;if(typeof photo!=='string'||!/^\/photos\/[a-f0-9-]+\.(jpeg|png|webp)$/.test(photo))return;let active=true;const load=()=>{if(!requests.has(photo)){const task=pending.catch(()=>{}).then(()=>libraryRequest('/api/photo-equipment/'+photo.slice(8)));pending=task;requests.set(photo,task);task.catch(()=>requests.delete(photo));}requests.get(photo).then(result=>{if(active)setValue(result.equipment);}).catch(()=>{});};if(typeof IntersectionObserver==='undefined'){load();return()=>{active=false;};}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){load();observer.disconnect();}},{rootMargin:'100px'});if(anchor.current)observer.observe(anchor.current);return()=>{active=false;observer.disconnect();};},[photo,equipment]);
 const lines=equipmentLines(value),heading=[lines.camera,lines.lens].filter(Boolean).join(' · '),visible=heading||lines.numbers;
 return <span ref={anchor} className={'camera-watermark '+(visible?'has-equipment':'')} aria-label={visible?'拍摄参数：'+[heading,lines.numbers].filter(Boolean).join('；'):undefined}>{heading?<span title={heading}>{heading}</span>:null}{lines.numbers?<small>{lines.numbers}</small>:null}</span>;
}
