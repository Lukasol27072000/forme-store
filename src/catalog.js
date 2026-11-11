export const collections = {
 azul:{name:'AZUL',tagline:'Керамика. Цвет. Характер.',description:'Молочная основа, тонкий орнамент и насыщенный цвет. Керамические мотивы AZUL напоминают о вещах, которые выбирают надолго: за форму, детали и настроение.'},
 'evil-eye':{name:'EVIL EYE',tagline:'Деталь, которая ловит взгляды.',description:'От лаконичного символа до свободной абстракции. Синие оттенки, графичные глаза и мягкие круги — маленькие личные талисманы для совершенно разных образов.'},
 racetrack:{name:'RACETRACK',tagline:'Твой поворот. Твой цвет.',description:'Прибрежная трасса, океан и болид в любимом оттенке. Пять цветовых акцентов, в которых встречаются азарт гонки и настроение бесконечного лета.'},
 leopard:{name:'ANIMAL EDIT',tagline:'Спокойный цвет. Дикий характер.',description:'Леопарды, тонкая анималистичная графика и принты с эффектом фактуры. Молочный, чёрный, хаки и бургунди — выразительные детали, которые легко вписать в свой гардероб.'},
 'apres-ski':{name:'APRÈS-SKI',tagline:'После спуска начинается самое интересное.',description:'Зеркальная маска, горы в отражении и пауза между спусками. Три зимних портрета в молочном, чёрном и винном — с настроением горного курорта даже посреди города.'},
 ocean:{name:'OCEAN CLUB',tagline:'Море ближе, чем кажется.',description:'Миниатюрные сёрферы, белые паруса и след яхты на синей воде. Коллекция о свободном времени, солёном воздухе и желании ещё немного остаться у моря.'},
 'after-hours':{name:'AFTER HOURS',tagline:'У вечера свои планы.',description:'Бильярд, спортивные машины и пальмы в насыщенных оттенках. Истории для часов, которые принадлежат только тебе: после дел, без спешки и с красивыми деталями.'}
};
export const phoneFinishes = {silver:'Silver','deep-blue':'Deep Blue','cosmic-orange':'Cosmic Orange'};

let imageSequence=0;
// Photo boards remain unchanged. SVG viewports isolate one approved product.
export function photoMarkup(value,alt='',className='') {
 let url;
 try {url=new URL(value,location.origin);} catch {return '';}
 if(url.protocol!=='https:' && url.origin!==location.origin)return '';
 const params=new URLSearchParams(url.hash.slice(1));
 const crop=(params.get('view')||'').split(',').map(Number);
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const source=url.href.split('#')[0];
 if(crop.length!==6 || crop.some(v=>!Number.isFinite(v)) || crop.slice(2).some(v=>v<=0))return `<img class="catalog-photo ${escape(className)}" src="${escape(source)}" alt="${escape(alt)}" loading="lazy">`;
 const [x,y,w,h,bw,bh]=crop,id=`catalog-clip-${++imageSequence}`;
 return `<svg class="catalog-photo ${escape(className)}" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${escape(alt)}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="${escape(source)}" x="0" y="0" width="${bw}" height="${bh}" clip-path="url(#${id})"/></svg>`;
}
export function finishOf(url){try{return new URLSearchParams(new URL(url,location.origin).hash.slice(1)).get('finish')||'';}catch{return '';}}
