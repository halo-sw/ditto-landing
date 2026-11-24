(function(){
 'use strict';
 var W=window.DittoWidgets,P=window.DITTO_PLATTERS;if(!W||!P)return;
 var widgets=JSON.parse(JSON.stringify(P.jiuallday.widgets));
 var changes={'fs-07-jiu-dance':'todo','fs-07-jiu-flash':'block','fs-07-jiu-flowers':'dday'};
 widgets.forEach(function(w){var kind=changes[w.id];if(!kind)return;var c=W.catalog.find(function(c){return c.kind===kind;});w.kind=kind;w.data=JSON.parse(JSON.stringify(c.sample));w.ditto=false;});
 widgets.find(function(w){return w.kind==='music';}).data=JSON.parse(JSON.stringify(P.haeunzip.widgets.find(function(w){return w.kind==='music';}).data));
 window.__v11LabWidgets=widgets;
})();
