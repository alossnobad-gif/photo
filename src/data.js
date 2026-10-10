export const categories=['全部','鸟类','动物','植物','昆虫','菌类'];
export const examples=[
{name:'普通翠鸟',latin:'Alcedo atthis',category:'鸟类',rarity:'少见',photo:'/demo-0.jpg',description:'普通翠鸟是一种体型小巧、色彩鲜艳的鸟类。蓝绿色的背羽与橙色腹部形成鲜明对比，常停在水边枝头，观察水面后俯冲捕捉小鱼。',habitat:'河流、湖泊与池塘附近，有清澈水面及可供停栖的枝条。'},
{name:'白鹭',latin:'Egretta garzetta',category:'鸟类',rarity:'常见',photo:'/demo-1.jpg',description:'白鹭是鹭科鸟类，羽毛洁白，体态修长。常在浅水处缓步寻找鱼类、甲壳类和水生昆虫。',habitat:'湿地、河滩、稻田与沿海浅水区域。'},
{name:'梅花鹿',latin:'Cervus nippon',category:'动物',rarity:'少见',photo:'/demo-2.jpg',description:'梅花鹿夏季被毛呈栗褐色，具有明显白色斑点。它们以草、嫩叶与枝条为食，清晨和傍晚较为活跃。',habitat:'森林边缘、林间草地及灌丛。'},
{name:'银杏',latin:'Ginkgo biloba',category:'植物',rarity:'常见',photo:'/demo-3.jpg',description:'银杏的扇形叶片十分独特，秋季变为金黄色。它属于古老的裸子植物谱系，是城市与园林中常见的树种。',habitat:'公园、庭院、城市道路和山地林区。'},
{name:'玉带凤蝶',latin:'Papilio polytes',category:'昆虫',rarity:'少见',photo:'/demo-4.jpg',description:'玉带凤蝶属于凤蝶科，翅色与斑纹在不同性别和形态之间具有差异，成虫常在花间吸食花蜜。',habitat:'温暖地区的林缘、花园与农田附近。'},
{name:'香菇',latin:'Lentinula edodes',category:'菌类',rarity:'常见',photo:'/demo-5.jpg',description:'香菇是一种木腐菌，菌盖多呈褐色。野外菌类常有外形相似的种类，仅凭照片不能判断是否可食用。',habitat:'阔叶树枯木与适合栽培的菌木。'}
].map((s,i)=>({...s,id:'demo-'+i,demo:true,discovered:'2026-10-10T00:00:00Z'}));
