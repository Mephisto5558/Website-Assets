(()=>{let e,t,n,r,i,a,o,l=!1,s=0,d=window.innerWidth,c=document.getElementById("header-container"),u=document.getElementById("cards-container"),p=document.getElementById("cards-container-pending"),m=f("input",{type:"text",placeholder:"Search",id:"search-box",query:new URLSearchParams(window.location.search).get("q"),className:"grey-hover"});m.addEventListener("input",({target:e})=>{clearTimeout(n),n=setTimeout(()=>{s=0,E(e.value)},500)});let h=(e,t,n=5e3)=>new Promise((r,i)=>{let a=setTimeout(()=>i(Error("Request timed out")),n);fetch(e?`/api/v1/internal/${e}`:null,t).then(r).catch(i).finally(()=>clearTimeout(a))}),y=async()=>new Map((await h("vote/list?includePending=true").then(e=>e.json()))?.cards?.sort((e,t)=>(t.pending&&!e.pending?-1e9:0)-(e.votes-t.votes||t.title.localeCompare(e.title))).map(e=>[e.id,e]));function f(e,t,n,r){let i=document.createElement(e);if(Object.keys(t||{}).length)for(let[a,o]of Object.entries(t))null!=o&&("object"==typeof o?Object.assign(i[a],o):i[a]=o);return n&&(r?n.replaceChildren(i):n.appendChild(i)),i}function v(e,t){let n=new URL(window.location.href),r=new URLSearchParams(window.location.search);t?r.set(e,t):r.delete(e),n.search=r.toString(),window.history.pushState(null,null,n.toString())}async function g(t){let n=document.createDocumentFragment(),r=f("div",{id:"profile-container"});if((e=await h("user").catch(()=>{}).then(e=>e.json()))?.error||!e)return n.appendChild(m),f("button",{id:"feature-request-button",textContent:t?"New Request":"New Feature Request",className:"grey-hover"},n),f("button",{id:"login-button",textContent:t?"Login":"Login with Discord",className:"blue-button"},r).addEventListener("click",()=>window.location.href=`/auth/discord?redirectURL=${window.location.href}`),n.appendChild(r),c.appendChild(n);r.addEventListener("click",()=>i.style.display="block"===i.style.display?"none":"block"),f("img",{alt:"Profile",src:`https://cdn.discordapp.com/avatars/${e.id}/${e.avatar}.webp?size=64`},r);let i=f("div",{id:"profile-container-wrapper"},r);f("div",{id:"username",textContent:e.displayName||`${e.username}#${e.discriminator}`},i),f("button",{id:"logout-button",textContent:"Logout",className:"blue-button"},i).addEventListener("click",async()=>{let e=await fetch("/auth/logout");await Swal.fire(e.ok?{icon:"success",title:"Success",text:"You are now logged out."}:{icon:"error",title:"Logout failed",text:e.statusText}),e.ok&&window.location.reload()});let a=f("button",{id:"feature-request-button",textContent:t?"New Request":"New Feature Request",className:"grey-hover"});t?(f("br",n),n.appendChild(r),n.appendChild(m),n.appendChild(a)):(n.appendChild(m),n.appendChild(a),n.appendChild(r)),c.appendChild(n)}async function b(t){let n=document.getElementById("feature-request-overlay");document.getElementById("feature-request-button").addEventListener("click",()=>{if(!e?.id)return Swal.fire({icon:"error",title:"Who are you?",text:"You must be logged in to be able to create a feature request!"});c.inert=!0,u.inert=!0,p.inert=!0,a&&(a.inert=!0),n.style.display="block",t&&(u.style.display="none")});let r=document.querySelector("#feature-request-modal>button"),i=({target:e,key:r})=>{"none"===n.style.display||r&&"Escape"!==r||(c.inert="",u.inert="",p.inert="",a&&(a.inert=""),t&&(u.style.display=""),n.style.display="none")};r.addEventListener("click",i),document.addEventListener("keydown",i);let o=document.getElementById("title-counter"),l=document.getElementById("description-counter");document.getElementById("feature-request-title").addEventListener("input",e=>{o.textContent=`${e.target.value.length}/140`,e.target.value.length>=140?o.classList.add("limit-reached"):o.classList.remove("limit-reached")}),document.getElementById("feature-request-description").addEventListener("input",e=>{l.textContent=`${e.target.value.length}/4000`,e.target.value.length>=4e3?l.classList.add("limit-reached"):l.classList.remove("limit-reached")}),document.getElementById("feature-request-modal").addEventListener("submit",w)}function E(n=m.value,r=26){v("q",n=n?.toLowerCase());let i=[...t.values()].slice(s,r+s);if(n&&(i=i.filter(e=>e.title.toLowerCase().includes(n)||e.body.toLowerCase().includes(n)||e.id.toLowerCase().includes(n))),!i.length&&!u.childElementCount&&!p.childElementCount)return f("h2",{textContent:`There are currently no feature requests${n?" matching your search query":""} :(`},u,!0);for(let o of(s||(u.innerHTML="",p.innerHTML=""),i))C(o);if(s+=r,u.childElementCount+p.childElementCount<r&&t.size>s)return E(...arguments);p.childElementCount&&(document.body.insertBefore(f("h2",{id:"new-requests",textContent:"New Requests"}),p),document.body.insertBefore(f("h2",{id:"old-requests",textContent:"Approved Requests"}),u)),e.dev&&(a=f("button",{id:"save-button",title:"Save",classList:"blue-button"},document.body),f("i",{classList:"fas fa-save fa-xl"},a),a.addEventListener("click",q))}function C(t){let n=f("div",{className:"card",id:t.id}),r=f("h2",{id:"title",textContent:e.dev?null:t.title,style:t.title?null:{display:"none"}},n),i=t.body||e.dev?f("p",{id:"description",textContent:e.dev?null:t.body,style:t.body?null:{display:"none"}},n):null,a=f("div",{className:"vote-buttons"},n),o=f("span",{className:"vote-counter",textContent:t.pending?"":t.votes??0});t.pending&&e.dev?f("button",{textContent:"Approve",className:"vote-button blue-button"},a).addEventListener("click",async()=>{let e=await h(`vote/approve?featureId=${t.id}`).then(e=>e.json());if(e.error)return Swal.fire({icon:"error",title:"Oops...",text:e.error});Swal.fire({icon:"success",title:"Success",text:"The feature request has been approved."}),u.appendChild(n),p.childElementCount||document.getElementById("new-requests").remove()}):t.pending||f("button",{className:"vote-button blue-button",textContent:"Upvote"},a).addEventListener("click",()=>$(t.id,o)),a.appendChild(o);let l=f("button",{title:"Copy card Id",className:"manage-button grey-hover"},a),s=f("i",{className:"far fa-copy fa-xl"},l);l.addEventListener("click",()=>{navigator.clipboard.writeText(t.id),s.classList="fas fa-check fa-xl",setTimeout(()=>s.classList="far fa-copy fa-xl",3e3)});let d;if(e.dev){f("input",{type:"text",value:t.title},r).addEventListener("keydown",e=>{if(e.target.parentElement.parentElement.hasAttribute("modified")||e.target.parentElement.parentElement.setAttribute("modified",""),13!==e.keyCode)return;e.preventDefault();let t=e.target.parentElement.nextElementSibling;t.style.removeProperty("display"),t.firstChild.focus()}),(d=t.body||e.dev?f("textarea",{value:t.body},i):null)?.addEventListener("input",({target:e})=>{e.parentElement.parentElement.hasAttribute("modified")||e.parentElement.parentElement.setAttribute("modified",""),e.style.height="auto",e.style.height=`${e.scrollHeight}px`},!1),d?.addEventListener("blur",({target:e})=>{e.value||(e.style.removeProperty("height"),i.style.display="none")});let c=f("button",{title:"Delete card",className:"manage-button grey-hover"},a);c.addEventListener("click",()=>Swal.fire({icon:"warning",title:"Are you sure?",text:"Are you sure you want to delete that card? This action cannot be undone!",showCancelButton:!0,preConfirm(){h(`vote/delete?featureId=${n.id}`).then(e=>e.statusText),n.remove()}})),f("i",{className:"far fa-trash-can fa-xl"},c),f("p",{id:"userId",title:"Click to copy",textContent:t.id.split("_")[0]},a).addEventListener("click",()=>navigator.clipboard.writeText(t.id.split("_")[0]))}(t.pending?p:u).appendChild(n),d?.value&&(d.style.height=`${d.scrollHeight}px`)}function L(){(l=!l)?(localStorage.setItem("displayMode","cardsInRows"),u.classList.remove("cards-column-mode"),u.classList.add("cards-row-mode"),p.classList.remove("cards-column-mode"),p.classList.add("cards-row-mode")):(localStorage.setItem("displayMode","cardsInColumns"),u.classList.remove("cards-row-mode"),u.classList.add("cards-column-mode"),p.classList.remove("cards-row-mode"),p.classList.add("cards-column-mode"))}async function x(e="dark"===i?"light":"dark"){if(i!==e&&(i=e,localStorage.setItem("theme",i),["bg","text","input-bg","input-focus-bg","card-bg"].forEach(e=>document.documentElement.style.setProperty(`--${e}-color`,`var(--${i}-mode-${e}-color)`)),o)){let t=document.querySelectorAll("body, #header-container button, #header-container>#search-box, .card");for(let n of t)n.classList.add("color-transition");setTimeout(()=>t.forEach(e=>e.classList.remove("color-transition")),300)}}async function w(e){e.preventDefault();let t=await h("vote/new",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:e.target.title.value.trim(),description:e.target.description.value.trim()})}).then(e=>e.json());if(t.error)return Swal.fire({icon:"error",title:"Oops...",text:t.error});await Swal.fire({icon:"success",title:"Success",text:`Your feature request has been submitted and ${t.approved?"approved":"will be reviewed shortly"}.`}),C(t),e.target.reset(),smallScreen&&(u.style.display=""),document.getElementById("feature-request-overlay").style.display="none"}async function $(t,n){if(!e?.id)return Swal.fire({icon:"error",title:"Who are you?",text:"You must be logged in to be able to vote!"});let r=await h(`vote/addvote?featureId=${t}`).then(e=>e.json());if(r.error)return Swal.fire({icon:"error",title:"Oops...",text:r.error});Swal.fire({icon:"success",title:"Success",text:"Your vote has been successfully recorded."}),n.textContent=parseInt(n.textContent)+1}async function q(){let e=[...document.querySelectorAll(".card[modified]")].reduce((e,n)=>{n.removeAttribute("modified");let r=t.get(n.id);return r&&(n.children.title.firstChild.value.trim()!==r.title||n.children.description.firstChild.value.trim()!=r.body)&&e.push({id:n.id,title:n.children.title.firstChild.value.trim(),body:n.children.description.firstChild.value.trim()}),e},[]);if(!e.length)return Swal.fire({icon:"error",title:"Oops...",text:"No cards have been modified."});let n=await h("vote/update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then(e=>e.json());if(n.error)return Swal.fire({icon:"error",title:"Oops...",text:n.error});Swal.fire({icon:"success",title:"Success",text:"The cards have been updated."}),s=0,t=await y(),E()}document.getElementById("toggle-cards-display").addEventListener("click",()=>L()),document.getElementById("toggle-color-scheme").addEventListener("click",()=>x()),window.addEventListener("scroll",()=>{t.size>s&&document.documentElement.scrollTop+document.documentElement.clientHeight>=document.documentElement.scrollHeight-15&&E()}),window.addEventListener("resize",()=>{clearTimeout(r),r=setTimeout(()=>{let e=window.innerWidth;d>769&&e<768||d<768&&e>769?window.location.reload():d=e},500)}),document.addEventListener("DOMContentLoaded",async()=>{x(localStorage.getItem("theme")||window.matchMedia("(prefers-color-scheme: light)").matches&&"light"||"dark");let e=window.matchMedia("(max-width: 768px)").matches;e||(l="cardsInRows"===localStorage.getItem("displayMode")),await g(e),b(e),t=await y(),u.classList.add(l?"cards-row-mode":"cards-column-mode"),p.classList.add(l?"cards-row-mode":"cards-column-mode"),"#new"==window.location.hash&&document.getElementById("feature-request-button").click(),E(),document.querySelector("#feature-request-overlay + *").style.marginTop=`${c.clientHeight+16}px`,o=!0})})();