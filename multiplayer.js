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
<div class="mpMuted">Choose your callsign, then create a room and share its six-character code.</div><div class="mpRow"><input id="mpName" maxlength="16" aria-label="Player username" placeholder="YOUR USERNAME"><button id="mpSaveName">SAVE NAME</button></div><div class="mpRow"><input id="mpEmail" type="email" placeholder="ADMIN EMAIL (OPTIONAL)"><button id="mpLogin">ADMIN SIGN IN</button></div><div class="mpRow"><button id="mpLogout" style="display:none">SIGN OUT</button></div><div id="mpAuthStatus" class="mpMuted">Not signed in · players can join as guests</div><section id="mpAdmin" style="display:none;margin-top:8px;padding:8px;border:1px solid #ffc97766;border-radius:9px"><b style="color:#ffc977">ADMIN CONSOLE</b><div id="mpAdminMembers" class="mpMuted">Join a room to manage players.</div><div id="mpEventTools" style="display:none;margin-top:8px"><input id="mpAdminMessage" maxlength="140" placeholder="ANNOUNCEMENT"><button id="mpAnnounce">SEND ANNOUNCEMENT</button><select id="mpAdminEvent"><option value="giant_orb">GIANT ORB</option><option value="double_rewards">DOUBLE COINS</option><option value="orb_rush">ORB RUSH</option><option value="low_gravity">LOW GRAVITY</option><option value="rainbow_arena">RAINBOW ARENA</option><option value="meteor_shower">METEOR SHOWER</option></select><button id="mpStartEvent">START 60-SECOND EVENT</button></div><div style="margin-top:8px"><button id="mpAuditRefresh">REFRESH AUDIT LOG</button><div id="mpAdminAudit" class="mpMuted"></div></div><div id="mpBanTools" style="display:none;margin-top:8px"><button id="mpBansRefresh">REFRESH BAN LIST</button><div id="mpAdminBans" class="mpMuted"></div></div></section>
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
let playerName=(()=>{let n=localStorage.getItem("deflectPlayerName");if(!n){n="Pilot-"+Math.floor(1000+Math.random()*9000);localStorage.setItem("deflectPlayerName",n)}return n})();
window.__DEFLECT_MP_NAME__=playerName;
let joinedAt=Date.now();
$("mpName").value=playerName;
let channel=null,roomCode=null,players=new Map(),isHost=false,lastAlive=false,lastStateSent=0,lastOrbSent=0,loops=null,authSession=null,currentRole="player",adminPoll=null,lastAdminCheck=new Date().toISOString(),lastRoleRefresh=0;
const status=s=>$("mpStatus").textContent=s;
const makeCode=()=>{const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("")};
const send=(event,payload)=>channel?.send({type:"broadcast",event,payload});

