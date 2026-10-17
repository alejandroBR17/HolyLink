import {isPairingCode} from './pairing-session.ts';
export const TRUST_KEY='holylink_trusted_devices_v1';
const DEVICE_KEY='holylink_device_id_v1';
const idPattern=/^[a-f0-9]{32}$/;
const secretPattern=/^[a-f0-9]{64}$/;
export const isDeviceId=(value:unknown):value is string=>typeof value==='string'&&idPattern.test(value);
export const isTrustNonce=(value:unknown):value is string=>typeof value==='string'&&secretPattern.test(value);
export type TrustRole='controller'|'receiver';
export interface TrustedDevice {role:TrustRole;id:string;secret:string;code:string;label:string;createdAt:number;lastUsedAt:number}
export interface ResumeContext {receiverId:string;controllerId:string;code:string;clientNonce:string;serverNonce:string}
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const hex=(bytes:Uint8Array)=>Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
export const createTrustSecret=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const createTrustNonce=createTrustSecret;
let sessionDeviceId:string|undefined;
export function getDeviceIdentity(store:Store=localStorage):{id:string;persistent:boolean} {
 try {
  const saved=store.getItem(DEVICE_KEY);if(isDeviceId(saved))return {id:saved,persistent:true};
  const id=sessionDeviceId??hex(crypto.getRandomValues(new Uint8Array(16)));sessionDeviceId=id;
  store.setItem(DEVICE_KEY,id);return {id,persistent:store.getItem(DEVICE_KEY)===id};
 } catch {return {id:sessionDeviceId??=(hex(crypto.getRandomValues(new Uint8Array(16)))),persistent:false};}
}
export function readTrustedDevices(store:Store=localStorage):TrustedDevice[] {
 try {
  const raw=store.getItem(TRUST_KEY);if(!raw||raw.length>32768)return [];
  const data=JSON.parse(raw);if(!Array.isArray(data)||data.length>16)return [];
  const result:TrustedDevice[]=[];
  for(const entry of data) {
   if(!entry||!['controller','receiver'].includes(entry.role)||!isDeviceId(entry.id)||!isTrustNonce(entry.secret)||!isPairingCode(entry.code)||typeof entry.label!=='string'||!entry.label.trim()||entry.label.length>48||!Number.isSafeInteger(entry.createdAt)||entry.createdAt<0||!Number.isSafeInteger(entry.lastUsedAt)||entry.lastUsedAt<0)continue;
   if(result.some(item=>item.role===entry.role&&item.id===entry.id))continue;
   result.push({role:entry.role,id:entry.id,secret:entry.secret,code:entry.code,label:entry.label,createdAt:entry.createdAt,lastUsedAt:entry.lastUsedAt});
  }
  return result;
 } catch {return [];}
}
export function saveTrustedDevice(device:TrustedDevice,store:Store=localStorage):boolean {
 try {
  const current=readTrustedDevices(store).filter(item=>!(item.role===device.role&&item.id===device.id));
  // Do not silently evict a previously trusted device to make room.
  if(current.length>=16)return false;
  const serialized=JSON.stringify([...current,device]);
  store.setItem(TRUST_KEY,serialized);
  return readTrustedDevices(store).some(item=>item.role===device.role&&item.id===device.id&&item.secret===device.secret&&item.code===device.code);
 } catch {return false;}
}
export function removeTrustedDevice(role:TrustRole,id:string,store:Store=localStorage):boolean {
 try {store.setItem(TRUST_KEY,JSON.stringify(readTrustedDevices(store).filter(item=>item.role!==role||item.id!==id)));return !readTrustedDevices(store).some(item=>item.role===role&&item.id===id);}catch{return false;}
}
export const findTrustedController=(id:string,code:string)=>readTrustedDevices().find(item=>item.role==='controller'&&item.id===id&&item.code===code);
export const findTrustedReceiver=(code:string)=>readTrustedDevices().find(item=>item.role==='receiver'&&item.code===code);
function validContext(context:ResumeContext) {return context&&isDeviceId(context.receiverId)&&isDeviceId(context.controllerId)&&isPairingCode(context.code)&&isTrustNonce(context.clientNonce)&&isTrustNonce(context.serverNonce);}
function payload(role:'receiver'|'controller'|'approved',context:ResumeContext) {
 if(!validContext(context))throw new Error('Contexto de reconexão inválido.');
 return new TextEncoder().encode(JSON.stringify(['holylink-trust-v1',role,context.receiverId,context.controllerId,context.code,context.clientNonce,context.serverNonce]));
}
async function keyFor(secret:string) {
 if(!isTrustNonce(secret))throw new Error('Autorização inválida.');
 return crypto.subtle.importKey('raw',new Uint8Array(secret.match(/../g)!.map(byte=>parseInt(byte,16))),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function signResumeProof(secret:string,role:'receiver'|'controller'|'approved',context:ResumeContext):Promise<string> {
 return hex(new Uint8Array(await crypto.subtle.sign('HMAC',await keyFor(secret),payload(role,context))));
}
export async function verifyResumeProof(secret:string,role:'receiver'|'controller'|'approved',context:ResumeContext,proof:unknown):Promise<boolean> {
 if(!isTrustNonce(proof)||!validContext(context))return false;
 try {return await crypto.subtle.verify('HMAC',await keyFor(secret),new Uint8Array(proof.match(/../g)!.map(byte=>parseInt(byte,16))),payload(role,context));}catch{return false;}
}
export const reconnectDelay=(attempt:number)=>[1500,3000,6000,10000,20000,30000][Math.min(5,Math.max(0,Math.floor(attempt)||0))];
