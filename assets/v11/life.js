/* Ditto editorial app / analog chapters. Actual image fields, no invented screenshots. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function buildTabs(root,items,render) {
    var active = 0;
    items.forEach(function (item,index) {
      item.button.addEventListener('click',function () { select(index,true); });
      item.button.addEventListener('keydown',function (e) {
        var next;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % items.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index + items.length - 1) % items.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = items.length - 1;
        if (next == null) return;
        e.preventDefault(); select(next,true); items[next].button.focus({preventScroll:true});
      });
    });
    function select(index,animate) {
      var before = items[active];
      active = index;
      items.forEach(function (item,i) {
        var on = i === index;
        item.button.setAttribute('aria-selected',String(on));
        item.button.tabIndex = on ? 0 : -1;
        item.panel.hidden = !on;
        item.button.closest('li').classList.toggle('is-active',on);
      });
      root.dataset.selected = items[index].key;
      render(items[index],index);
      if (animate && before !== items[index] && !reduced.matches && items[index].panel.animate) {
        items[index].panel.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});
      }
    }
    select(0,false);
  }
  function cleanSlot(slot,label,kind) {
    slot.className = 'l11-image-field ' + kind;
    slot.replaceChildren();
    var caption = document.createElement('span'); caption.className = 'l11-field-label';
    caption.textContent = label; slot.appendChild(caption);
    return slot;
  }
  function appChapter() {
    var section = document.getElementById('h8-life');
    if (!section || section.classList.contains('l11-ready')) return;
    var old = section.querySelector('.h8-shots'), wrap = section.querySelector('.wrap');
    if (!old || !wrap) return;
    var nodes = Array.prototype.slice.call(old.children);
    var title = section.querySelector('h2');
    var intro = section.querySelector('.h8-head p');
    var chapter = document.createElement('div'); chapter.className = 'l11-app';
    chapter.innerHTML = '<div class="l11-app-nav"><ol class="l11-app-tabs" role="tablist" aria-label="디토에서 함께하는 일상"></ol><p class="l11-app-caption" aria-live="polite"></p></div><div class="l11-app-stage"></div>';
    var tabs = chapter.querySelector('.l11-app-tabs'), stage = chapter.querySelector('.l11-app-stage');
    var items = nodes.map(function (li,i) {
      var caption = li.querySelector('figcaption'), slot = li.querySelector('[data-media-slot]');
      var label = caption.querySelector('i').textContent;
      var statement = caption.querySelector('b').textContent;
      var description = caption.querySelector('span').textContent;
      var row = document.createElement('li'), button = document.createElement('button');
      button.type = 'button'; button.id = 'l11-app-tab-' + i; button.setAttribute('role','tab');
      button.setAttribute('aria-controls','l11-app-panel-' + i);
      var small = document.createElement('span'); small.className = 'l11-tab-label'; small.textContent = statement;
      var text = document.createElement('strong'); text.textContent = label;
      var arrow = document.createElement('i'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true');
      button.append(small,text,arrow); row.appendChild(button); tabs.appendChild(row);
      var panel = document.createElement('figure'); panel.className = 'l11-app-panel'; panel.id = 'l11-app-panel-' + i;
      panel.setAttribute('role','tabpanel'); panel.setAttribute('aria-labelledby',button.id); panel.tabIndex = 0;
      panel.appendChild(cleanSlot(slot,label + ' · 앱 화면','l11-screen'));
      var fieldCaption = document.createElement('figcaption'); fieldCaption.textContent = label;
      panel.appendChild(fieldCaption); stage.appendChild(panel);
      return {button:button,panel:panel,key:['feed','groupchat','camera'][i],description:description};
    });
    old.replaceWith(chapter);
    section.classList.add('l11-ready');
    if (title) title.classList.add('l11-chapter-title');
    if (intro) intro.classList.add('l11-chapter-intro');
    buildTabs(section,items,function (item) { chapter.querySelector('.l11-app-caption').textContent = item.description; });
  }
  function analogChapter() {
    var section = document.getElementById('h8-analog');
    if (!section || section.classList.contains('l11-ready')) return;
    var old = section.querySelector('.h8-an'); if (!old) return;
    var nodes = Array.prototype.slice.call(old.children);
    var chapter = document.createElement('div'); chapter.className = 'l11-analog';
    chapter.innerHTML = '<div class="l11-analog-stage"></div><div class="l11-analog-index"><ol role="tablist" aria-label="아날로그의 다섯 가지 즐거움"></ol><p class="l11-analog-caption" aria-live="polite"></p></div>';
    var stage = chapter.querySelector('.l11-analog-stage'), tabs = chapter.querySelector('ol');
    var keys = ['booth','camcorder','walkie','letter','guestbook'];
    var items = nodes.map(function (li,i) {
      var text = li.querySelector('.h8-an-t'), art = li.querySelector('.h8-an-a');
      var name = text.querySelector('b').textContent, subtitle = text.querySelector('i').textContent;
      var description = text.querySelector('span').textContent;
      var row = document.createElement('li'), button = document.createElement('button');
      button.type='button'; button.id='l11-analog-tab-'+i; button.setAttribute('role','tab'); button.setAttribute('aria-controls','l11-analog-panel-'+i);
      var label=document.createElement('span');label.textContent=name;
      var arrow=document.createElement('i');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
      button.append(label,arrow);row.appendChild(button);tabs.appendChild(row);
      var panel=document.createElement('figure');panel.className='l11-analog-panel l11-analog-'+keys[i];panel.id='l11-analog-panel-'+i;
      panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
      var slot=art.querySelector('[data-media-slot]');
      if(slot) panel.appendChild(cleanSlot(slot,name+' · 이미지','l11-analog-image'));
      else {var widget=art.querySelector('#h8AnGb');if(widget){var holder=document.createElement('div');holder.className='l11-guestbook';holder.appendChild(widget);panel.appendChild(holder);}}
      var caption=document.createElement('figcaption');
      var heading=document.createElement('h3');heading.textContent=subtitle;
      var desc=document.createElement('p');desc.textContent=description;
      caption.append(heading,desc);panel.appendChild(caption);stage.appendChild(panel);
      return {button:button,panel:panel,key:keys[i],description:description};
    });
    old.replaceWith(chapter);section.classList.add('l11-ready');
    buildTabs(section,items,function () {chapter.querySelector('.l11-analog-caption').textContent='오래 좋아한 놀이를, 우리만의 방식으로.';});
    // The existing guestbook is a live app component; its sizing observer follows the move.
    window.dispatchEvent(new Event('resize'));
  }
  appChapter(); analogChapter();
})();