async function refreshAuth(session){
  authSession=session||null;currentRole="player";
  if(authSession){
    const roleResult=await supabase.rpc("deflect_my_role");
    if(!roleResult.error)currentRole=roleResult.data||"player";
    const banResult=await supabase.from("deflect_bans").select("user_id").eq("user_id",authSession.user.id).maybeSingle();
    if(!banResult.error&&banResult.data){status("This account is banned from DEFLECT.");await leave();}
    $("mpAuthStatus").textContent=authSession.user.email+" · "+currentRole.toUpperCase();
    $("mpLogin").style.display="none";$("mpEmail").style.display="none";$("mpLogout").style.display="block";
    if(adminPoll)clearInterval(adminPoll);
    lastAdminCheck=new Date().toISOString();adminPoll=setInterval(pollAdminActions,2500);
  }else{
    $("mpAuthStatus").textContent="Not signed in · players can join as guests";
    $("mpLogin").style.display="block";$("mpEmail").style.display="block";$("mpLogout").style.display="none";
    if(channel)await channel.track({player:{id:selfId,name:playerName,role:"player",userId:null,joinedAt}});
    if(adminPoll)clearInterval(adminPoll);adminPoll=setInterval(pollAdminActions,3500);
  }
  window.__DEFLECT_MP_ROLE__=currentRole;if(channel)await channel.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,joinedAt}});renderAdminConsole();
}
function renderAdminConsole(){
  const panel=$("mpAdmin"),list=$("mpAdminMembers");
  const canAdmin=["owner","head_admin","admin","moderator"].includes(currentRole);
  panel.style.display=canAdmin?"block":"none";
  $("mpEventTools").style.display=["owner","head_admin"].includes(currentRole)?"block":"none";
  $("mpBanTools").style.display=["owner","head_admin","admin"].includes(currentRole)?"block":"none";
  if(!canAdmin)return;
  list.replaceChildren();
  const members=roomPlayers();
  if(!members.length){list.textContent="Join a room to manage players.";return;}
  for(const p of members){
    const row=document.createElement("div");row.style.cssText="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:7px";
    const label=document.createElement("span");label.textContent=(p.name||"Player")+" · "+(p.role||"player");label.style.flex="1";row.appendChild(label);
    if(p.userId&&p.userId!==authSession?.user?.id){
      if(currentRole==="owner"){
        const select=document.createElement("select");select.style.cssText="max-width:105px;background:#102b48;color:white;border:1px solid #78eaff77;border-radius:6px;padding:5px";
        ["player","moderator","admin","head_admin"].forEach(role=>{const option=document.createElement("option");option.value=role;option.textContent=role.toUpperCase();select.appendChild(option);});
        select.value=p.role||"player";const assign=document.createElement("button");assign.textContent="ROLE";assign.style.width="auto";
        assign.onclick=async()=>{const result=await supabase.rpc("deflect_assign_role",{target_user:p.userId,new_role:select.value});status(result.error?"Role update failed: "+result.error.message:"Role updated for "+p.name);};
        row.append(select,assign);
      }
      if(["owner","head_admin","admin","moderator"].includes(currentRole)){
        const kick=document.createElement("button");kick.textContent="KICK";kick.style.width="auto";kick.onclick=()=>issueAdminAction(p.userId,"kick",{});
        row.appendChild(kick);
      }
      if(["owner","head_admin","admin"].includes(currentRole)){
        const ban=document.createElement("button");ban.textContent="BAN";ban.style.width="auto";ban.onclick=()=>issueAdminAction(p.userId,"ban",{reason:"DEFLECT moderation"});row.appendChild(ban);
      }
    }else if(!p.userId){const guest=document.createElement("small");guest.textContent=" · guest (sign-in required for moderation)";row.appendChild(guest);}
    list.appendChild(row);
  }
}
async function refreshAdminBans(){
  const box=$("mpAdminBans");box.replaceChildren();
  const result=await supabase.from("deflect_bans").select("user_id,reason,created_at").order("created_at",{ascending:false}).limit(30);
  if(result.error){box.textContent="Ban list unavailable: "+result.error.message;return;}
  if(!result.data?.length){box.textContent="No active bans.";return;}
  for(const item of result.data){
    const row=document.createElement("div");row.style.cssText="display:flex;align-items:center;gap:5px;margin-top:6px;flex-wrap:wrap";
    const label=document.createElement("small");label.textContent=item.user_id.slice(0,8)+"… · "+(item.reason||"No reason");label.style.flex="1";
    const unban=document.createElement("button");unban.textContent="UNBAN";unban.style.width="auto";unban.onclick=()=>issueAdminAction(item.user_id,"unban",{});
    row.append(label,unban);box.appendChild(row);
  }
}
async function issueAdminAction(targetUser,action,payload){
  const result=await supabase.rpc("deflect_admin_action",{target_user:targetUser,action_name:action,action_payload:payload});
  status(result.error?"Action failed: "+result.error.message:action.toUpperCase()+" sent.");
  if(!result.error&&action==="unban")refreshAdminBans();
}
async function pollAdminActions(){
  if(!authSession&&!channel)return;
  if(authSession&&Date.now()-lastRoleRefresh>12000){lastRoleRefresh=Date.now();const roleResult=await supabase.rpc("deflect_my_role");if(!roleResult.error&&roleResult.data!==currentRole){currentRole=roleResult.data||"player";window.__DEFLECT_MP_ROLE__=currentRole;if(channel)await channel.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession.user.id,joinedAt}});renderAdminConsole();}}
  const since=lastAdminCheck;lastAdminCheck=new Date().toISOString();
  const result=await supabase.from("deflect_admin_actions").select("*").gt("created_at",since).order("created_at");
  if(result.error)return;
  for(const item of result.data||[]){
    if(authSession&&item.target_user===authSession.user.id&&(item.action==="kick"||item.action==="ban")){
      await leave();status(item.action==="ban"?"You were banned from DEFLECT.":"An admin removed you from the room.");
    }else if(authSession&&item.target_user===authSession.user.id&&item.action==="role_change"){
      await refreshAuth(authSession);status("Your DEFLECT role was updated.");
    }else if(item.action==="event"){
      bridge()?.applyAdminEvent?.(item.payload?.event);status(item.payload?.message||"ADMIN EVENT · "+item.action.toUpperCase());
    }else if(item.action==="announce"){
      status(item.payload?.message||"ADMIN ANNOUNCEMENT");
    }
  }
}
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
  renderAdminConsole();
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
      send("player-state",{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,state});
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
      players.set(payload.id,{...payload.state,name:payload.name||"Player",role:payload.role||"player",userId:payload.userId||null});applyRemotePlayers();
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
      joinedAt=Date.now();
      await next.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,joinedAt}});
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
$("mpSaveName").onclick=async()=>{const clean=$("mpName").value.replace(/[^a-zA-Z0-9 _-]/g,"").trim().slice(0,16);if(!clean){status("Enter a username first.");return;}playerName=clean;window.__DEFLECT_MP_NAME__=clean;localStorage.setItem("deflectPlayerName",clean);if(channel)await channel.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,joinedAt}});status("Username saved: "+clean);};
$("mpName").onkeydown=e=>{if(e.key==="Enter")$("mpSaveName").click()};
$("mpAnnounce").onclick=()=>{const message=$("mpAdminMessage").value.trim();if(message)issueAdminAction(null,"announce",{message});};
$("mpStartEvent").onclick=()=>{const event=$("mpAdminEvent").value;issueAdminAction(null,"event",{event,message:"ADMIN EVENT · "+event.replaceAll("_"," ").toUpperCase()});};
$("mpBansRefresh").onclick=refreshAdminBans;
$("mpAuditRefresh").onclick=async()=>{const result=await supabase.from("deflect_admin_actions").select("*").order("created_at",{ascending:false}).limit(10);const box=$("mpAdminAudit");box.replaceChildren();if(result.error){box.textContent="Audit log unavailable: "+result.error.message;return;}for(const item of result.data||[]){const line=document.createElement("div");line.textContent=new Date(item.created_at).toLocaleString()+" · "+item.action.toUpperCase()+" · "+(item.payload?.message||item.payload?.event||item.target_user||"");box.appendChild(line);}};
$("mpLogin").onclick=async()=>{const email=$("mpEmail").value.trim();if(!email){status("Enter your admin email.");return;}const result=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin}});status(result.error?"Sign-in failed: "+result.error.message:"Magic link sent. Check your email, then return here.");};
$("mpLogout").onclick=async()=>{await supabase.auth.signOut();await refreshAuth(null);status("Signed out.");};
supabase.auth.getSession().then(({data})=>refreshAuth(data.session));
supabase.auth.onAuthStateChange((_event,session)=>{Promise.resolve().then(()=>refreshAuth(session));});
if(!adminPoll)adminPoll=setInterval(pollAdminActions,3500);
$("mpCreate").onclick=()=>join(makeCode());
$("mpJoin").onclick=()=>join($("mpCode").value);
$("mpLeave").onclick=()=>{leave();status("You left the room.")};
$("mpCode").onkeydown=e=>{if(e.key==="Enter")join($("mpCode").value)};
window.addEventListener("pagehide",()=>{if(channel)supabase.removeChannel(channel)});
