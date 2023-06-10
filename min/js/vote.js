(()=>{let e,t,n,r,i,o,a,l=!1,s=0,d=window.innerWidth,c=document.getElementById("header-container"),u=document.getElementById("cards-container"),p=document.getElementById("cards-container-pending"),m=v("input",{type:"text",placeholder:"Search",id:"search-box",query:new URLSearchParams(window.location.search).get("q"),className:"grey-hover"});m.addEventListener("input",({target:e})=>{clearTimeout(n),n=setTimeout(()=>{s=0,E(e.value)},500)});let h=(e,t,n=5e3)=>new Promise((r,i)=>{let o=setTimeout(()=>i(Error("Request timed out")),n);fetch(e?`/api/v1/internal/${e}`:null,t).then(r).catch(i).finally(()=>clearTimeout(o))}),y=async()=>new Map((await h("vote/list?includePending=true").then(e=>e.json()))?.cards?.sort((e,t)=>(t.pending&&!e.pending?-1e9:0)-(e.votes-t.votes||t.title.localeCompare(e.title))).map(e=>[e.id,e]));function v(e,t,n,r){let i=document.createElement(e);if(Object.keys(t||{}).length)for(let[o,a]of Object.entries(t))null!=a&&("object"==typeof a?Object.assign(i[o],a):i[o]=a);return n&&(r?n.replaceChildren(i):n.appendChild(i)),i}function f(e,t){let n=new URL(window.location.href),r=new URLSearchParams(window.location.search);t?r.set(e,t):r.delete(e),n.search=r.toString(),window.history.pushState(null,null,n.toString())}async function g(t){let n=document.createDocumentFragment(),r=v("div",{id:"profile-container"});if((e=await h("user").catch(()=>{}).then(e=>e.json()))?.error||!e)return n.appendChild(m),v("button",{id:"feature-request-button",textContent:t?"New Request":"New Feature Request",className:"grey-hover"},n),v("button",{id:"login-button",textContent:t?"Login":"Login with Discord",className:"blue-button"},r).addEventListener("click",()=>window.location.href=`/auth/discord?redirectURL=${window.location.href}`),n.appendChild(r),c.appendChild(n);r.addEventListener("click",()=>i.style.display="block"===i.style.display?"none":"block"),v("img",{alt:"Profile",src:`https://cdn.discordapp.com/avatars/${e.id}/${e.avatar}.webp?size=64`},r);let i=v("div",{id:"profile-container-wrapper"},r);v("div",{id:"username",textContent:e.displayName||`${e.username}#${e.discriminator}`},i),v("button",{id:"logout-button",textContent:"Logout",className:"blue-button"},i).addEventListener("click",async()=>{let e=await fetch("/auth/logout");await Swal.fire(e.ok?{icon:"success",title:"Success",text:"You are now logged out."}:{icon:"error",title:"Logout failed",text:e.statusText}),e.ok&&window.location.reload()});let o=v("button",{id:"feature-request-button",textContent:t?"New Request":"New Feature Request",className:"grey-hover"});t?(v("br",n),n.appendChild(r),n.appendChild(m),n.appendChild(o)):(n.appendChild(m),n.appendChild(o),n.appendChild(r)),c.appendChild(n)}async function b(t){let n=document.getElementById("feature-request-overlay");document.getElementById("feature-request-button").addEventListener("click",()=>{if(!e?.id)return Swal.fire({icon:"error",title:"Who are you?",text:"You must be logged in to be able to create a feature request!"});c.inert=!0,u.inert=!0,p.inert=!0,o&&(o.inert=!0),n.style.display="block",t&&(u.style.display="none")});let r=document.querySelector("#feature-request-modal>button"),i=({target:e,key:r})=>{"none"===n.style.display||r&&"Escape"!==r||(c.inert="",u.inert="",p.inert="",o&&(o.inert=""),t&&(u.style.display=""),n.style.display="none")};r.addEventListener("click",i),document.addEventListener("keydown",i);let a=document.getElementById("title-counter"),l=document.getElementById("description-counter");document.getElementById("feature-request-title").addEventListener("input",e=>{a.textContent=`${e.target.value.length}/140`,e.target.value.length>=140?a.classList.add("limit-reached"):a.classList.remove("limit-reached")}),document.getElementById("feature-request-description").addEventListener("input",e=>{l.textContent=`${e.target.value.length}/4000`,e.target.value.length>=4e3?l.classList.add("limit-reached"):l.classList.remove("limit-reached")}),document.getElementById("feature-request-modal").addEventListener("submit",x)}function E(n=m.value,r=26){f("q",n=n?.toLowerCase());let i=[...t.values()].slice(s,r+s);if(n&&(i=i.filter(e=>e.title.toLowerCase().includes(n)||e.body.toLowerCase().includes(n)||e.id.toLowerCase().includes(n))),!i.length&&!u.childElementCount&&!p.childElementCount)return v("h2",{textContent:`There are currently no feature requests${n?" matching your search query":""} :(`},u,!0);for(let a of(s||(u.innerHTML="",p.innerHTML=""),i))C(a);if(s+=r,u.childElementCount+p.childElementCount<r&&t.size>s)return E(...arguments);p.childElementCount&&(document.body.insertBefore(v("h2",{id:"new-requests",textContent:"New Requests"}),p),document.body.insertBefore(v("h2",{id:"old-requests",textContent:"Approved Requests"}),u)),e.dev&&(o=v("button",{id:"save-button",title:"Save",classList:"blue-button"},document.body),v("i",{classList:"fas fa-save fa-xl"},o),o.addEventListener("click",q))}function C(t){let n=v("div",{className:"card",id:t.id}),r=v("h2",{id:"title",textContent:e.dev?null:t.title,style:t.title?null:{display:"none"}},n),i=t.body||e.dev?v("p",{id:"description",textContent:e.dev?null:t.body,style:t.body?null:{display:"none"}},n):null,o=v("div",{className:"vote-buttons"},n),a=v("span",{className:"vote-counter",textContent:t.pending?"":t.votes??0});t.pending&&e.dev?v("button",{textContent:"Approve",className:"vote-button blue-button"},o).addEventListener("click",async()=>{let e=await h(`vote/approve?featureId=${t.id}`).then(e=>e.json());if(e.error)return Swal.fire({icon:"error",title:"Oops...",text:e.error});Swal.fire({icon:"success",title:"Success",text:"The feature request has been approved."}),u.appendChild(n)}):t.pending||v("button",{className:"vote-button blue-button",textContent:"Upvote"},o).addEventListener("click",()=>$(t.id,a)),o.appendChild(a);let l=v("button",{title:"Copy card Id",className:"manage-button grey-hover"},o);l.addEventListener("click",()=>navigator.clipboard.writeText(t.id)),v("i",{className:"fa-regular fa-copy fa-xl"},l);let s;if(e.dev){v("input",{type:"text",value:t.title},r).addEventListener("keydown",e=>{if(e.target.parentElement.parentElement.hasAttribute("modified")||e.target.parentElement.parentElement.setAttribute("modified",""),13!==e.keyCode)return;e.preventDefault();let t=e.target.parentElement.nextElementSibling;t.style.removeProperty("display"),t.firstChild.focus()}),(s=t.body||e.dev?v("textarea",{value:t.body},i):null)?.addEventListener("input",({target:e})=>{e.parentElement.parentElement.hasAttribute("modified")||e.parentElement.parentElement.setAttribute("modified",""),e.style.height="auto",e.style.height=`${e.scrollHeight}px`},!1),s?.addEventListener("blur",({target:e})=>{e.value||(e.style.removeProperty("height"),i.style.display="none")});let d=v("button",{title:"Delete card",className:"manage-button grey-hover"},o);d.addEventListener("click",()=>Swal.fire({icon:"warning",title:"Are you sure?",text:"Are you sure you want to delete that card? This action cannot be undone!",showCancelButton:!0,preConfirm(){h(`vote/delete?featureId=${n.id}`).then(e=>e.statusText),n.remove()}})),v("i",{className:"fa-regular fa-trash-can fa-xl"},d),v("p",{id:"userId",title:"Click to copy",textContent:t.id.split("_")[0]},o).addEventListener("click",()=>navigator.clipboard.writeText(t.id.split("_")[0]))}(t.pending?p:u).appendChild(n),s?.value&&(s.style.height=`${s.scrollHeight}px`)}function L(){(l=!l)?(localStorage.setItem("displayMode","cardsInRows"),u.classList.remove("cards-column-mode"),u.classList.add("cards-row-mode"),p.classList.remove("cards-column-mode"),p.classList.add("cards-row-mode")):(localStorage.setItem("displayMode","cardsInColumns"),u.classList.remove("cards-row-mode"),u.classList.add("cards-column-mode"),p.classList.remove("cards-row-mode"),p.classList.add("cards-column-mode"))}async function w(e="dark"===i?"light":"dark"){if(i!==e&&(i=e,localStorage.setItem("theme",i),["bg","text","input-bg","input-focus-bg","card-bg"].forEach(e=>document.documentElement.style.setProperty(`--${e}-color`,`var(--${i}-mode-${e}-color)`)),a)){let t=document.querySelectorAll("body, #header-container button, #header-container>#search-box, .card");for(let n of t)n.classList.add("color-transition");setTimeout(()=>t.forEach(e=>e.classList.remove("color-transition")),300)}}async function x(e){e.preventDefault();let t=await h("vote/new",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:e.target.title.value.trim(),description:e.target.description.value.trim()})}).then(e=>e.json());if(t.error)return Swal.fire({icon:"error",title:"Oops...",text:t.error});await Swal.fire({icon:"success",title:"Success",text:`Your feature request has been submitted and ${t.approved?"approved":"will be reviewed shortly"}.`}),C(t),e.target.reset(),smallScreen&&(u.style.display=""),document.getElementById("feature-request-overlay").style.display="none"}async function $(t,n){if(!e?.id)return Swal.fire({icon:"error",title:"Who are you?",text:"You must be logged in to be able to vote!"});let r=await h(`vote/addvote?featureId=${t}`).then(e=>e.json());if(r.error)return Swal.fire({icon:"error",title:"Oops...",text:r.error});Swal.fire({icon:"success",title:"Success",text:"Your vote has been successfully recorded."}),n.textContent=parseInt(n.textContent)+1}async function q(e){let n=[...document.querySelectorAll(".card[modified]")].reduce((e,n)=>{n.removeAttribute("modified");let r=t.get(n.id);return r&&(n.children.title.firstChild.value.trim()!==r.title||n.children.description.firstChild.value.trim()!=r.body)&&e.push({id:n.id,title:n.children.title.firstChild.value.trim(),body:n.children.description.firstChild.value.trim()}),e},[]);if(!n.length)return Swal.fire({icon:"error",title:"Oops...",text:"No cards have been modified."});let r=await h("vote/update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}).then(e=>e.json());if(r.error)return Swal.fire({icon:"error",title:"Oops...",text:r.error});Swal.fire({icon:"success",title:"Success",text:"The cards have been updated."}),s=0,t=await y(),E()}document.getElementById("toggle-cards-display").addEventListener("click",()=>L()),document.getElementById("toggle-color-scheme").addEventListener("click",()=>w()),window.addEventListener("scroll",()=>{t.size>s&&document.documentElement.scrollTop+document.documentElement.clientHeight>=document.documentElement.scrollHeight-15&&E()}),window.addEventListener("resize",()=>{clearTimeout(r),r=setTimeout(()=>{let e=window.innerWidth;d>769&&e<768||d<768&&e>769?window.location.reload():d=e},500)}),document.addEventListener("DOMContentLoaded",async()=>{w(localStorage.getItem("theme")||window.matchMedia("(prefers-color-scheme: light)").matches&&"light"||"dark");let e=window.matchMedia("(max-width: 768px)").matches;e||(l="cardsInRows"===localStorage.getItem("displayMode")),await g(e),b(e),t=await y(),u.classList.add(l?"cards-row-mode":"cards-column-mode"),p.classList.add(l?"cards-row-mode":"cards-column-mode"),"#new"==window.location.hash&&document.getElementById("feature-request-button").click(),E(),document.querySelector("#feature-request-overlay + *").style.marginTop=`${c.clientHeight+16}px`,a=!0})})();