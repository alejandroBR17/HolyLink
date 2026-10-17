export interface ProjectionWindowCommand {id:string;action:'open'|'close';at:number}
export interface ProjectionWindowResult {id:string;status:'open'|'closed'|'blocked';at:number}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const envelope=(value:unknown):value is Record<string,unknown>=>record(value)&&typeof value.id==='string'&&/^[a-f0-9-]{36}$/.test(value.id)&&typeof value.at==='number'&&Number.isSafeInteger(value.at)&&value.at>0&&Object.keys(value).length===3;
export const validWindowCommand=(value:unknown):value is ProjectionWindowCommand=>envelope(value)&&['open','close'].includes(value.action as string);
export const validWindowResult=(value:unknown):value is ProjectionWindowResult=>envelope(value)&&['open','closed','blocked'].includes(value.status as string);
export const isWindowMessage=(key:string)=>key==='projectionWindowCommand'||key==='projectionWindowResult';
/** Transient commands never replay after reconnect, backup, or browser reload. */
export class WindowCommandGate {
  private seen=new Set<string>();
  accept(command:ProjectionWindowCommand,now=Date.now()):boolean{
    if(!validWindowCommand(command)||now-command.at>15000||command.at-now>5000||this.seen.has(command.id))return false;
    this.seen.add(command.id);if(this.seen.size>100)this.seen.delete(this.seen.values().next().value!);return true;
  }
}
