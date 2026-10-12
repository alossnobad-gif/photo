import {adjustmentControls} from './photo-adjustments.js';
export const photoPresets=[
 {id:'original',name:'原色',values:{}},
 {id:'natural',name:'自然通透',values:{exposure:.15,contrast:8,highlights:-12,shadows:14,vibrance:12,clarity:8}},
 {id:'feathers',name:'鸟羽细节',values:{contrast:7,highlights:-18,shadows:10,vibrance:5,clarity:20}},
 {id:'forest',name:'森林清新',values:{temperature:-6,tint:4,highlights:-15,shadows:16,vibrance:18,contrast:5}},
 {id:'mountains',name:'山川层次',values:{contrast:18,highlights:-22,shadows:15,blacks:-8,vibrance:12,clarity:18}},
 {id:'sunset',name:'暖色日落',values:{temperature:20,tint:-3,highlights:-18,shadows:8,vibrance:15,contrast:9}},
 {id:'mist',name:'冷调晨雾',values:{temperature:-15,contrast:-12,highlights:-8,shadows:12,saturation:-10,clarity:-8}},
 {id:'film',name:'胶片柔和',values:{temperature:8,contrast:-10,highlights:-20,blacks:16,saturation:-12,clarity:-6}},
 {id:'mono',name:'经典黑白',values:{saturation:-100,contrast:16,highlights:-12,shadows:10,clarity:10}}
];
export function composePhotoAdjustments(id,strength,manual={}){
 const preset=photoPresets.find(p=>p.id===id)||photoPresets[0];const amount=Math.max(0,Math.min(100,Number(strength)||0))/100;
 return Object.fromEntries(adjustmentControls.map(([key,,min,max])=>[key,Math.max(min,Math.min(max,(preset.values[key]||0)*amount+(manual[key]||0)))]));
}
