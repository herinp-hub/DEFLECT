import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg=window.DEFLECT_SUPABASE;
const bridge=()=>window.__DEFLECT_MP_BRIDGE__;
const root=document.createElement("section");
const style=document.createElement("style");
style.textContent=`
#deflectMapVote{position:fixed;z-index:115;left:50%;bottom:22px;transform:translateX(-50%);width:min(760px,calc(100vw - 28px));box-sizing:border-box;padding:14px;border:1px solid rgba(210,239,255,.34);border-radius:18px;background:rgba(12,22,35,.34);backdrop-filter:blur(18px) saturate(135%);-webkit-backdrop-filter:blur(18px) saturate(135%);box-shadow:0 18px 60px rgba(0,0,0,.22);color:#f5fbff;font:13px system-ui;display:none;pointer-events:auto}
#deflectMapVote .mvHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
#deflectMapVote .mvTitle{font-weight:900;letter-spacing:.12em;font-size:12px}
#deflectMapVote .mvTimer{font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}
#deflectMapVote .mvGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
#deflectMapVote .mvCard{min-width:0;border:1px solid rgba(220,244,255,.25);border-radius:12px;padding:9px;background:rgba(255,255,255,.075);color:#f5fbff;text-align:left;cursor:pointer;transition:background .15s,border-color .15s,transform .15s}
#deflectMapVote .mvCard:hover{background:rgba(255,255,255,.14);transform:translateY(-2px)}
#deflectMapVote .mvCard.selected{border-color:#fff;background:rgba(180,225,255,.2);box-shadow:inset 0 0 0 1px #fff5}
#deflectMapVote .mvPreview{height:54px;border-radius:8px;margin-bottom:8px;background:linear-gradient(145deg,#8cc9dc,#d9edf1 52%,#6d9db0);position:relative;overflow:hidden}
#deflectMapVote .mvPreview:before{content:"";position:absolute;left:18%;right:18%;bottom:8px;height:17px;background:rgba(35,75,92,.55);clip-path:polygon(10% 0,90% 0,100% 100%,0 100%)}
#deflectMapVote .mvPreview.frost{background:linear-gradient(145deg,#dcecf7,#7bb4d1 55%,#3f7898)}
#deflectMapVote .mvPreview.ember{background:linear-gradient(145deg,#f1c18c,#b86d56 55%,#503f48)}
#deflectMapVote .mvPreview.void{background:linear-gradient(145deg,#b9a1d8,#6c5b92 55%,#292640)}
#deflectMapVote .mvName{font-weight:850;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#deflectMapVote .mvVotes{font-size:10px;color:#d3e6f1;margin-top:3px}
#deflectMapVote .mvFoot{font-size:10px;color:#d2e3ed;margin-top:9px;text-align:center}
@media(max-width:560px){#deflectMapVote{bottom:10px;padding:10px;border-radius:14px}#deflectMapVote .mvGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}#deflectMapVote .mvPreview{height:38px}#deflectMapVote .mvTimer{font-size:20px}}
#deflectMp{position:fixed;z-index:120;left:14px;top:14px;width:min(440px,calc(100vw - 24px));color:#eafaff;font:13px system-ui}
#deflectMp details{border:1px solid #78eaff88;border-radius:13px;background:rgba(4,16,35,.94);box-shadow:0 10px 35px #0008;overflow:hidden}
#deflectMp summary{cursor:pointer;list-style:none;padding:11px 13px;font-weight:900;letter-spacing:.12em;color:#8feaff}
#deflectMp summary::-webkit-details-marker{display:none}
#deflectMp .mpBody{box-sizing:border-box;padding:0 14px 16px}
#deflectMp input,#deflectMp button{box-sizing:border-box;width:100%;margin:4px 0;padding:9px;border-radius:8px;border:1px solid #78eaff77;background:#102b48;color:#f2fbff;font:700 12px system-ui}
#deflectMp button{cursor:pointer;background:linear-gradient(110deg,#12547a,#49317e);transition:transform .12s ease,filter .12s ease,box-shadow .12s ease}
#deflectMp button:active{transform:translateY(2px) scale(.98);filter:brightness(1.3);box-shadow:0 0 0 2px #8feaff55}
#deflectMp button:disabled{opacity:.55;cursor:wait}
#deflectMp button.mpBusy{filter:brightness(1.25);box-shadow:0 0 0 1px #8feaff88;cursor:progress}
#deflectMp button.mpBusy:after{content:'  •••';letter-spacing:2px;animation:mpPulse .8s infinite}
@keyframes mpPulse{50%{opacity:.25}}
#deflectMp .mpRow{display:flex;gap:6px}
#deflectMp .mpRow>*{min-width:0;flex:1}
#deflectMp .mpMuted{color:#9dbbd1;font-size:10px}
#deflectMp #mpPlayers{padding-left:17px;margin:6px 0}\n#deflectMp #mpAdmin{margin-top:12px!important;padding:14px!important;border:1px solid #ffc97799!important;border-radius:12px!important;background:linear-gradient(145deg,rgba(24,36,57,.98),rgba(5,19,39,.98));box-shadow:0 8px 24px #0005}\n#deflectMp #mpAdmin>b{display:block;font-size:16px;letter-spacing:.12em;padding-bottom:10px;margin-bottom:8px;border-bottom:1px solid #ffc97766}\n#deflectMp #mpAdminMembers{padding:10px;margin:8px 0;border:1px solid #78eaff44;border-radius:9px;background:#071a30}\n#deflectMp #mpEventTools,#deflectMp #mpBanTools,#deflectMp #mpStaffTools{padding:10px;margin-top:10px!important;border:1px solid #78eaff44;border-radius:9px;background:#071a30}\n#deflectMp #mpAdminAudit{padding:8px;margin-top:6px;border-radius:8px;background:#071a30}\n#deflectMp #mpAdmin button{min-height:38px}\n#deflectMp #mpAdmin input,#deflectMp #mpAdmin select{min-height:38px}
#deflectMp .mpStaff{margin-top:9px;padding-top:8px;border-top:1px solid #78eaff44}
#deflectMp .mpStaffList{display:grid;gap:5px;margin-top:7px}
#deflectMp .mpStaffRow{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
#deflectMp .mpStaffRow span{flex:1;min-width:90px}
#deflectMp #mpStatus{min-height:16px;color:#8feaff;margin-top:5px}
#deflectMp #mpHost{color:#ffc977;font-size:10px}

/* Keep the open multiplayer/admin panel within the viewport and scroll its content. */
#deflectMp details[open]{display:flex;flex-direction:column;height:calc(100vh - 28px);height:calc(100dvh - 28px);max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);overflow:hidden}
#deflectMp details[open]>summary{flex:0 0 auto;position:relative;z-index:2;background:rgba(4,16,35,.98)}
#deflectMp details[open]>.mpBody{display:block;flex:1 1 auto;height:auto;min-height:0;max-height:calc(100dvh - 58px);overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-width:auto;scrollbar-color:#4b9bb8 rgba(4,16,35,.35)}
@media(max-width:600px){#deflectMp{width:min(400px,calc(100vw - 16px));font-size:13px}#deflectMp summary{font-size:12px;padding:11px 12px}#deflectMp input,#deflectMp button{font-size:12px}}
`;
document.head.appendChild(style);
root.id="deflectMp";
root.innerHTML=`<details><summary>◉ ONLINE MULTIPLAYER · BETA</summary><div class="mpBody">
<div class="mpMuted">Choose a username for this tab. It appears above your player in the lobby.</div><div class="mpRow"><input id="mpName" maxlength="16" aria-label="Player username" placeholder="YOUR USERNAME"><button id="mpSaveName">SAVE USERNAME</button></div><input id="mpEmail" type="email" value="herinppatel@gmail.com" placeholder="OWNER EMAIL" autocomplete="username"><input id="mpPassword" type="password" placeholder="OWNER PASSWORD" autocomplete="current-password"><div class="mpRow"><button id="mpLogin">SIGN IN WITH PASSWORD</button><button id="mpResetPassword">SET / RESET PASSWORD</button></div><section id="mpPasswordRecovery" style="display:none;margin-top:7px;padding:8px;border:1px solid #8feaff66;border-radius:8px"><b style="color:#8feaff">SET YOUR NEW OWNER PASSWORD</b><input id="mpNewPassword" type="password" minlength="8" autocomplete="new-password" placeholder="NEW PASSWORD · 8+ CHARACTERS"><button id="mpSavePassword">SAVE NEW PASSWORD</button></section><div class="mpRow"><button id="mpLogout" style="display:none">SIGN OUT</button></div><div id="mpAuthStatus" class="mpMuted">Not signed in · players can join as guests</div><section id="mpAdmin" style="display:none;margin-top:8px;padding:8px;border:1px solid #ffc97766;border-radius:9px"><b style="color:#ffc977">ADMIN CONSOLE</b><section id="mpStaffTools" class="mpStaff" style="display:none"><b style="color:#8feaff">STAFF MANAGER · OWNER ONLY</b><div class="mpMuted">Enter an existing DEFLECT username to assign or remove a staff rank.</div><input id="mpStaffUsername" maxlength="16" placeholder="PLAYER USERNAME"><select id="mpStaffRole"><option value="co_owner">CO-OWNER</option><option value="admin">ADMIN</option><option value="moderator">MODERATOR</option><option value="player">PLAYER · REMOVE STAFF</option></select><button id="mpStaffAssign">ASSIGN RANK</button><button id="mpStaffRefresh">REFRESH STAFF LIST</button><div id="mpStaffList" class="mpStaffList mpMuted">No staff loaded.</div></section><div id="mpAdminMembers" class="mpMuted">Join a room to manage players.</div><div id="mpEventTools" style="display:none;margin-top:8px"><input id="mpAdminMessage" maxlength="140" placeholder="ANNOUNCEMENT" autocomplete="off" onkeydown="event.stopPropagation()" onkeyup="event.stopPropagation()"><button id="mpAnnounce">SEND ANNOUNCEMENT</button><select id="mpAdminEvent"><option value="giant_orb">GIANT ORB · BIG</option><option value="double_rewards">DOUBLE COINS · BIG REWARDS</option><option value="orb_rush">⚠️ ORB RUSH · OP</option><option value="low_gravity">LOW GRAVITY · CONTROL</option><option value="rainbow_arena">RAINBOW ARENA · STYLE</option><option value="meteor_shower">⚠️ METEOR SHOWER · OP</option></select><button id="mpStartEvent">START 5-MINUTE EVENT</button></div><div style="margin-top:8px"><button id="mpAuditRefresh">REFRESH AUDIT LOG</button><div id="mpAdminAudit" class="mpMuted"></div></div><div id="mpBanTools" style="display:none;margin-top:8px"><button id="mpBansRefresh">REFRESH BAN LIST</button><div id="mpAdminBans" class="mpMuted"></div></div><div style="margin-top:9px;padding-top:8px;border-top:1px solid #78eaff44"><b style="color:#8feaff">ADMIN COMMANDS</b><input id="mpAdminCommand" maxlength="220" autocomplete="off" placeholder="/help · /kick Player · /announce Hello"><button id="mpCommandRun">RUN COMMAND</button><div class="mpMuted">Try /help for the full command list. Commands are checked by Supabase permissions.</div></div></section>
<div class="mpRow"><button id="mpCreate">CREATE PRIVATE SERVER</button><button id="mpLeave" disabled>LEAVE</button></div>
<div class="mpRow"><input id="mpCode" maxlength="6" placeholder="PRIVATE SERVER CODE" autocomplete="off"><button id="mpJoin">JOIN PRIVATE</button></div>
<div id="mpRoom" class="mpMuted">Not connected to a room</div><div id="mpHost"></div>
<b>PLAYERS IN ROOM</b><ul id="mpPlayers"><li class="mpMuted">No room joined</li></ul>
<div class="mpMuted">Start a round to sync player movement and the arena ball.</div>
<div id="mpStatus" role="status" aria-live="polite">Ready</div></div></details>`;
document.body.appendChild(root);
const mapVoteRoot=document.createElement("section");mapVoteRoot.id="deflectMapVote";mapVoteRoot.setAttribute("aria-label","Map voting");mapVoteRoot.innerHTML=`<div class="mvHead"><div><div class="mvTitle">CHOOSE THE NEXT MAP</div><div style="font-size:10px;color:#d4e6ef;margin-top:3px">Vote before the countdown ends</div></div><div class="mvTimer" id="mvTimer">00:10</div></div><div class="mvGrid" id="mvGrid"></div><div class="mvFoot" id="mvFoot">Voting closes in 10 seconds</div>`;document.body.appendChild(mapVoteRoot);
const $=id=>root.querySelector("#"+id);
if(!cfg?.url||!cfg?.publishableKey){$("mpStatus").textContent="Supabase setup is missing.";throw new Error("DEFLECT Supabase config is missing");}
const selfId=sessionStorage.getItem("deflectMpPlayerId")||crypto.randomUUID();sessionStorage.setItem("deflectMpPlayerId",selfId);
// Keep Supabase guest sessions isolated per browser tab. sessionStorage is tab-scoped,
// so each open tab receives its own auth identity and its own public-lobby membership.
const supabase=createClient(cfg.url,cfg.publishableKey,{auth:{storage:window.sessionStorage,storageKey:"deflect-auth-"+selfId,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},realtime:{params:{eventsPerSecond:20}}});
// Keep ordinary player auth isolated per tab, but persist the verified Owner admin session
// separately so closing the tab does not require another email link.
const OWNER_SESSION_KEY="deflect-owner-session-v1";
const isOwnerEmail=session=>!!session&&!session.user?.is_anonymous&&String(session.user?.email||"").toLowerCase()==="herinppatel@gmail.com";
function persistOwnerSession(session){try{if(isOwnerEmail(session)&&session.access_token&&session.refresh_token)localStorage.setItem(OWNER_SESSION_KEY,JSON.stringify({access_token:session.access_token,refresh_token:session.refresh_token}));}catch(_){}}
function clearPersistedOwnerSession(){try{localStorage.removeItem(OWNER_SESSION_KEY);}catch(_){}}
window.__DEFLECT_MP_SELF_ID__=selfId;
let playerName=(()=>{let n=sessionStorage.getItem("deflectPlayerName");if(!n){n="Pilot-"+Math.floor(1000+Math.random()*9000);sessionStorage.setItem("deflectPlayerName",n)}return n})();
window.__DEFLECT_MP_NAME__=playerName;
let joinedAt=Date.now();
$("mpName").value=playerName;
let channel=null,roomCode=null,players=new Map(),isHost=false,lastAlive=false,matchStarted=false,lastStateSent=0,lastOrbSent=0,loops=null,authSession=null,publicPlayerId=null,currentRole="player",adminPoll=null,lastAdminCheck=new Date().toISOString(),lastRoleRefresh=0,lastStaffRefresh=0,publicServerId=null,publicHeartbeat=null,publicStatePoll=null,isPublicMatch=false;
let ownerRestorePromise=Promise.resolve();
const status=s=>$("mpStatus").textContent=s;
async function withButton(button,label,task){
  if(!button||button.disabled)return;
  const original=button.textContent;
  button.disabled=true;button.classList.add("mpBusy");button.textContent=label;
  try{return await task();}
  catch(error){status("Action failed: "+(error?.message||String(error)));return null;}
  finally{button.disabled=false;button.classList.remove("mpBusy");button.textContent=original;}
}
let lastPresenceAlive=null;
const MAP_VOTE_CHOICES=[{id:"classic",name:"CLASSIC ARENA",tone:"classic"},{id:"map_frost",name:"FROSTFALL",tone:"frost"},{id:"map_ember",name:"EMBER CORE",tone:"ember"},{id:"map_void",name:"VOID RIFT",tone:"void"}];
let mapVoteState={started:false,resolved:false,endsAt:0,maps:[],votes:{},selected:null,winner:null},mapVoteClock=null,lastMapVoteSync=0;
const makeCode=()=>{const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("")};
const send=(event,payload)=>channel?.send({type:"broadcast",event,payload});

