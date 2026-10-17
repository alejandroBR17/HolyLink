/** Layout changes and scroll anchoring must never count as a user's reversal. */
export class HeaderScroll {
  collapsed=false;
  private top=0;
  private intent=0;
  private intentUntil=0;
  private lockedUntil=0;
  private travel=0;
  reveal(now:number){this.collapsed=false;this.travel=0;this.intent=0;this.intentUntil=0;this.lockedUntil=now+400;}
  userIntent(direction:number,now:number) {
    const next=Math.sign(direction);
    if(!next)return;
    if(next!==this.intent){this.travel=0;this.lockedUntil=0;}
    this.intent=next;this.intentUntil=now+800;
  }
  scroll(top:number,max:number,now:number) {
    const current=Math.max(0,Math.min(top,Math.max(0,max)));
    const delta=current-this.top;this.top=current;
    if(now<this.lockedUntil||now>this.intentUntil||Math.sign(delta)!==this.intent)return this.collapsed;
    this.travel+=Math.abs(delta);
    const next=this.intent>0&&current>64?true:this.intent<0&&(this.travel>=28||current<=12)?false:this.collapsed;
    if(next!==this.collapsed&&this.travel>=12){this.collapsed=next;this.travel=0;this.lockedUntil=now+400;}
    return this.collapsed;
  }
}
