import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg=window.DEFLECT_SUPABASE;
const bridge=()=>window.__DEFLECT_MP_BRIDGE__;
const root=document.createElement("section");
const style=document.createElement("style");
style.textContent=`
#deflectMp{position:fixed;z-index:120;left:14px;top:14px;width:min(310px,calc(100vw - 28px));color:#eafaff;font:12px system-ui}
#deflectMp details{border:1px solid #78eaff88;border-radius:13px;background:rgba(4,16,35,.94);box-shadow:0 10px 35px #0008;overflow:hidden}
#deflectMp summary{cursor:pointer;list-style:none;padding:11px 13px;font-weight:900;letter-spacing:.12em;color:#8feaff}
#deflectMp summary::-webkit-details-marker{display:none}
#deflectMp .mpBody{padding:0 12px 12px}
#deflectMp input,#deflectMp button{box-sizing:border-box;width:100%;margin:4px 0;padding:9px;border-radius:8px;border:1px solid #78eaff77;background:#102b48;color:#f2fbff;font:700 11px system-ui}
#deflectMp button{cursor:pointer;background:linear-gradient(110deg,#12547a,#49317e)}
#deflectMp button:disabled{opacity:.45;cursor:default}
#deflectMp .mpRow{display:flex;gap:6px}
#deflectMp .mpRow>*{min-width:0;flex:1}
#deflectMp .mpMuted{color:#9dbbd1;font-size:10px}
#deflectMp #mpPlayers{padding-left:17px;margin:6px 0}
#deflectMp #mpStatus{min-height:16px;color:#8feaff;margin-top:5px}
#deflectMp #mpHost{color:#ffc977;font-size:10px}
@media(max-width:600px){#deflectMp{width:min(190px,calc(100vw - 28px))}#deflectMp summary{font-size:9px;padding:9px 8px}}
`;
document.head.appendChild(style);
root.id="deflectMp";
root.innerHTML=`<details><summary>◉ ONLINE MULTIPLAYER · BETA</summary><div class="mpBody">
<div class="mpMuted">Create a room and share its six-character code.</div>
<div class="mpRow"><button id="mpCreate">CREATE ROOM</button><button id="mpLeave" disabled>LEAVE</button></div>
<div class="mpRow"><input id="mpCode" maxlength="6" placeholder="ROOM CODE" autocomplete="off"><button id="mpJoin">JOIN</button></div>
<div id="mpRoom" class="mpMuted">Not connected to a room</div><div id="mpHost"></div>
<b>PLAYERS IN ROOM</b><ul id="mpPlayers"><li class="mpMuted">No room joined</li></ul>
<div class="mpMuted">Start a round to sync player movement and the arena ball.</div>
<div id="mpStatus" role="status" aria-live="polite">Ready</div></div></details>`;
document.body.appendChild(root);
const $=id=>root.querySelector("#"+id);
if(!cfg?.url||!cfg?.publishableKey){$("mpStatus").textContent="Supabase setup is missing.";throw new Error("DEFLECT Supabase config is missing");}
const supabase=createClient(cfg.url,cfg.publishableKey,{realtime:{params:{eventsPerSecond:20}}});
const selfId=crypto.randomUUID();
window.__DEFLECT_MP_SELF_ID__=selfId;
const playerName=(()=>{let n=localStorage.getItem("deflectPlayerName");if(!n){n="Pilot-"+Math.floor(1000+Math.random()*9000);localStorage.setItem("deflectPlayerName",n)}return n})();
let channel=null,roomCode=null,players=new Map(),isHost=false,lastAlive=false,lastStateSent=0,lastOrbSent=0,loops=null;
const status=s=>$("mpStatus").textContent=s;
const makeCode=()=>{const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("")};
const send=(event,payload)=>channel?.send({type:"broadcast",event,payload});
function roomPlayers(){
  if(!channel)return [];
  return Object.values(channel.presenceState()).flat().map(x=>x?.player).filter(Boolean);
}
function electHost(){
  const list=roomPlayers().slice().sort((a,b)=>((a.joinedAt||0)-(b.joinedAt||0))||String(a.id).localeCompare(String(b.id)));
  isHost=list[0]?.id===selfId;
  $("mpHost").textContent=isHost?"HOST · this device controls the shared ball":"CONNECTED · following room host";
  bridge()?.setNetworkState(true,isHost,selfId);
}
function render(){
  const list=roomPlayers();
  const unique=[...new Map(list.map(p=>[p.id,p])).values()];
  const present=new Set(unique.map(p=>p.id));
  for(const id of players.keys())if(!present.has(id))players.delete(id);
  $("mpPlayers").replaceChildren();
  if(!unique.length){$("mpPlayers").innerHTML='<li class="mpMuted">Waiting for players…</li>';applyRemotePlayers();return}
  unique.forEach(p=>{const li=document.createElement("li");li.textContent=(p.name||"Player")+(p.id===selfId?" (YOU)":"");$("mpPlayers").appendChild(li)});
  electHost();
  applyRemotePlayers();
}
function applyRemotePlayers(){
  const remote=[...players.entries()].map(([id,state])=>({id,state}));
  bridge()?.setRemotePlayers(remote);
}
function startMatch(){
  const state=bridge()?.getLocalState?.();
  if(state?.alive)return;
  const button=document.getElementById("startBtn");
  if(button){button.click();status("Online round starting…")}
}
function startLoops(){
  clearInterval(loops);
  loops=setInterval(()=>{
    if(!channel)return;
    const now=performance.now(),b=bridge(),state=b?.getLocalState?.();
    if(!state)return;
    if(state.alive&&!lastAlive)send("match-start",{by:selfId,at:Date.now()});
    lastAlive=!!state.alive;
    if(now-lastStateSent>120){
      lastStateSent=now;
      send("player-state",{id:selfId,name:playerName,state});
    }
    if(isHost&&now-lastOrbSent>100){
      lastOrbSent=now;
      send("orb-state",{state});
      const hits=b?.checkRemoteHits?.([...players.entries()].map(([id,s])=>({id,state:s})))||[];
      for(const id of hits)send("player-eliminated",{id,by:selfId});
    }
  },35);
}
async function leave(){
  clearInterval(loops);loops=null;
  const old=channel;channel=null;roomCode=null;players.clear();
  bridge()?.setNetworkState(false,false,null);
  bridge()?.setRemotePlayers([]);
  $("mpLeave").disabled=true;$("mpRoom").textContent="Not connected to a room";$("mpHost").textContent="";
  $("mpPlayers").innerHTML='<li class="mpMuted">No room joined</li>';
  if(old)await supabase.removeChannel(old);
}
async function join(raw){
  const room=raw.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  if(room.length!==6){status("Enter a 6-character room code.");return}
  await leave();roomCode=room;status("Connecting to "+room+"…");
  const next=supabase.channel("deflect-room-"+room,{config:{presence:{key:selfId},broadcast:{self:false}}});
  next.on("presence",{event:"sync"},()=>{render();applyRemotePlayers()})
    .on("presence",{event:"join"},render).on("presence",{event:"leave"},()=>{render();applyRemotePlayers()})
    .on("broadcast",{event:"player-state"},({payload})=>{
      if(!payload?.id||payload.id===selfId||!payload.state)return;
      players.set(payload.id,payload.state);applyRemotePlayers();
      if(payload.state.alive&&!bridge()?.getLocalState?.()?.alive)startMatch();
    })
    .on("broadcast",{event:"orb-state"},({payload})=>{
      if(!isHost&&payload?.state)bridge()?.applySnapshot(payload.state);
    })
    .on("broadcast",{event:"deflect-request"},({payload})=>{
      if(isHost&&payload?.position){const ok=bridge()?.tryRemoteDeflect(payload.position);if(ok)status("Remote deflect confirmed");}
    })
    .on("broadcast",{event:"player-eliminated"},({payload})=>{
      if(!payload?.id)return;
      const old=players.get(payload.id);if(old)players.set(payload.id,{...old,alive:false});
      applyRemotePlayers();
      if(payload.id===selfId){bridge()?.applyNetworkElimination();status("ELIMINATED · room host confirmed the hit");}
    })
    .on("broadcast",{event:"match-start"},({payload})=>{if(payload?.by!==selfId)startMatch()})
    .on("broadcast",{event:"host-eliminated"},({payload})=>{if(payload?.id&&payload.id!==selfId){bridge()?.applyNetworkElimination();status("HOST ELIMINATED · round ended");}});
  next.subscribe(async s=>{
    if(s==="SUBSCRIBED"){
      channel=next;
      await next.track({player:{id:selfId,name:playerName,joinedAt:Date.now()}});
      $("mpRoom").textContent="ROOM CODE: "+room+" · share with friends";
      $("mpCode").value=room;$("mpLeave").disabled=false;
      status("Connected as "+playerName);render();startLoops();
    }else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"){
      status("Connection failed. Check internet and try again.");
      if(channel!==next)await supabase.removeChannel(next);
    }
  });
}
window.addEventListener("deflect:host-eliminated",()=>{if(channel&&isHost)send("host-eliminated",{id:selfId});});
window.addEventListener("deflect:request",event=>{
  const p=event.detail?.position;
  if(channel&&Array.isArray(p))send("deflect-request",{id:selfId,position:p});
});
$("mpCreate").onclick=()=>join(makeCode());
$("mpJoin").onclick=()=>join($("mpCode").value);
$("mpLeave").onclick=()=>{leave();status("You left the room.")};
$("mpCode").onkeydown=e=>{if(e.key==="Enter")join($("mpCode").value)};
window.addEventListener("pagehide",()=>{if(channel)supabase.removeChannel(channel)});