async function refreshAuth(session){
  const nextPublicPlayerId=session?.user?.id||null;
  if(publicServerId&&publicPlayerId&&nextPublicPlayerId!==publicPlayerId)await leave();
  authSession=session||null;publicPlayerId=nextPublicPlayerId;currentRole="player";
  if(authSession){
    if(!authSession.user.is_anonymous&&String(authSession.user.email||"").toLowerCase()==="herinppatel@gmail.com"){
      const claim=await supabase.rpc("deflect_claim_owner");
      if(claim.error)status("Owner setup: verify the email link, then reload DEFLECT.");
    }
    const profileResult=await supabase.rpc("deflect_set_my_username",{p_username:playerName});
    if(profileResult.error&&profileResult.error.message.includes("already taken"))status("Your username is already in use. Choose a different username.");
    const roleResult=await supabase.rpc("deflect_my_role");
    if(!roleResult.error)currentRole=roleResult.data||"player";
    const banResult=await supabase.from("deflect_bans").select("user_id").eq("user_id",authSession.user.id).maybeSingle();
    if(!banResult.error&&banResult.data){status("This account is banned from DEFLECT.");await leave();}
    $("mpAuthStatus").textContent=(authSession.user.is_anonymous?"GUEST":(authSession.user.email||"SIGNED IN"))+" · "+currentRole.toUpperCase();
    $("mpLogin").style.display="none";$("mpEmail").style.display="none";$("mpLogout").style.display="block";
    if(adminPoll)clearInterval(adminPoll);
    lastAdminCheck=new Date().toISOString();adminPoll=setInterval(pollAdminActions,2500);
  }else{
    $("mpAuthStatus").textContent="Not signed in · players can join as guests";
    $("mpLogin").style.display="block";$("mpEmail").style.display="block";$("mpLogout").style.display="none";
    if(channel)await channel.track({player:{id:selfId,name:playerName,role:"player",userId:null,joinedAt,alive:!!bridge()?.getLocalState?.()?.alive}});
    if(adminPoll)clearInterval(adminPoll);adminPoll=setInterval(pollAdminActions,3500);
  }
  window.__DEFLECT_MP_ROLE__=currentRole;if(channel)await channel.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,joinedAt,alive:!!bridge()?.getLocalState?.()?.alive}});renderAdminConsole();
}

