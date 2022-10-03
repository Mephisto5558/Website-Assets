/*!
 * ==============================================================
 * Embed Builder
 * ==============================================================
 * Author: Glitchii <https://github.com/Glitchii>
 * License: MIT
 * --------------------------------------------------------------*/
options=window.options||{},inIframe=window.inIframe||top!==self,currentURL=()=>new URL(inIframe&&/(https?:\/\/(?:[\d\w]+\.)?[\d\w\.]+(?::\d+)?)/g.exec(document.referrer)?.[0]||location.href);const params=currentURL().searchParams,hasParam=e=>null!==params.get(e),dataSpecified=options.dataSpecified||params.get("data"),username=params.get("username")||options.username,avatar=params.get("avatar")||options.avatar,guiTabs=params.get("guitabs")||options.guiTabs,useJsonEditor="json"===params.get("editor")||options.useJsonEditor,verified=hasParam("verified")||options.verified,onlyEmbed=hasParam("embed")||options.onlyEmbed,noMultiEmbedsOption=localStorage.getItem("noMultiEmbedsOption")||hasParam("nomultiembedsoption")||options.noMultiEmbedsOption,hideEditor=localStorage.getItem("hideeditor")||hasParam("hideeditor")||options.hideEditor,hidePreview=localStorage.getItem("hidepreview")||hasParam("hidepreview")||options.hidePreview,hideMenu=localStorage.getItem("hideMenu")||hasParam("hidemenu")||options.hideMenu,sourceOption=localStorage.getItem("sourceOption")||hasParam("sourceoption")||options.sourceOption,mainKeys=["author","footer","color","thumbnail","image","fields","title","description","url","timestamp"],jsonKeys=["embed","embeds","content",...mainKeys];let reverseColumns=hasParam("reverse")||options.reverseColumns,noUser=localStorage.getItem("noUser")||hasParam("nouser")||options.noUser,allowPlaceholders=hasParam("placeholders")||options.allowPlaceholders,autoUpdateURL=localStorage.getItem("autoUpdateURL")||options.autoUpdateURL,multiEmbeds=noMultiEmbedsOption?options.multiEmbeds??!0:(localStorage.getItem("multiEmbeds")||hasParam("multiembeds")||options.multiEmbeds)??!0,autoParams=localStorage.getItem("autoParams")||hasParam("autoparams")||options.autoParams,jsonObject=window.json||{},colNum=1,num=0,lastActiveGuiEmbedIndex=-1,validationError,activeFields,lastGuiJson;const guiEmbedIndex=e=>{let t=e?.closest(".guiEmbed"),r=t?.closest(".gui");return r?Array.from(r.querySelectorAll(".guiEmbed")).indexOf(t):-1},toggleStored=e=>{let t=localStorage.getItem(e);return t?(localStorage.removeItem(e),t):localStorage.setItem(e,!0)},createElement=e=>{let t;for(let r in e)for(let l in t=document.createElement(r),e[r])if("children"!==l)t[l]=e[r][l];else for(let i of e[r][l])t.appendChild(createElement(i));return t},jsonToBase64=(e,t,r)=>{let l=btoa(escape(JSON.stringify("object"==typeof e?e:json)));if(t){let i=currentURL();i.searchParams.set("data",l),r&&(window.top.location.href=i),l=i.href.replace(/data=\w+(?:%3D)+/g,`data=${l}`)}return l},base64ToJson=e=>{let t=unescape(atob(e||dataSpecified));return"string"==typeof t?JSON.parse(t):t},toRGB=(e,t,r)=>t?"#"+e.match(/\d+/g).map(e=>parseInt(e).toString(16).padStart(2,"0")).join(""):r?parseInt(e.match(/\d+/g).map(e=>parseInt(e).toString(16).padStart(2,"0")).join(""),16):e.includes(",")?e.match(/\d+/g):[parseInt((e=e.replace("#","").match(/.{1,2}/g))[0],16),parseInt(e[1],16),parseInt(e[2],16),1],reverse=e=>{let t=document.querySelector(e?".side2":".side1");t.nextElementSibling?t.parentElement.insertBefore(t.nextElementSibling,t):t.parentElement.insertBefore(t,t.parentElement.firstElementChild);let r=document.body.classList.toggle("reversed");autoParams&&(r?urlOptions({set:["reverse",""]}):urlOptions({remove:"reverse"}))},urlOptions=({remove:e,set:t})=>{let r=currentURL();e&&r.searchParams.delete(e),t&&r.searchParams.set(t[0],t[1]);try{history.replaceState(null,null,r.href.replace(/(?<!data=[^=]+|=)=[&$]/g,e=>"="===e?"":"&"))}catch(l){console.message(`${l.name}: ${l.message}`,l)}},animateGuiEmbedNameAt=(e,t)=>{let r=document.querySelectorAll(".gui .guiEmbedName")?.[e];r?.animate([{transform:"translate(0, 0)"},{transform:"translate(10px, 0)"},{transform:"translate(0, 0)"}],{duration:100,iterations:3}),t&&r?.style.setProperty("--text",`"${t}"`),r?.scrollIntoView({behavior:"smooth",block:"center"}),r?.classList.remove("empty"),setTimeout(()=>r?.classList.add("empty"),10)},indexOfEmptyGuiEmbed=e=>{for(let[t,r]of document.querySelectorAll(".msgEmbed>.container .embed").entries())if(r.classList.contains("emptyEmbed"))return!1!==e&&animateGuiEmbedNameAt(t,e),t;for(let[l,i]of(json.embeds||[]).entries())if(!(0 in Object.keys(i)))return!1!==e&&animateGuiEmbedNameAt(l,e),l;return -1},changeLastActiveGuiEmbed=e=>{let t=document.querySelector(".colors .cTop .embedText>span");if(-1===e)return lastActiveGuiEmbedIndex=-1,t.textContent="";if(lastActiveGuiEmbedIndex=e,t){t.textContent=e+1;let r=document.querySelectorAll(".gui .item.guiEmbedName");t.onclick=()=>{let t=parseInt(prompt("Enter an embed number"+(r.length>1?`, 1 - ${r.length}`:""),e+1));if(!isNaN(t)){if(t<1||t>r.length)return error(1===r.length?`'${t}' is not a valid embed number`:`'${t}' doesn't seem like a number between 1 and ${r.length}`);changeLastActiveGuiEmbed(t-1)}}}},afterBuilding=()=>autoUpdateURL&&urlOptions({set:["data",jsonToBase64(json)]}),externalParsing=({noEmojis:e,element:t}={})=>{for(let r of(e||twemoji.parse(t||document.querySelector(".msgEmbed")),document.querySelectorAll(".markup pre>code")))hljs.highlightBlock(r);let l=t?.closest(".embed");l?.innerText.trim()&&(multiEmbeds?l:document.body).classList.remove("emptyEmbed"),afterBuilding()},multi=()=>!!multiEmbeds&&json?.embeds;dataSpecified&&(jsonObject=base64ToJson()),allowPlaceholders&&(allowPlaceholders="errors"===params.get("placeholders")?1:2),multiEmbeds&&!jsonObject.embeds?.length?jsonObject.embeds=jsonObject.embed?[jsonObject.embed]:[]:multiEmbeds||(jsonObject.embeds=jsonObject.embeds?.[0]?[jsonObject.embeds[0]]:jsonObject.embed?[jsonObject.embed]:[]),delete jsonObject.embed,addEventListener("DOMContentLoaded",()=>{if((reverseColumns||localStorage.getItem("reverseColumns"))&&reverse(),autoParams&&(document.querySelector(".item.auto-params > input").checked=!0),hideMenu&&document.querySelector(".top-btn.menu")?.classList.add("hidden"),noMultiEmbedsOption&&document.querySelector(".box .item.multi")?.remove(),inIframe)for(let e of document.querySelectorAll(".no-frame"))e.remove();for(let t of(autoUpdateURL&&(document.body.classList.add("autoUpdateURL"),document.querySelector(".item.auto>input").checked=!0),multiEmbeds&&(document.body.classList.add("multiEmbeds"),autoParams&&(multiEmbeds?urlOptions({set:["multiembeds",""]}):urlOptions({remove:"multiembeds"}))),hideEditor&&(document.body.classList.add("no-editor"),document.querySelector(".toggle .toggles .editor input").checked=!1),hidePreview&&(document.body.classList.add("no-preview"),document.querySelector(".toggle .toggles .preview input").checked=!1),onlyEmbed?document.body.classList.add("only-embed"):(document.querySelector(".side1.noDisplay")?.classList.remove("noDisplay"),useJsonEditor&&document.body.classList.remove("gui")),noUser?(document.body.classList.add("no-user"),autoParams&&(noUser?urlOptions({set:["nouser",""]}):urlOptions({remove:"nouser"}))):(username&&(document.querySelector(".username").textContent=username),avatar&&(document.querySelector(".avatar").src=avatar),verified&&document.querySelector(".msgEmbed>.contents").classList.add("verified")),document.querySelectorAll(".clickable>img")))t.parentElement.addEventListener("mouseup",e=>window.open(e.target.src));let r=document.querySelector(".editorHolder"),l=document.querySelector(".top"),i=document.querySelector(".messageContent"),o=document.querySelector(".msgEmbed>.container"),s=l.querySelector(".gui:first-of-type");(editor=CodeMirror(e=>r.parentNode.replaceChild(e,r),{value:JSON.stringify(json,null,2),gutters:["CodeMirror-foldgutter","CodeMirror-lint-markers"],scrollbarStyle:"overlay",mode:"application/json",theme:"material-darker",matchBrackets:!0,foldGutter:!0,lint:!0,extraKeys:{Enter(){let e=editor.getCursor(),t=editor.getLine(e.line),r=t.replace(/\S[$.]+/g,"")||"    \n",l=editor.getLine(e.line+1);void 0!==l&&l.trim()||t.substr(e.ch).trim()?editor.replaceRange(`
${t.endsWith("{")?r+"    ":r}`,{line:e.line,ch:e.ch}):editor.replaceRange("\n",{line:e.line,ch:e.ch})}}})).focus();let a=document.querySelector(".notification"),n=matchMedia("(max-width: 1015px)"),d=e=>e?/^https?:\/\//g.test(e)?e:`https://${e}`:"",c=e=>e.replace(/[\u00A0-\u9999<>\&]/g,e=>"&#"+e.charCodeAt(0)+";"),m=e=>e.style.removeProperty("display"),u=(e,t,r)=>r?e.style.removeProperty("content"):e.style.content=`url(${t})`,[b,g,p,y]=Array.from({length:4},()=>document.createDocumentFragment()),h=(e,t="5s")=>(a.innerHTML=e,a.style.removeProperty("--startY"),a.style.removeProperty("--startOpacity"),a.style.setProperty("--time",t),a.onanimationend=()=>a.style.display=null,a.style.display)?(a.style.setProperty("--startY",0),a.style.setProperty("--startOpacity",1),a.style.display=null,setTimeout(()=>a.style.display="block",.5),!1):(a.style.display="block",!1),f=(e,t,r)=>r&&matchMedia(`(max-width:${r}px)`).matches&&e.length>t-3?e.substring(0,t-3)+"...":e,v=e=>{let t,r,l=/("(?:icon_)?url": *")((?!\w+?:\/\/).+)"/g.exec(JSON.stringify(e,null,2));if(e.timestamp&&"Invalid Date"===new Date(e.timestamp).toString()){if(2===allowPlaceholders)return!0;allowPlaceholders||(t=!0,r="Timestamp is invalid")}else if(l){if(!/\w+:|\/\/|^\//g.exec(l[2])&&l[2].includes(".")){let i=document.querySelector('input[class$="link" i]:focus');if(i&&!allowPlaceholders)return lastPos=i.selectionStart+7,i.value=`http://${l[2]}`,i.setSelectionRange(lastPos,lastPos),!0}2!==allowPlaceholders&&(t=!0,r=`URL should have a protocol. Did you mean <span class="inline full short">http://${f(l[2],30,600).replace(" ","")}</span>?`)}return!t||(validationError=!0,h(r))},E=(e,{replaceEmojis:t,inlineBlock:r,inEmbed:l})=>(t&&(e=e.replace(/(?<!code(?: \w+=".+")?>[^>]+)(?<!\/[^\s"]+?):((?!\/)\w+):/g,(e,t)=>t&&emojis[t]?emojis[t]:e)),e=e.replace(/&#60;:\w+:(\d{17,19})&#62;/g,'<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.png"/>').replace(/&#60;a:\w+:(\d{17,20})&#62;/g,'<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.gif"/>').replace(/~~(.+?)~~/g,"<s>$1</s>").replace(/\*\*\*(.+?)\*\*\*/g,"<em><strong>$1</strong></em>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/__(.+?)__/g,"<u>$1</u>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/_(.+?)_/g,"<em>$1</em>").replace(/^(?: *&#62;&#62;&#62; ([\sS]*))|(?:^ *&#62;(?!&#62;&#62;) +.+\n)+(?:^ *&#62;(?!&#62;&#62;) .+\n?)+|^(?: *&#62;(?!&#62;&#62;) ([^\n]*))(\n?)/mg,(e,t,r,l)=>`<div class="blockquote"><div class="blockquoteDivider"></div><blockquote>${t||r||l?t||r:e.replace(/^ *&#62; /gm,"")}</blockquote></div>`).replace(/&#60;#\d+&#62;/g,()=>'<span class="mention channel interactive">channel</span>').replace(/&#60;@(?:&#38;|!)?\d+&#62;|@(?:everyone|here)/g,e=>e.startsWith("@")?`<span class="mention">${e}</span>`:`<span class="mention interactive">@${e.includes("&#38;")?"role":"user"}</span>`),e=r?e.replace(/`([^`]+?)`|``([^`]+?)``|```((?:\n|.)+?)```/g,(e,t,r,l)=>t?`<code class="inline">${t}</code>`:r?`<code class="inline">${r}</code>`:l?`<code class="inline">${l}</code>`:e):e.replace(/```(?:([a-z\d_\-.]+?)\n)?\n*([^\n][^]*?)\n*```/ig,(e,t,r)=>t?`<pre><code class="${t}">${r.trim()}</code></pre>`:`<pre><code class="hljs nohighlight">${r.trim()}</code></pre>`).replace(/`([^`]+?)`|``([^`]+?)``/g,(e,t,r,l)=>t?`<code class="inline">${t}</code>`:r?`<code class="inline">${r}</code>`:l?`<code class="inline">${l}</code>`:e),l&&(e=e.replace(/\[([^\\])]\((.+?)\)/g,'<a title="$1" target="_blank" class="anchor" href="$2">$1</a>')),e),S=(e,t)=>{t.innerHTML="";let r,l;for(let[i,o]of e.entries())if(o.name&&o.value){let s=t.insertBefore(document.createElement("div"),null);(e[i].inline&&e[i+1]?.inline&&(0===i&&e[i+2]&&!e[i+2].inline||(i>0&&!e[i-1].inline||i>=3&&e[i-1].inline&&e[i-2].inline&&e[i-3].inline&&(e[i-4]?!e[i-4].inline:!e[i-4]))&&(i==e.length-2||!e[i+2].inline))||i%3==0&&i==e.length-2)&&(r=i,l="1 / 7"),r===i-1&&(l="7 / 13"),o.inline?(i&&!e[i-1].inline&&(colNum=1),s.outerHTML=`
                <div class="embedField ${num}${l?" colNum-2":""}" style="grid-column: ${l||colNum+" / "+(colNum+4)};">
                  <div class="embedFieldName">${E(c(o.name),{inEmbed:!0,replaceEmojis:!0,inlineBlock:!0})}</div>
                    <div class="embedFieldValue">${E(c(o.value),{inEmbed:!0,replaceEmojis:!0})}</div>
                </div>`,r!==i&&(l=!1)):s.outerHTML=`
              <div class="embedField" style="grid-column: 1 / 13;">
                <div class="embedFieldName">${E(c(o.name),{inEmbed:!0,replaceEmojis:!0,inlineBlock:!0})}</div>
                  <div class="embedFieldValue">${E(c(o.value),{inEmbed:!0,replaceEmojis:!0})}</div>
              </div>`,colNum=9===colNum?1:colNum+4,num++}for(let a of document.querySelectorAll('.embedField[style="grid-column: 1 / 5;"]'))a.nextElementSibling&&"1 / 13"!==a.nextElementSibling.style.gridColumn||(a.style.gridColumn="1 / 13");colNum=1,q(t,void 0,"grid")},L=e=>{let t=e?new Date(e):new Date,r=t.toLocaleString("en-US",{hour:"numeric",hour12:!1,minute:"numeric"}),l=new Date,i=new Date(new Date().setDate(l.getDate()-1)),o=new Date(new Date().setDate(l.getDate()+1));return l.toDateString()===t.toDateString()?`Today at ${r}`:i.toDateString()===t.toDateString()?`Yesterday at ${r}`:o.toDateString()===t.toDateString()?`Tomorrow at ${r}`:`${String(t.getMonth()+1).padStart(2,"0")}/${String(t.getDate()).padStart(2,"0")}/${t.getFullYear()}`},q=(e,t,r)=>{t&&(e.innerHTML=t),e.style.display=r||"unset"};for(let $ of(p.appendChild(document.querySelector(".embed.markup").cloneNode(!0)),y.appendChild(document.querySelector(".guiEmbedAdd").cloneNode(!0)),g.appendChild(document.querySelector(".edit>.fields>.field").cloneNode(!0)),document.querySelector(".embed.markup").remove(),s.querySelector(".edit>.fields>.field").remove(),s.childNodes))b.appendChild($.cloneNode(!0));let x=(e=jsonObject,t)=>{for(let r of(s.innerHTML="",s.appendChild(y.firstChild.cloneNode(!0)).addEventListener("click",()=>{-1===indexOfEmptyGuiEmbed("(empty embed)")&&(jsonObject.embeds.push({}),x())}),Array.from(b.childNodes))){if(r.classList?.[1]==="content")s.insertBefore(s.appendChild(r.cloneNode(!0)),s.appendChild(r.nextElementSibling.cloneNode(!0))).nextElementSibling.firstElementChild.value=e.content||"";else if(r.classList?.[1]==="guiEmbedName")for(let[l,i]of(e.embeds.length?e.embeds:[{}]).entries()){let o=s.appendChild(r.cloneNode(!0));o.querySelector(".text").innerHTML=`Embed ${l+1}${i.title?`: <span>${i.title}</span>`:""}`,o.querySelector(".icon").addEventListener("click",()=>{e.embeds.splice(l,1),x(),buildEmbed()});let a=s.appendChild(createElement({div:{className:"guiEmbed"}})),m=r.nextElementSibling;for(let p of Array.from(m.children))if(!p?.classList.contains("edit")){let f=a.appendChild(p.cloneNode(!0)),v=p.nextElementSibling?.cloneNode(!0);switch(v?.classList.contains("edit")&&a.appendChild(v),p.classList[1]){case"author":let E=d(i?.author?.icon_url);E&&(v.querySelector(".imgParent").style.content=`url(${c(E)})`),v.querySelector(".editAuthorLink").value=E,v.querySelector(".editAuthorName").value=i?.author?.name||"";break;case"title":f.querySelector(".editTitle").value=i?.title||"";break;case"description":v.querySelector(".editDescription").value=i?.description||"";break;case"thumbnail":let L=d(i?.thumbnail?.url);L&&(v.querySelector(".imgParent").style.content=`url(${c(L)})`),v.querySelector(".editThumbnailLink").value=L;break;case"image":let q=d(i?.image?.url);q&&(v.querySelector(".imgParent").style.content=`url(${c(q)})`),v.querySelector(".editImageLink").value=q;break;case"footer":let $=d(i?.footer?.icon_url);$&&(v.querySelector(".imgParent").style.content=`url(${c($)})`),v.querySelector(".editFooterLink").value=$,v.querySelector(".editFooterText").value=i?.footer?.text||"";break;case"fields":for(let k of i?.fields||[]){let _=v.querySelector(".fields"),j=_.appendChild(createElement({div:{className:"field"}}));for(let A of Array.from(g.firstChild.children)){let O=j.appendChild(A.cloneNode(!0));A.classList.contains("inlineCheck")?O.querySelector("input").checked=!!k.inline:k.value&&A.classList?.contains("fieldInner")&&(O.querySelector(".designerFieldName input").value=k.name||"",O.querySelector(".designerFieldValue textarea").value=k.value||"")}}}}}let C=s.querySelectorAll(".guiEmbedName");C[C.length-1]?.classList.add("active")}for(let I of document.querySelectorAll(".top>.gui .item"))I.addEventListener("click",()=>{if(I?.classList.contains("active"))getSelection().anchorNode!==I&&I.classList.remove("active");else if(I){let e=I.closest(".inlineField"),t=I.nextElementSibling?.querySelector('input[type="text"]'),r=I.nextElementSibling?.querySelector("textarea");if(I.classList.add("active"),I.classList.contains("guiEmbedName"))return changeLastActiveGuiEmbed(guiEmbedIndex(I));if(e)e.querySelector(".ttle~input").focus();else if(I.classList.contains("footer")){let l=new Date(jsonObject.embeds[guiEmbedIndex(I)]?.timestamp||new Date),i=I.nextElementSibling.querySelector("svg>text"),o=i.closest(".footerDate").querySelector("input");return i.textContent=(l.getDate()+"").padStart(2,0),o.value=l.toISOString().substring(0,19)}if(t?(n.matches||t.focus(),t.selectionStart=t.selectionEnd=t.value.length):r&&!n.matches&&r.focus(),I.classList.contains("fields")){if(reverseColumns&&n.matches)return I.parentNode.scrollTop=I.offsetTop;I.scrollIntoView({behavior:"smooth",block:"center"})}}});content=s.querySelector(".editContent"),title=s.querySelector(".editTitle"),authorName=s.querySelector(".editAuthorName"),authorLink=s.querySelector(".editAuthorLink"),desc=s.querySelector(".editDescription"),thumbLink=s.querySelector(".editThumbnailLink"),imgLink=s.querySelector(".editImageLink"),footerText=s.querySelector(".editFooterText"),footerLink=s.querySelector(".editFooterLink");let T=Array.from(document.querySelectorAll(".footer.rows2,.image.largeImg")),P=matchMedia(`${n.media}, (max-height: 845px)`),w=()=>{let e=(e,t,r)=>{t.classList.remove("loading"),t.classList.add("error");let l=t.parentElement.querySelector(".browse.error>p");l.dataset.error=e,setTimeout(()=>{t.classList.remove("error"),delete l.dataset.error},r??7e3)};for(let t of document.querySelectorAll(".gui .item:not(.fields)"))t.onclick=()=>{(T.includes(t)||P.matches)&&(reverseColumns&&n.matches?t.nextElementSibling.classList.contains("edit")&&t.classList.contains("active")&&(t.parentNode.scrollTop=t.offsetTop):t.scrollIntoView({behavior:"smooth",block:"center"}))};for(let r of document.querySelectorAll(".addField"))r.onclick=()=>{let e=r.closest(".guiEmbed"),t=Array.from(s.querySelectorAll(".guiEmbed")).indexOf(e);if(-1===t)return h("Could not find the embed to add the field to.");let l=(jsonObject.embeds[t]??={}).fields??=[];if(l.length>=25)return h("Cannot have more than 25 fields");l.push({name:"Field name",value:"Field value",inline:!1});let i=e?.querySelector(".item.fields+.edit>.fields")?.appendChild(g.firstChild.cloneNode(!0));if(buildEmbed(),w(),i.scrollIntoView({behavior:"smooth",block:"center"}),!n.matches){let o=i.querySelector(".designerFieldName input");o?.setSelectionRange(o.value.length,o.value.length),o?.focus()}};for(let l of document.querySelectorAll(".fields .field .removeBtn"))l.onclick=()=>{let e=guiEmbedIndex(l),t=Array.from(l.closest(".fields").children).indexOf(l.closest(".field"));if(-1===jsonObject.embeds[e]?.fields[t])return h("Failed to find the index of the field to remove.");jsonObject.embeds[e].fields.splice(t,1),buildEmbed(),l.closest(".field").remove()};for(let i of s.querySelectorAll("textarea, input"))i.oninput=e=>{let t=e.target.value,r=guiEmbedIndex(e.target),l=e.target.closest(".field"),i=l?.closest(".fields"),o=jsonObject.embeds[r]??={};if(l){console.log(l);let s=Array.from(i.children).indexOf(l),a=o.fields[s],n=document.querySelectorAll(".container>.embed")[r]?.querySelector(".embedFields");a&&("text"===e.target.type?a.name=t:"textarea"===e.target.type?a.value=t:a.inline=e.target.checked,S(o.fields,n))}else{switch(e.target.classList?.[0]){case"editContent":jsonObject.content=t,buildEmbed({only:"content"});break;case"editTitle":o.title=t;let d=e.target.closest(".guiEmbed")?.previousElementSibling;d?.classList.contains("guiEmbedName")&&(d.querySelector(".text").innerHTML=`${d.innerText.split(":")[0]}${t?`: <span>${t}</span>`:""}`),buildEmbed({only:"embedTitle",index:guiEmbedIndex(e.target)});break;case"editAuthorName":o.author??={},o.author.name=t,buildEmbed({only:"embedAuthorName",index:guiEmbedIndex(e.target)});break;case"editAuthorLink":o.author??={},o.author.icon_url=t,u(e.target.previousElementSibling,t),buildEmbed({only:"embedAuthorLink",index:guiEmbedIndex(e.target)});break;case"editDescription":o.description=t,buildEmbed({only:"embedDescription",index:guiEmbedIndex(e.target)});break;case"editThumbnailLink":o.thumbnail??={},o.thumbnail.url=t,u(e.target.closest(".editIcon").querySelector(".imgParent"),t),buildEmbed({only:"embedThumbnail",index:guiEmbedIndex(e.target)});break;case"editImageLink":o.image??={},o.image.url=t,u(e.target.closest(".editIcon").querySelector(".imgParent"),t),buildEmbed({only:"embedImageLink",index:guiEmbedIndex(e.target)});break;case"editFooterText":o.footer??={},o.footer.text=t,buildEmbed({only:"embedFooterText",index:guiEmbedIndex(e.target)});break;case"editFooterLink":o.footer??={},o.footer.icon_url=t,u(e.target.previousElementSibling,t),buildEmbed({only:"embedFooterLink",index:guiEmbedIndex(e.target)});break;case"embedFooterTimestamp":let c=new Date(t);if(isNaN(c.getTime()))return h("Invalid date");o.timestamp=c,e.target.parentElement.querySelector("svg>text").textContent=(c.getDate()+"").padStart(2,0),buildEmbed({only:"embedFooterTimestamp",index:guiEmbedIndex(e.target)})}let m=json.embeds?.filter(e=>0 in Object.keys(e));m?.length&&(json.embeds=m)}document.querySelectorAll(".msgEmbed>.container")[guiEmbedIndex(e.target)]?.querySelector(".emptyEmbed")?.classList.remove("emptyEmbed")};for(let o of document.querySelectorAll(".browse"))o.onclick=()=>{let t=new FormData,r=createElement({input:{type:"file",accept:"image/*"}}),l=o.closest(".edit");r.onchange=r=>{if(r.target.files[0].size>33554432)return e("File is too large. Maximum size is 32 MB.",browse,5e3);t.append("expiration",604800),t.append("key",options.uploadKey||"93385e22b0619db73a5525140b13491c"),t.append("image",r.target.files[0]),browse.classList.add("loading"),fetch("https://api.imgbb.com/1/upload",{method:"POST",body:t}).then(e=>e.json()).then(t=>{if(browse.classList.remove("loading"),!t.success)return console.log("Upload failed:",t.data?.error||t.error?.message||t),e(t.data?.error||t.error?.message||"Request failed. (Check dev-console)",browse);u(l.querySelector(".editIcon>.imgParent"),t.data.url);let r=l.querySelector("input[type=text]"),i=l.querySelector("input[class$=Name], input[class$=Text]");r.value=t.data.url,i?.value||i?.focus(),console.info(`${t.data.url} will be deleted in 168 hours. To delete it now, visit ${t.data.delete_url} and scroll down to find the delete button.`),r.dispatchEvent(new Event("input"))}).catch(e=>{browse.classList.remove("loading"),h(`Request failed with error: ${e}`)})},r.click()};if(multiEmbeds){for(let a of document.querySelectorAll(".guiEmbed"))a.onclick=()=>{let e=a.closest(".guiEmbed"),t=Array.from(s.querySelectorAll(".guiEmbed")).indexOf(e);if(-1===t)return h("Could not find the embed to add the field to.");changeLastActiveGuiEmbed(t)};jsonObject.embeds[lastActiveGuiEmbedIndex]||changeLastActiveGuiEmbed(jsonObject.embeds[lastActiveGuiEmbedIndex-1]?lastActiveGuiEmbedIndex-1:jsonObject.embeds.length?0:-1)}else changeLastActiveGuiEmbed(-1)};w();let N;if(t?.guiEmbedIndex&&(N=Array.from(document.querySelectorAll(".gui .item.guiEmbedName"))[t.guiEmbedIndex])?.classList.add("active"),t?.activateClassNames)for(let F of t.activateClassNames)for(let G of document.getElementsByClassName(F))G.classList.add("active");else if(t?.guiTabs){let U=t.guiTabs.split?.(/, */)||t.guiTabs,D=["footer","image"],B=["author","content"];for(let M of s.querySelectorAll(".item:not(.guiEmbedName).active"))M.classList.remove("active");for(let R of document.querySelectorAll(`.${U.join(", .")}`))R.classList.add("active");if(!U.some(e=>B.includes(e))&&U.some(e=>D.includes(e))){let H=document.querySelector(".top .gui");H.scrollTo({top:H.scrollHeight})}}else if(t?.activate)for(let V of Array.from(t.activate).map(e=>e.className).map(e=>"."+e.split(" ").slice(0,2).join(".")))for(let J of document.querySelectorAll(V))J.classList.add("active");else for(let K of document.querySelectorAll(".item.author, .item.description"))K.classList.add("active")};x(jsonObject,{guiTabs}),s.classList.remove("hidden"),fields=s.querySelector(".fields ~ .edit .fields"),buildEmbed=({jsonData:e,only:t,index:r=0}={})=>{e&&(json=e),jsonObject.embeds?.length||document.body.classList.add("emptyEmbed");try{jsonObject.content?(i.innerHTML=E(c(jsonObject.content),{replaceEmojis:!0}),document.body.classList.remove("emptyContent")):document.body.classList.add("emptyContent");let l=document.querySelectorAll(".container>.embed")[r],s=jsonObject.embeds[r];if(t&&(!l||!s))return buildEmbed();switch(t){case"content":return externalParsing({element:i});case"embedTitle":let a=l?.querySelector(".embedTitle");if(!a)return buildEmbed();return s.title?q(a,E(`${s.url?'<a class="anchor" target="_blank" href="'+c(d(s.url))+'">'+c(s.title)+"</a>":c(s.title)}`,{replaceEmojis:!0,inlineBlock:!0})):m(a),externalParsing({element:a});case"embedAuthorName":case"embedAuthorLink":let n=l?.querySelector(".embedAuthor");if(!n)return buildEmbed();return s.author?.name?q(n,`
            ${s.author.icon_url?'<img class="embedAuthorIcon embedAuthorLink" src="'+c(d(s.author.icon_url))+'">':""}
            ${s.author.url?'<a class="embedAuthorNameLink embedLink embedAuthorName" href="'+c(d(s.author.url))+'" target="_blank">'+c(s.author.name)+"</a>":'<span class="embedAuthorName">'+c(s.author.name)+"</span>"}`,"flex"):m(n),externalParsing({element:n});case"embedDescription":let u=l?.querySelector(".embedDescription");if(!u)return buildEmbed();return s.description?q(u,E(c(s.description),{inEmbed:!0,replaceEmojis:!0})):m(u),externalParsing({element:u});case"embedThumbnail":let b=l?.querySelector(".embedThumbnailLink");if(!b)return buildEmbed();let g=l.querySelector(".embedGrid .markup pre");return s.thumbnail?.url?(b.src=s.thumbnail.url,b.parentElement.style.display="block",g&&(g.style.maxWidth="90%")):(m(b.parentElement),g?.style.removeProperty("max-width")),afterBuilding();case"embedImage":let y=l?.querySelector(".embedImageLink");if(!y)return buildEmbed();return s.image?.url?(y.src=s.image.url,y.parentElement.style.display="block"):m(y.parentElement),afterBuilding();case"embedFooterText":case"embedFooterLink":case"embedFooterTimestamp":let f=l?.querySelector(".embedFooter");if(!f)return buildEmbed();return s.footer?.text?q(f,`
            ${s.footer.icon_url?'<img class="embedFooterIcon embedFooterLink" src="'+c(d(s.footer.icon_url))+'">':""}<span class="embedFooterText">
            ${c(s.footer.text)}
            ${s.timestamp?'<span class="embedFooterSeparator">•</span>'+c(L(s.timestamp)):""}</span></div>`,"flex"):m(f),externalParsing({element:f})}for(let $ of(multiEmbeds&&(o.innerHTML=""),jsonObject.embeds)){if(!v($))continue;multiEmbeds||(o.innerHTML=""),validationError=!1;let x=o.appendChild(p.firstChild.cloneNode(!0)),k=x.querySelector(".embedGrid"),_=x.querySelector(".embedTitle"),j=x.querySelector(".embedDescription"),A=x.querySelector(".embedAuthor"),O=x.querySelector(".embedFooter"),C=x.querySelector(".embedImage>img"),I=x.querySelector(".embedThumbnail>img"),T=x.querySelector(".embedFields");$.title?q(_,E(`${$.url?'<a class="anchor" target="_blank" href="'+c(d($.url))+'">'+c($.title)+"</a>":c($.title)}`,{replaceEmojis:!0,inlineBlock:!0})):m(_),$.description?q(j,E(c($.description),{inEmbed:!0,replaceEmojis:!0})):m(j),$.color?k.closest(".embed").style.borderColor="number"==typeof $.color?"#"+$.color.toString(16).padStart(6,"0"):$.color:k.closest(".embed").style.removeProperty("border-color"),$.author?.name?q(A,`
          ${$.author.icon_url?'<img class="embedAuthorIcon embedAuthorLink" src="'+c(d($.author.icon_url))+'">':""}
          ${$.author.url?'<a class="embedAuthorNameLink embedLink embedAuthorName" href="'+c(d($.author.url))+'" target="_blank">'+c($.author.name)+"</a>":'<span class="embedAuthorName">'+c($.author.name)+"</span>"}`,"flex"):m(A);let P=k.querySelector(".markup pre");$.thumbnail?.url?(I.src=$.thumbnail.url,I.parentElement.style.display="block",P&&(P.style.maxWidth="90%")):(m(I.parentElement),P&&P.style.removeProperty("max-width")),$.image?.url?(C.src=$.image.url,C.parentElement.style.display="block"):m(C.parentElement),$.footer?.text?q(O,`
          ${$.footer.icon_url?'<img class="embedFooterIcon embedFooterLink" src="'+c(d($.footer.icon_url))+'">':""}<span class="embedFooterText">
          ${c($.footer.text)}
          ${$.timestamp?'<span class="embedFooterSeparator">•</span>'+c(L($.timestamp)):""}</span></div>`,"flex"):$.timestamp?q(O,`<span class="embedFooterText">${c(L($.timestamp))}</span></div>`,"flex"):m(O),$.fields?S($.fields,T):m(T),document.body.classList.remove("emptyEmbed"),externalParsing(),x.innerText.trim()||x.querySelector(".embedGrid > [style*=display] img")?x.classList.remove("emptyEmbed"):x.classList.add("emptyEmbed")}multiEmbeds||o.innerText.trim()||o.querySelector(".embedGrid > [style*=display] img")||document.body.classList.add("emptyEmbed"),afterBuilding()}catch(w){console.error(w),h(w)}},editor.on("change",e=>{if(JSON.stringify(json,null,2)!==e.getValue())try{let t=e.getCursor().line,r=e.getLine(t);'"'===r.trim()&&(e.replaceRange(r.trim()+":",{line:t,ch:t.length}),e.setCursor(t,r.length)),json=JSON.parse(e.getValue());let l=Object.keys(json);if(l.length&&!jsonKeys.some(e=>l.includes(e))){let o=l.filter(e=>!jsonKeys.includes(e));if(o.length>2)return h(`'${o[0]+"', '"+o.slice(1,o.length-1).join("', '")}', and '${o[o.length-1]}' are invalid keys.`);return h(`'${2==o.length?o[0]+"' and '"+o[o.length-1]+"' are invalid keys.":o[0]+"' is an invalid key."}`)}buildEmbed()}catch(s){if(e.getValue())return;document.body.classList.add("emptyEmbed"),i.innerHTML=""}});let k=new CP(document.querySelector(".picker"),state={parent:document.querySelector(".cTop")});k.fire?.("change",toRGB("#41f097"));let _=document.querySelector(".colors"),j=_?.querySelector(".hex>div input"),A=!0,O=!1;for(let C of(removePicker=()=>{if(O)return O=!1;A?k.enter():(A=!1,O=!0,_.classList.remove("picking"),k.exit())},document.querySelector(".colBack")?.addEventListener("click",()=>{k.self.remove(),A=!1,removePicker()}),k.on?.("exit",removePicker),k.on?.("enter",()=>{let e=multiEmbeds&&lastActiveGuiEmbedIndex!==-1?lastActiveGuiEmbedIndex:0;jsonObject?.embeds[e]?.color&&(j.value=jsonObject.embeds[e].color.toString(16).padStart(6,"0"),console.log(j),document.querySelector(".hex.incorrect")?.classList.remove("incorrect")),_.classList.add("picking")}),document.querySelectorAll(".color").forEach(e=>e.addEventListener("click",e=>{let t=multiEmbeds&&-1!==lastActiveGuiEmbedIndex?lastActiveGuiEmbedIndex:0,r=document.querySelectorAll(".msgEmbed .container>.embed")[t],l=jsonObject.embeds[t]??={},i=e.target.closest(".color");l.color=toRGB(i.style.backgroundColor,!1,!0),r&&(r.style.borderColor=i.style.backgroundColor),k.source.style.removeProperty("background")})),j?.addEventListener("focus",()=>A=!0),setTimeout(()=>{k.on?.("change",function(e,t,r,l){let i=multiEmbeds&&lastActiveGuiEmbedIndex!==-1?lastActiveGuiEmbedIndex:0,o=document.querySelectorAll(".msgEmbed .container>.embed")[i],s=jsonObject.embeds[i];k.source.style.background=this.color(e,t,r),s.color=parseInt(this.color(e,t,r).slice(1),16),o.style.borderColor=this.color(e,t,r),j.value=s.color.toString(16).padStart(6,"0")})},1e3),document.querySelector(".timeText").innerText=L(),document.querySelectorAll(".markup pre>code")))hljs.highlightBlock(C);document.querySelector(".opt.gui").addEventListener("click",()=>{lastGuiJson&&lastGuiJson!==JSON.stringify(json,null,2)&&x(),lastGuiJson=!1,activeFields=null,document.body.classList.add("gui"),I&&(I=!1,togglePicker())}),document.querySelector(".opt.json").addEventListener("click",()=>{let e=indexOfEmptyGuiEmbed(!1);if(-1!==e)return h(s.querySelectorAll(".item.guiEmbedName")[e].innerText.split(":")[0]+" should not be empty.","3s");let t=JSON.stringify(json,null,2);lastGuiJson=t,document.body.classList.remove("gui"),editor.setValue("{}"===t?"{\n	\n}":t),editor.refresh(),editor.focus(),activeFields=document.querySelectorAll(".gui > .item.active"),document.querySelector("section.side1.low")&&togglePicker(!0)}),document.querySelector(".clear").addEventListener("click",()=>{json={},k.source.style.removeProperty("background"),document.querySelector(".msgEmbed .container>.embed")?.remove(),buildEmbed(),x();let e=JSON.stringify(json,null,2);for(let t of(editor.setValue("{}"===e?"{\n	\n}":e),document.querySelectorAll(".gui .item")))t.classList.add("active");n.matches||content.focus()}),document.querySelector(".top-btn.menu")?.addEventListener("click",e=>{if(e.target.closest(".item.dataLink")){let t=jsonToBase64(json,!0).replace(/(?<!data=[^=]+|=)=(&|$)/g,e=>"="===e?"":"&");if(!window.chrome)return prompt("Here's the current URL with base64 embed data:",t);try{navigator.clipboard.writeText(t)}catch{let r=document.body.appendChild(document.createElement("input"));r.value=t,r.select(),document.setSelectionRange(0,5e4),document.execCommand("copy"),document.body.removeChild(r)}alert("Copied to clipboard.")}let l=e.target.closest(".item")?.querySelector("input");if(l&&(l.checked=!l.checked),e.target.closest(".item.auto"))(autoUpdateURL=document.body.classList.toggle("autoUpdateURL"))?localStorage.setItem("autoUpdateURL",!0):localStorage.removeItem("autoUpdateURL"),urlOptions({set:["data",jsonToBase64(json)]});else if(e.target.closest(".item.reverse"))reverse(reverseColumns),reverseColumns=!reverseColumns,toggleStored("reverseColumns");else if(e.target.closest(".item.noUser")){options.avatar&&(document.querySelector("img.avatar").src=options.avatar);let i=document.body.classList.toggle("no-user");autoParams&&(i?urlOptions({set:["nouser",""]}):urlOptions({remove:"nouser"})),toggleStored("noUser")}else if(e.target.closest(".item.auto-params"))l.checked?localStorage.setItem("autoParams",!0):localStorage.removeItem("autoParams"),autoParams=l.checked;else if(e.target.closest(".toggles>.item")){let o=l.closest(".item").classList[2];l.checked?(document.body.classList.remove(`no-${o}`),localStorage.removeItem(`hide${o}`)):(document.body.classList.add(`no-${o}`),localStorage.setItem(`hide${o}`,!0))}else e.target.closest(".item.multi")&&!noMultiEmbedsOption&&(multiEmbeds=document.body.classList.toggle("multiEmbeds"),activeFields=document.querySelectorAll(".gui > .item.active"),autoParams&&(multiEmbeds?urlOptions({set:["multiembeds",""]}):urlOptions({remove:"multiembeds"})),multiEmbeds?localStorage.setItem("multiEmbeds",!0):(localStorage.removeItem("multiEmbeds"),jsonObject.embeds=[jsonObject.embeds?.[0]||{}]),x(),buildEmbed(),editor.setValue(JSON.stringify(json,null,2)));e.target.closest(".top-btn")?.classList.toggle("active")}),document.querySelectorAll(".img").forEach(e=>{e.nextElementSibling?.classList.contains("spinner-container")&&e.addEventListener("error",e=>{e.target.style.removeProperty("display"),e.target.nextElementSibling.style.display="block"})});let I=!1;togglePicker=e=>{_.classList.toggle("display"),document.querySelector(".side1").classList.toggle("low"),e&&(I=!0)},document.querySelector(".pickerToggle").addEventListener("click",()=>togglePicker()),buildEmbed(),document.body.addEventListener("click",e=>{(e.target.classList.contains("low")||e.target.classList.contains("top")&&_.classList.contains("display"))&&togglePicker()}),document.querySelector(".colors .hex>div")?.addEventListener("input",e=>{let t=e.target.value;if(t.startsWith("#")&&(e.target.value=t.slice(1),t=e.target.value),6!==t.length||!/^[a-z0-9]{6}$/gi.test(t))return e.target.closest(".hex").classList.add("incorrect");e.target.closest(".hex").classList.remove("incorrect");let r=multiEmbeds&&-1!==lastActiveGuiEmbedIndex?lastActiveGuiEmbedIndex:0;jsonObject.embeds[r].color=parseInt(t,16),k.fire?.("change",toRGB(t)),buildEmbed()}),onlyEmbed&&document.querySelector(".side1")?.remove();let T=document.querySelector(".item.section .inner.more"),P=T?.querySelector(".source");sourceOption||P.remove(),T.childElementCount<2&&T?.classList.add("invisible"),T.parentElement.childElementCount<1&&T?.parentElement.classList.add("invisible"),document.querySelector(".top-btn.copy").addEventListener("click",e=>{let t=e.target.closest(".top-btn.copy").querySelector(".mark"),r=JSON.stringify(json,null,2),l=()=>{t?.classList.remove("hidden"),t?.previousElementSibling?.classList.add("hidden"),setTimeout(()=>{t?.classList.add("hidden"),t?.previousElementSibling?.classList.remove("hidden")},1500)};if(!navigator.clipboard?.writeText(r).then(l).catch(e=>console.log("Could not copy to clipboard: "+e.message))){let i=document.body.appendChild(document.createElement("textarea"));i.value=r,i.select(),i.setSelectionRange(0,5e4),document.execCommand("copy"),document.body.removeChild(i),l()}})}),console.__proto__.message=function(e,t,r=!0){r&&this.groupCollapsed(e)||this.group(e),this.dir(t),this.groupEnd()},Object.defineProperty(window,"json",{configurable:!0,set(e){let t=e.embeds?.filter(e=>"[object Object]"===e.toString()&&0 in Object.keys(e));jsonObject={content:e.content,embeds:e.embed?[e.embed]:t?.length?t:[],...(delete e.embed)&&e},buildEmbed(),buildGui()},get(){let e={};return jsonObject.content&&(e.content=jsonObject.content),jsonObject.embeds?.length&&(multiEmbeds?e.embeds=jsonObject.embeds:e.embed=jsonObject.embeds[0]),e}});