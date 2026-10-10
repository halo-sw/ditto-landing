/* A reusable, data-bound provenance layer. Never infer origin from display text. */
(function(root){
  function nameFor(source){
    if(!source || typeof source.userId!=='string' || !source.userId.trim())throw Error('source.userId is required');
    if(source.unavailable)return '알 수 없는 사용자';
    for(const key of ['viewerNickname','publicDisplayName'])if(typeof source[key]==='string'&&source[key].trim())return source[key].trim();
    return '친구';
  }
  function attributionFor(source){return nameFor(source)+'에게서 가져옴';}
  function createCard({kind='photo',source,content={},reference=false,onSourceOpen}={}){
    if(!source||typeof source.widgetId!=='string'||!source.widgetId.trim())throw Error('source.widgetId is required');
    const T=root.DittoAttributionTokens,resolvedName=nameFor(source),name=reference?'@jimin':resolvedName,copy=name+'에게서 가져옴',asset=p=>'../../'+p;
    const make=(tag,className,text)=>{const n=document.createElement(tag);n.className=className;if(text!==undefined)n.textContent=text;return n;};
    const card=make('div','dw-card'+(reference?' dw-reference':''));card.dataset.kind=kind;card.dataset.sourceUser=source.userId;card.dataset.sourceWidget=source.widgetId||'';
    const body=make('div','dw-content');card.append(body);
    if(source.unavailable){body.append(make('p','dw-unavailable','이 위젯을\n볼 수 없어요'));}
    else if(kind==='photo'){
      const img=make('img','dw-photo');img.src=content.image||asset(T.assets.photo);img.alt=content.alt||'레코드 가게에서 고른 음반';img.draggable=false;
      img.addEventListener('error',()=>{img.hidden=true;body.append(make('p','dw-unavailable','사진을 불러오지 못했어요'));},{once:true});body.append(img);
    }else if(kind==='memo'){body.append(make('span','dw-eyebrow','다음에 같이'),make('p','dw-memo',content.text||'우리 다음엔\n이 노래 들으러 가자.'));}
    else if(kind==='music'){
      const cover=make('img','dw-album');cover.src=content.cover||asset(T.assets.photo);cover.alt='';cover.draggable=false;
      const words=make('div','dw-song');words.append(make('strong','',content.title||'seasons'),make('span','',content.artist||'wave to earth'));body.append(cover,words);
    }else if(kind==='date'){body.append(make('span','dw-eyebrow','우리 다시 만나는 날'),make('strong','dw-dday',content.countdown||'D−12'),make('span','dw-date',content.text||'10월의 작은 약속'));}
    const logo=make('img','dw-logo');logo.src=asset(T.assets.badge);logo.alt='Ditto';logo.draggable=false;card.append(logo);
    const footer=make(onSourceOpen?'button':'div','dw-attribution');if(onSourceOpen){footer.type='button';footer.addEventListener('click',()=>onSourceOpen({userId:source.userId,widgetId:source.widgetId,name}));footer.setAttribute('aria-label',copy+' · 출처 정보 보기');}else footer.setAttribute('aria-label',copy);
    const avatar=make('span','dw-avatar');avatar.setAttribute('role','img');avatar.setAttribute('aria-label',name+'의 프로필');
    const fallback=()=>{avatar.classList.add('is-missing');avatar.replaceChildren(make('span','', '·'));avatar.setAttribute('aria-label',name+'의 프로필 이미지 없음');};
    if(source.avatar&&!source.unavailable){const img=make('img','');img.src=source.avatar;img.alt='';img.draggable=false;img.addEventListener('error',fallback,{once:true});avatar.append(img);}else fallback();
    const words=make('span','dw-source-copy'),nick=make('span','dw-name',name),suffix=make('span','dw-suffix','에게서 가져옴');nick.dir='auto';words.append(nick,suffix);footer.append(avatar,words);card.append(footer);return card;
  }
  const api={nameFor,attributionFor,createCard};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DittoAttribution=api;
})(typeof window!=='undefined'?window:globalThis);