async function refreshStaffManager(force=false){
  if(currentRole!=="owner"||(!force&&Date.now()-lastStaffRefresh<5000))return;
  lastStaffRefresh=Date.now();
  const box=$("mpStaffList");if(!box)return;
  const result=await supabase.rpc("deflect_list_staff");
  box.replaceChildren();
  if(result.error){box.textContent="Staff list unavailable: "+result.error.message;return;}
  const rows=result.data||[];
  if(!rows.length){box.textContent="No staff assigned yet.";return;}
  for(const item of rows){
    const row=document.createElement("div");row.className="mpStaffRow";
    const label=document.createElement("span");label.textContent=(item.username||"Unknown")+" · "+String(item.role||"").replaceAll("_"," ").toUpperCase();
    const remove=document.createElement("button");remove.textContent="REMOVE";remove.style.width="auto";
    remove.onclick=()=>withButton(remove,"REMOVING",async()=>{const done=await supabase.rpc("deflect_assign_role",{target_user:item.user_id,new_role:"player"});status(done.error?"Could not remove staff: "+done.error.message:"Staff rank removed for "+item.username);await refreshStaffManager(true);});
    row.append(label,remove);box.appendChild(row);
  }
}

function renderAdminConsole(){
  const panel=$("mpAdmin"),list=$("mpAdminMembers");
  const canAdmin=["owner","co_owner","admin","moderator"].includes(currentRole);
  panel.style.display=canAdmin?"block":"none";
  $("mpEventTools").style.display=["owner","co_owner"].includes(currentRole)?"block":"none";
  $("mpStaffTools").style.display=currentRole==="owner"?"block":"none";
  if(currentRole==="owner")void refreshStaffManager();
  $("mpBanTools").style.display=["owner","co_owner","admin"].includes(currentRole)?"block":"none";
  if(!canAdmin)return;
  list.replaceChildren();
  const members=roomPlayers();
  if(!members.length){list.textContent="Join a room to manage players.";return;}
  for(const p of members){
    const row=document.createElement("div");row.style.cssText="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:7px";
    const label=document.createElement("span");label.textContent=(p.name||"Player")+" · "+(p.role||"player");label.style.flex="1";row.appendChild(label);if(p.role==="owner"||(p.userId===authSession?.user?.id&&currentRole==="owner")){const ownerBadge=document.createElement("span");ownerBadge.textContent="✓ VERIFIED OWNER";ownerBadge.style.cssText="padding:2px 7px;border-radius:10px;background:#1769d2;color:white;font-size:10px;font-weight:900;letter-spacing:.04em";row.appendChild(ownerBadge);}
    if(p.userId&&p.userId!==authSession?.user?.id){
      if(currentRole==="owner"){
        const select=document.createElement("select");select.style.cssText="max-width:105px;background:#102b48;color:white;border:1px solid #78eaff77;border-radius:6px;padding:5px";
        ["player","moderator","admin","co_owner"].forEach(role=>{const option=document.createElement("option");option.value=role;option.textContent=role.toUpperCase();select.appendChild(option);});
        select.value=p.role||"player";const assign=document.createElement("button");assign.textContent="ROLE";assign.style.width="auto";
        assign.onclick=()=>withButton(assign,"SAVING",async()=>{const result=await supabase.rpc("deflect_assign_role",{target_user:p.userId,new_role:select.value});status(result.error?"Role update failed: "+result.error.message:"Role updated for "+p.name);});
        row.append(select,assign);
      }
      if(["owner","co_owner","admin","moderator"].includes(currentRole)){
        const kick=document.createElement("button");kick.textContent="KICK";kick.style.width="auto";kick.onclick=()=>withButton(kick,"KICKING",()=>issueAdminAction(p.userId,"kick",{}));
        row.appendChild(kick);
      }
      if(["owner","co_owner","admin"].includes(currentRole)){
        const ban=document.createElement("button");ban.textContent="BAN";ban.style.width="auto";ban.onclick=()=>withButton(ban,"BANNING",()=>issueAdminAction(p.userId,"ban",{reason:"DEFLECT moderation"}));row.appendChild(ban);
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
    const unban=document.createElement("button");unban.textContent="UNBAN";unban.style.width="auto";unban.onclick=()=>withButton(unban,"UNBANNING",()=>issueAdminAction(item.user_id,"unban",{}));
    row.append(label,unban);box.appendChild(row);
  }
}
async function issueAdminAction(targetUser,action,payload){
  try{
    const actionPayload=action==="announce"?{...payload,authorName:String(playerName||"Admin").trim().slice(0,16)||"Admin"}:payload;
    const result=await supabase.rpc("deflect_admin_action",{target_user:targetUser,action_name:action,action_payload:actionPayload});
    if(result.error){status("Action failed: "+result.error.message);return false;}
    status(action==="announce"?"Announcement sent to all players.":action==="event"?"Event started: "+String(payload?.event||"").replaceAll("_"," ").toUpperCase():action.toUpperCase()+" sent.");
    if(action==="unban")await refreshAdminBans();
    return true;
  }catch(error){status("Action failed: "+(error?.message||String(error)));return false;}
}
const seenAdminActionIds=new Set();
let lastAdminPollError="",activeEventsBootstrapped=false;
async function pollAdminActions(){
  if(!authSession&&!channel)return;
  if(authSession&&Date.now()-lastRoleRefresh>12000){lastRoleRefresh=Date.now();const roleResult=await supabase.rpc("deflect_my_role");if(!roleResult.error&&roleResult.data!==currentRole){currentRole=roleResult.data||"player";window.__DEFLECT_MP_ROLE__=currentRole;if(channel)await channel.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession.user.id,joinedAt}});renderAdminConsole();}}
  const overlap=new Date(Math.max(0,Date.parse(lastAdminCheck)-5000)).toISOString();
  const result=await supabase.from("deflect_admin_actions").select("*").gt("created_at",overlap).order("created_at");
  if(result.error){if(lastAdminPollError!==result.error.message){lastAdminPollError=result.error.message;status("Admin updates unavailable: "+result.error.message);}return;}
  lastAdminPollError="";
  let rows=result.data||[];
  if(!activeEventsBootstrapped){const recentEvents=await supabase.from("deflect_admin_actions").select("*").eq("action","event").gt("created_at",new Date(Date.now()-300000).toISOString()).order("created_at");if(!recentEvents.error){rows=[...rows,...(recentEvents.data||[])];activeEventsBootstrapped=true;}}
  for(const item of rows){
    const actionKey=String(item.id||item.created_at+"|"+item.action+"|"+item.target_user);
    if(seenAdminActionIds.has(actionKey))continue;
    seenAdminActionIds.add(actionKey);
    if(seenAdminActionIds.size>500)seenAdminActionIds.clear();
    if(authSession&&item.target_user===authSession.user.id&&(item.action==="kick"||item.action==="ban")){
      await leave();status(item.action==="ban"?"You were banned from DEFLECT.":"An admin removed you from the room.");
    }else if(authSession&&item.target_user===authSession.user.id&&item.action==="role_change"){
      await refreshAuth(authSession);status("Your DEFLECT role was updated.");
    }else if(item.action==="event"){
      const applied=bridge()?.applyAdminEvent?.(item.payload?.event,item.payload?.durationMs||300000,item.created_at);
      status(applied===false?"Event received but could not be applied on this client.":item.payload?.message||"ADMIN EVENT · "+item.action.toUpperCase());
    }else if(item.action==="announce"){
      const message=String(item.payload?.message||"ADMIN ANNOUNCEMENT");
      const author=String(item.payload?.authorName||"Admin");
      const announcement="ANNOUNCEMENT · "+author+": "+message;
      bridge()?.showAnnouncement?.(announcement);status(announcement);
    }
  }
  if(rows.length){const newest=rows.reduce((v,item)=>item.created_at>v?item.created_at:v,lastAdminCheck);if(newest>lastAdminCheck)lastAdminCheck=newest;}
}
function roomPlayers(){
  if(!channel)return [];
  return Object.values(channel.presenceState()).flat().map(x=>x?.player).filter(Boolean);
}

function parseCommandWords(input){
  return [...input.matchAll(/"([^"]+)"|'([^']+)'|(\S+)/g)].map(m=>m[1]||m[2]||m[3]);
}
function findRoomPlayer(name){
  const matches=roomPlayers().filter(p=>(p.name||"").toLowerCase()===name.toLowerCase());
  return matches.length===1?{player:matches[0]}:{matches};
}
async function runAdminCommand(){
  const raw=$("mpAdminCommand").value.trim();$("mpAdminCommand").value="";
  if(!raw)return;
  const match=raw.match(/^\/?([a-z]+)(?:\s+([\s\S]*))?$/i);
  if(!match){status("Commands start with / — try /help.");return;}
  const command=match[1].toLowerCase(),args=parseCommandWords(match[2]||"");
  const staff=["owner","co_owner","admin","moderator"].includes(currentRole);
  if(!staff){status("Admin sign-in required.");return;}
  const target=(name)=>{const found=findRoomPlayer(name);if(found.matches){status(found.matches.length?"More than one player has that name. Use a unique username.":"Player not found in your current room.");return null;}if(!found.player.userId){status("That player is a guest. They must sign in before moderation.");return null;}if(found.player.userId===authSession?.user?.id){status("You cannot moderate yourself.");return null;}return found.player;};
  if(command==="help"){status("/players · /kick <name> · /ban <name> [reason] · /unban <id prefix> · /role <name> <role> · /announce <text> · /event <name> · /bans · /audit");return;}
  if(command==="players"){const list=roomPlayers();status(list.length?"ROOM: "+list.map(p=>(p.name||"Player")+" ["+(p.role||"player")+"]").join(" · "):"Join a room to list players.");return;}
  if(command==="announce"){const message=(match[2]||"").trim();if(!message){status("Usage: /announce <message>");return;}await issueAdminAction(null,"announce",{message});return;}
  if(command==="event"){
    const event=(args[0]||"").toLowerCase().replaceAll("-","_");
    const allowed=["giant_orb","double_rewards","orb_rush","low_gravity","rainbow_arena","meteor_shower"];
    if(!allowed.includes(event)){status("Usage: /event giant_orb|double_rewards|orb_rush|low_gravity|rainbow_arena|meteor_shower");return;}
    await issueAdminAction(null,"event",{event,durationMs:300000,message:"ADMIN EVENT · "+event.replaceAll("_"," ").toUpperCase()+" · 5 MINUTES · +1 COIN PER DEFLECT"});return;
  }
  if(command==="kick"||command==="ban"){
    const name=args[0];if(!name){status("Usage: /"+command+" <player name> [reason]");return;}
    const p=target(name);if(!p)return;
    await issueAdminAction(p.userId,command,{reason:args.slice(1).join(" ")||"DEFLECT moderation"});return;
  }
  if(command==="unban"){
    const prefix=(args[0]||"").toLowerCase();if(prefix.length<6){status("Usage: /unban <at least 6 characters of user ID>");return;}
    const result=await supabase.from("deflect_bans").select("user_id");
    if(result.error){status("Could not read bans: "+result.error.message);return;}
    const matches=(result.data||[]).filter(x=>x.user_id.toLowerCase().startsWith(prefix));
    if(matches.length!==1){status(matches.length?"That ID prefix matches multiple bans. Add more characters.":"No matching ban found.");return;}
    await issueAdminAction(matches[0].user_id,"unban",{});return;
  }
  if(command==="role"){
    if(currentRole!=="owner"){status("Only the owner can change staff roles.");return;}
    const name=args[0],role=(args[1]||"").toLowerCase();
    if(!name||!["player","moderator","admin","co_owner"].includes(role)){status('Usage: /role "player name" player|moderator|admin|co_owner');return;}
    const p=target(name);if(!p)return;
    const result=await supabase.rpc("deflect_assign_role",{target_user:p.userId,new_role:role});
    status(result.error?"Role update failed: "+result.error.message:"Role set: "+p.name+" → "+role.toUpperCase());return;
  }
  if(command==="bans"){await refreshAdminBans();status("Ban list refreshed.");return;}
  if(command==="audit"){$("mpAuditRefresh").click();status("Audit log refreshed.");return;}
  status("Unknown command. Try /help.");
}

function renderMapVote(){
  const state=bridge()?.getLocalState?.();
  const visible=!!channel&&!!state?.lobbyMode&&!state?.alive&&!state?.roundOver&&mapVoteState.started&&!mapVoteState.resolved;
  mapVoteRoot.style.display=visible?"block":"none";if(!visible)return;
  const left=Math.max(0,Math.ceil((mapVoteState.endsAt-Date.now())/1000));
  mapVoteRoot.querySelector("#mvTimer").textContent="00:"+String(left).padStart(2,"0");
  const grid=mapVoteRoot.querySelector("#mvGrid");grid.replaceChildren();
  const totals={};Object.values(mapVoteState.votes||{}).forEach(id=>{totals[id]=(totals[id]||0)+1;});
  mapVoteState.maps.forEach(map=>{const card=document.createElement("button");card.type="button";card.className="mvCard"+(mapVoteState.selected===map.id?" selected":"");card.innerHTML='<div class="mvPreview '+map.tone+'"></div><div class="mvName"></div><div class="mvVotes"></div>';card.querySelector(".mvName").textContent=map.name;card.querySelector(".mvVotes").textContent=(totals[map.id]||0)+" votes";card.disabled=left<=0;card.onclick=()=>castMapVote(map.id);grid.appendChild(card);});
  mapVoteRoot.querySelector("#mvFoot").textContent=mapVoteState.selected?"Your vote is counted · you can change it":"Choose one map · votes can be changed";
}
function applyMapVoteState(payload){
  if(!payload||!Array.isArray(payload.maps))return;
  mapVoteState={...mapVoteState,...payload,maps:payload.maps,votes:payload.votes||{},selected:payload.votes?.[selfId]||mapVoteState.selected};
  if(mapVoteState.resolved&&mapVoteState.winner){localStorage.setItem("deflectMap",mapVoteState.winner);mapVoteRoot.style.display="none";window.__DEFLECT_APPLY_ARENA_THEME__?.();window.dispatchEvent(new CustomEvent("deflect-map-applied",{detail:{map:mapVoteState.winner}}));}
  renderMapVote();
}
function castMapVote(mapId){
  if(mapVoteState.resolved||!mapVoteState.maps.some(m=>m.id===mapId))return;
  mapVoteState.selected=mapId;mapVoteState.votes={...mapVoteState.votes,[selfId]:mapId};send("map-vote-cast",{id:selfId,map:mapId});renderMapVote();
}
function beginMapVote(){
  if(!channel||!isHost||mapVoteState.started||mapVoteState.resolved)return;
  const payload={started:true,resolved:false,endsAt:Date.now()+10000,maps:MAP_VOTE_CHOICES,votes:{},selected:null,winner:null};
  applyMapVoteState(payload);send("map-vote-start",payload);
  clearInterval(mapVoteClock);mapVoteClock=setInterval(()=>{renderMapVote();if(Date.now()>=mapVoteState.endsAt&&!mapVoteState.resolved){clearInterval(mapVoteClock);finishMapVote();}},100);
}
function finishMapVote(){
  if(!isHost||mapVoteState.resolved)return;
  const totals={};Object.values(mapVoteState.votes||{}).forEach(id=>{totals[id]=(totals[id]||0)+1;});
  const high=Math.max(0,...mapVoteState.maps.map(m=>totals[m.id]||0));
  const tied=mapVoteState.maps.filter(m=>(totals[m.id]||0)===high);
  const winner=(tied.length?tied[Math.floor(Math.random()*tied.length)]:MAP_VOTE_CHOICES[0]).id;
  const payload={...mapVoteState,resolved:true,winner};applyMapVoteState(payload);send("map-vote-result",payload);
  mapVoteRoot.querySelector("#mvFoot").textContent="WINNER: "+(MAP_VOTE_CHOICES.find(m=>m.id===winner)?.name||winner)+" · Loading arena…";
  setTimeout(()=>startMatch(),900);
}
function electHost(){
  const members=roomPlayers();
  const living=matchStarted?members.filter(p=>p.alive!==false):members;
  const list=(living.length?living:members).slice().sort((a,b)=>((a.joinedAt||0)-(b.joinedAt||0))||String(a.id).localeCompare(String(b.id)));
  isHost=list[0]?.id===selfId;
  $("mpHost").textContent=isHost?"HOST · this device controls the shared ball":"CONNECTED · following room host";
  bridge()?.setNetworkState(true,isHost,selfId,list[0]?.id||selfId);
}
function render(){
  const list=roomPlayers();
  const unique=[...new Map(list.map(p=>[p.id,p])).values()];
  const present=new Set(unique.map(p=>p.id));
  for(const id of players.keys())if(!present.has(id))players.delete(id);
  $("mpPlayers").replaceChildren();
  if(!unique.length){$("mpPlayers").innerHTML='<li class="mpMuted">Waiting for players…</li>';applyRemotePlayers();return}
  unique.forEach(p=>{const li=document.createElement("li");const owner=p.role==="owner"||(p.id===selfId&&currentRole==="owner");const name=document.createElement("span");name.textContent=(p.name||"Player")+(p.id===selfId?" (YOU)":"");li.appendChild(name);if(owner){const verified=document.createElement("span");verified.textContent=" ✓";verified.title="Verified Owner";verified.setAttribute("aria-label","Verified Owner");verified.style.cssText="display:inline-flex;align-items:center;justify-content:center;margin-left:5px;padding:1px 6px;border-radius:10px;background:#1769d2;color:white;font-weight:900;font-size:11px";li.appendChild(verified);const tag=document.createElement("span");tag.textContent=" OWNER";tag.style.cssText="margin-left:4px;color:#7edbff;font-size:10px;font-weight:900;letter-spacing:.08em";li.appendChild(tag);} $("mpPlayers").appendChild(li)});
  electHost();
  applyRemotePlayers();
  renderAdminConsole();
  const state=bridge()?.getLocalState?.();
  // The room host starts the round once a second player is present. Previously
  // both clients waited for someone else to start, so neither ever launched an orb.
  const enoughPlayers=isPublicMatch?unique.length>=1:unique.length>=2;
  if(enoughPlayers&&isHost&&!matchStarted&&state?.lobbyMode&&!state?.alive&&!state?.roundOver&&!mapVoteState.started&&!mapVoteState.resolved)beginMapVote();
  renderMapVote();
}
function applyRemotePlayers(){
  const remote=[...players.entries()].map(([id,state])=>({id,state}));
  bridge()?.setRemotePlayers(remote);
}
function startMatch(){
  const state=bridge()?.getLocalState?.();
  if(!mapVoteState.resolved||state?.alive||matchStarted||!state?.lobbyMode||state?.roundOver)return;
  matchStarted=true;
  const game=bridge();
  if(typeof game?.startOnlineRound==="function"){
    if(!game.startOnlineRound()){matchStarted=false;return;}
  }else{
    const button=document.getElementById("startBtn");
    if(!button){matchStarted=false;return;}
    button.click();
  }
  if(bridge()?.getLocalState?.()?.alive)status("Online round starting…");
  else matchStarted=false;
}
function startLoops(){
  clearInterval(loops);
  loops=setInterval(()=>{
    if(!channel)return;
    const now=performance.now(),b=bridge(),state=b?.getLocalState?.();
    if(!state)return;
    const aliveNow=!!state.alive;
    if(aliveNow!==lastPresenceAlive){lastPresenceAlive=aliveNow;void channel.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,joinedAt,alive:aliveNow}});}
    if(state.alive&&!lastAlive){matchStarted=true;send("match-start",{by:selfId,at:Date.now()});}
    lastAlive=!!state.alive;
    if(now-lastStateSent>120){
      lastStateSent=now;
      send("player-state",{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,state});
    }
    if(isHost&&mapVoteState.started&&!mapVoteState.resolved&&now-lastMapVoteSync>1800){lastMapVoteSync=now;send("map-vote-sync",mapVoteState);}
    if(isHost&&now-lastOrbSent>100){
      lastOrbSent=now;
      send("orb-state",{state});
      const hits=b?.checkRemoteHits?.([...players.entries()].map(([id,s])=>({id,state:s})))||[];
      for(const id of hits)send("player-eliminated",{id,by:selfId});
    }
  },35);
}
async function leave(){
  clearInterval(loops);loops=null;clearInterval(publicHeartbeat);publicHeartbeat=null;clearInterval(publicStatePoll);publicStatePoll=null;matchStarted=false;lastAlive=false;
  const publicId=publicServerId,wasPublic=isPublicMatch;publicServerId=null;isPublicMatch=false;lastPresenceAlive=null;
  if(publicId&&publicPlayerId)await supabase.rpc("deflect_leave_public_server",{p_player_id:publicPlayerId});
  const old=channel;channel=null;roomCode=null;players.clear();clearInterval(mapVoteClock);mapVoteState={started:false,resolved:false,endsAt:0,maps:[],votes:{},selected:null,winner:null};mapVoteRoot.style.display="none";
  bridge()?.setNetworkState(false,false,null,null);
  bridge()?.setRemotePlayers([]);
  if(wasPublic)bridge()?.setPublicBotCount?.(null);
  $("mpLeave").disabled=true;$("mpRoom").textContent="Not connected to a room";$("mpHost").textContent="";
  $("mpPlayers").innerHTML='<li class="mpMuted">No room joined</li>';
  if(old)await supabase.removeChannel(old);
}
async function join(raw,options={}){
  const room=raw.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  if(room.length!==6){status("Enter a 6-character room code.");return}
  if(!options.preserveMembership)await leave();roomCode=room;status(isPublicMatch?"Joining a public server…":"Connecting to private server…");
  const next=supabase.channel("deflect-room-"+room,{config:{presence:{key:selfId},broadcast:{self:false}}});
  next.on("presence",{event:"sync"},()=>{render();applyRemotePlayers()})
    .on("presence",{event:"join"},render).on("presence",{event:"leave"},()=>{render();applyRemotePlayers()})
    .on("broadcast",{event:"player-state"},({payload})=>{
      if(!payload?.id||payload.id===selfId||!payload.state)return;
      players.set(payload.id,{...payload.state,name:payload.name||"Player",role:payload.role||"player",userId:payload.userId||null});applyRemotePlayers();
      if(payload.state.alive&&!bridge()?.getLocalState?.()?.alive&&mapVoteState.resolved)startMatch();
    })
    .on("broadcast",{event:"orb-state"},({payload})=>{
      if(!isHost&&payload?.state)bridge()?.applySnapshot(payload.state);
    })
    .on("broadcast",{event:"deflect-request"},({payload})=>{
      if(isHost&&payload?.position){const ok=bridge()?.tryRemoteDeflect(payload.position,payload.rotation,payload.id);if(ok)status("Remote deflect confirmed");}
    })
    .on("broadcast",{event:"player-eliminated"},({payload})=>{
      if(!payload?.id)return;
      const old=players.get(payload.id);if(old)players.set(payload.id,{...old,alive:false});
      applyRemotePlayers();
      if(payload.id===selfId){bridge()?.applyNetworkElimination();status("ELIMINATED · room host confirmed the hit");}
    })
    .on("broadcast",{event:"map-vote-start"},({payload})=>{if(payload?.started){applyMapVoteState(payload);clearInterval(mapVoteClock);mapVoteClock=setInterval(()=>renderMapVote(),100);}})
    .on("broadcast",{event:"map-vote-cast"},({payload})=>{if(isHost&&payload?.id&&mapVoteState.started&&!mapVoteState.resolved&&mapVoteState.maps.some(m=>m.id===payload.map)){mapVoteState.votes={...mapVoteState.votes,[payload.id]:payload.map};send("map-vote-sync",mapVoteState);renderMapVote();}})
    .on("broadcast",{event:"map-vote-sync"},({payload})=>{if(!isHost&&payload?.started&&!mapVoteState.resolved)applyMapVoteState(payload);})
    .on("broadcast",{event:"map-vote-result"},({payload})=>{applyMapVoteState(payload);})
    .on("broadcast",{event:"match-start"},({payload})=>{if(payload?.by!==selfId)startMatch()})
    .on("broadcast",{event:"host-eliminated"},({payload})=>{if(payload?.id&&payload.id!==selfId){const old=players.get(payload.id);if(old)players.set(payload.id,{...old,alive:false});applyRemotePlayers();status("HOST ELIMINATED · transferring host control");render();}});
  next.subscribe(async s=>{
    if(s==="SUBSCRIBED"){
      channel=next;
      joinedAt=Date.now();
      // Give each public-lobby player a stable spot around the shared spawn point.
      // Without this, every real player occupies the exact same coordinates.
      const localState=bridge()?.getLocalState?.();
      if(isPublicMatch&&localState?.lobbyMode&&!localState?.alive){
        let hash=0;for(let i=0;i<selfId.length;i++)hash=(hash*31+selfId.charCodeAt(i))>>>0;
        const angle=(hash/4294967296)*Math.PI*2;
        const radius=3.6;
        const p=localState.position||[29.5,18.2,0];
        bridge()?.setLocalPosition?.([p[0]+Math.cos(angle)*radius,p[1],p[2]+Math.sin(angle)*radius]);
      }
      lastPresenceAlive=!!bridge()?.getLocalState?.()?.alive;
      await next.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,joinedAt,alive:lastPresenceAlive}});
      $("mpRoom").textContent=isPublicMatch?"PUBLIC SERVER · AUTOMATIC MATCHMAKING":"PRIVATE SERVER CODE: "+room+" · share with friends";
      $("mpCode").value=isPublicMatch?"":room;$("mpLeave").disabled=false;
      status(isPublicMatch?"Matched into public server · connected as "+playerName:"Connected as "+playerName);render();startLoops();
      if(isPublicMatch){
        await refreshPublicState();
        clearInterval(publicHeartbeat);publicHeartbeat=setInterval(async()=>{const hb=await supabase.rpc("deflect_public_server_heartbeat",{p_player_id:publicPlayerId});if(hb.error||hb.data===false)status("Public server heartbeat lost. Rejoin public matchmaking.");},12000);
        clearInterval(publicStatePoll);publicStatePoll=setInterval(refreshPublicState,3000);
      }
    }else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"){
      status("Connection failed. Check internet and try again.");
      if(channel!==next)await supabase.removeChannel(next);
      if(isPublicMatch)await leave();
    }
  });
}
window.addEventListener("deflect:host-eliminated",()=>{if(channel&&isHost)send("host-eliminated",{id:selfId});});
window.addEventListener("deflect:request",event=>{
  const state=event.detail||{},p=state.position;
  if(channel&&Array.isArray(p))send("deflect-request",{id:selfId,position:p,rotation:state.rotation});
});
window.addEventListener("deflect:remote-eliminated",event=>{const id=event.detail?.id;if(channel&&isHost&&id)send("player-eliminated",{id,by:selfId});});
$("mpSaveName").onclick=async()=>{const clean=$("mpName").value.replace(/[^a-zA-Z0-9 _-]/g,"").trim().slice(0,16);if(clean.length<3){status("Username must be at least 3 characters.");return;}playerName=clean;window.__DEFLECT_MP_NAME__=clean;sessionStorage.setItem("deflectPlayerName",clean);let accountSaveError=null;if(authSession){const saved=await supabase.rpc("deflect_set_my_username",{p_username:clean});if(saved.error)accountSaveError=saved.error.message;}if(isPublicMatch){status(accountSaveError?"Username saved for this tab; account sync unavailable.":"Updating username…");await joinPublic();}else{if(channel)await channel.track({player:{id:selfId,name:playerName,role:currentRole,userId:authSession?.user?.id||null,joinedAt,alive:!!bridge()?.getLocalState?.()?.alive}});status(accountSaveError?"Username saved for this tab; account sync unavailable: "+accountSaveError:"Username saved: "+clean);}};
$("mpName").onkeydown=e=>{if(e.key==="Enter")$("mpSaveName").click()};
$("mpAnnounce").onclick=()=>withButton($("mpAnnounce"),"SENDING",async()=>{const message=$("mpAdminMessage").value.trim();if(!message){status("Type an announcement first.");return;}if(await issueAdminAction(null,"announce",{message}))$("mpAdminMessage").value="";});
$("mpStartEvent").onclick=()=>withButton($("mpStartEvent"),"STARTING",async()=>{const event=$("mpAdminEvent").value;await issueAdminAction(null,"event",{event,message:"ADMIN EVENT · "+event.replaceAll("_"," ").toUpperCase()});});
$("mpBansRefresh").onclick=()=>withButton($("mpBansRefresh"),"LOADING",refreshAdminBans);
$("mpStaffRefresh").onclick=()=>withButton($("mpStaffRefresh"),"LOADING",()=>refreshStaffManager(true));
$("mpStaffAssign").onclick=()=>withButton($("mpStaffAssign"),"SAVING",async()=>{const username=$("mpStaffUsername").value.trim();const role=$("mpStaffRole").value;if(!username){status("Enter the player's username first.");return;}const result=await supabase.rpc("deflect_assign_role_by_username",{p_username:username,new_role:role});status(result.error?"Staff update failed: "+result.error.message:(role==="player"?"Staff rank removed for ":"Rank assigned to ")+username+".");if(!result.error){$("mpStaffUsername").value="";await refreshStaffManager(true);}});
$("mpCommandRun").onclick=()=>withButton($("mpCommandRun"),"RUNNING",runAdminCommand);
$("mpAdminCommand").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();runAdminCommand();}};
$("mpAuditRefresh").onclick=()=>withButton($("mpAuditRefresh"),"LOADING",async()=>{const result=await supabase.from("deflect_admin_actions").select("*").order("created_at",{ascending:false}).limit(10);const box=$("mpAdminAudit");box.replaceChildren();if(result.error){box.textContent="Audit log unavailable: "+result.error.message;status("Audit log failed: "+result.error.message);return;}for(const item of result.data||[]){const line=document.createElement("div");line.textContent=new Date(item.created_at).toLocaleString()+" · "+item.action.toUpperCase()+" · "+(item.payload?.message||item.payload?.event||item.target_user||"");box.appendChild(line);}status("Audit log refreshed · "+(result.data||[]).length+" entries.");});
$("mpLogin").onclick=()=>withButton($("mpLogin"),"SIGNING IN",async()=>{
  const email=$("mpEmail").value.trim().toLowerCase(),password=$("mpPassword").value;
  if(email!=="herinppatel@gmail.com"){status("That email is not the DEFLECT Owner account.");return;}
  if(!password){status("Enter your Owner password.");return;}
  const result=await supabase.auth.signInWithPassword({email,password});
  if(result.error){status("Password sign-in failed: "+result.error.message);return;}
  if(!isOwnerEmail(result.data?.session)){await supabase.auth.signOut();status("This account is not the verified DEFLECT Owner.");return;}
  persistOwnerSession(result.data.session);await refreshAuth(result.data.session);$("mpPassword").value="";status("Owner signed in successfully.");
});
$("mpResetPassword").onclick=()=>withButton($("mpResetPassword"),"SENDING",async()=>{
  const email=$("mpEmail").value.trim().toLowerCase();
  if(email!=="herinppatel@gmail.com"){status("Password setup is only available for the Owner email.");return;}
  const result=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
  status(result.error?"Password setup email failed: "+result.error.message:"Password setup link sent. Open it on this same DEFLECT site, then choose your new password. Email rate limits may delay delivery.");
});
$("mpSavePassword").onclick=()=>withButton($("mpSavePassword"),"SAVING",async()=>{
  const password=$("mpNewPassword").value;
  if(password.length<8){status("Use at least 8 characters for your password.");return;}
  const result=await supabase.auth.updateUser({password});
  if(result.error){status("Password update failed: "+result.error.message);return;}
  $("mpNewPassword").value="";$("mpPasswordRecovery").style.display="none";
  status("Owner password saved. You can now sign in with your email and password.");
});
$("mpLogout").onclick=async()=>{await leave();await supabase.auth.signOut();await refreshAuth(null);status("Signed out.");};
supabase.auth.onAuthStateChange((event,session)=>{
  if(event==="PASSWORD_RECOVERY"){$("mpPasswordRecovery").style.display="block";status("Recovery link verified. Set your new Owner password below.");}
  if(isOwnerEmail(session))persistOwnerSession(session);
  else if(event==="SIGNED_OUT"&&isOwnerEmail(authSession))clearPersistedOwnerSession();
  Promise.resolve().then(()=>refreshAuth(session));
});
ownerRestorePromise=(async()=>{
  const current=await supabase.auth.getSession();
  const currentSession=current.data?.session||null;
  // Finish Owner restoration before automatic guest matchmaking can create or
  // replace the tab's auth identity.
  if(isOwnerEmail(currentSession)){
    persistOwnerSession(currentSession);
    await refreshAuth(currentSession);
    return;
  }
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(OWNER_SESSION_KEY)||"null");}catch(_){}
  if(saved?.access_token&&saved?.refresh_token){
    const restored=await supabase.auth.setSession(saved);
    if(!restored.error&&isOwnerEmail(restored.data?.session)){
      persistOwnerSession(restored.data.session);
      await refreshAuth(restored.data.session);
      return;
    }
    if(restored.error)clearPersistedOwnerSession();
  }
  await refreshAuth(currentSession);
})();
if(!adminPoll)adminPoll=setInterval(pollAdminActions,3500);
async function refreshPublicState(){
  if(!isPublicMatch)return;
  const result=await supabase.rpc("deflect_public_server_state",{p_player_id:publicPlayerId});
  if(result.error){status("Public server status is temporarily unavailable.");return;}
  const state=Array.isArray(result.data)?result.data[0]:result.data;
  if(!state?.active){status("Public server membership expired. Rejoin public matchmaking.");return;}
  bridge()?.setPublicBotCount?.(state.bot_count);
  $("mpRoom").textContent="PUBLIC SERVER · "+state.real_players+"/16 PLAYERS · "+state.bot_count+" BOTS";
}
async function ensurePublicIdentity(){
  let session=authSession;
  if(!session?.user?.id){const current=await supabase.auth.getSession();session=current.data?.session||null;}
  if(!session?.user?.id){
    const result=await supabase.auth.signInAnonymously();
    if(result.error){status("Guest matchmaking sign-in failed: "+result.error.message);return null;}
    session=result.data?.session||null;
    if(!session?.user?.id){status("Guest sign-in did not return a player identity. Please try again.");return null;}
    await refreshAuth(session);
  }
  authSession=session;publicPlayerId=session.user.id;return publicPlayerId;
}
async function joinPublic(){
  await ownerRestorePromise;
  await leave();
  const playerId=await ensurePublicIdentity();if(!playerId)return;
  status("Finding an available public server…");
  const result=await supabase.rpc("deflect_join_public_server",{p_player_id:playerId,p_player_name:playerName});
  if(result.error){status("Public matchmaking failed: "+result.error.message);return;}
  const server=Array.isArray(result.data)?result.data[0]:result.data;
  if(!server?.server_code||!server?.server_id){status("Matchmaking returned an invalid server. Try again.");return;}
  publicServerId=server.server_id;isPublicMatch=true;
  bridge()?.setPublicBotCount?.(server.bot_count);
  await join(server.server_code,{preserveMembership:true});
}
$("mpCreate").onclick=()=>join(makeCode());
$("mpJoin").onclick=()=>join($("mpCode").value);
$("mpLeave").onclick=()=>{leave();status("You left the room.")};
$("mpCode").onkeydown=e=>{if(e.key==="Enter")join($("mpCode").value)};
window.addEventListener("pagehide",()=>{if(channel)supabase.removeChannel(channel)});
// Automatically place every visitor into public matchmaking when DEFLECT loads.
if(!new URLSearchParams(location.search).has("deflectTest"))setTimeout(()=>{if(!channel&&!isPublicMatch)void joinPublic();},0);
