import test from 'node:test';
import assert from 'node:assert/strict';
import {HeaderScroll} from '../src/utils/header-scroll.ts';
test('header ignores anchoring, resize and stale intent; explicit reversal restores it',()=>{
 const state=new HeaderScroll();assert.equal(state.scroll(100,1000,100),false);
 state.userIntent(50,200);assert.equal(state.scroll(150,1000,201),true);
 assert.equal(state.scroll(80,1000,210),true);assert.equal(state.scroll(140,1000,700),true);
 assert.equal(state.scroll(0,1000,1500),true);
 state.userIntent(-30,1600);assert.equal(state.scroll(0,1000,1601),true);
 state.scroll(100,1000,2500);state.userIntent(-20,2600);assert.equal(state.scroll(80,1000,2601),true);assert.equal(state.scroll(60,1000,2610),false);
 assert.equal(state.scroll(110,1000,2620),false);
});
test('small wheel movement accumulates but boundary bounce cannot invent travel',()=>{
 const state=new HeaderScroll();state.userIntent(1,10);for(let top=1;top<=64;top++)assert.equal(state.scroll(top,1000,10+top),false);
 assert.equal(state.scroll(70,1000,100),true);state.userIntent(-1,600);assert.equal(state.scroll(-30,0,601),false);assert.equal(state.scroll(30,0,602),false);
});

test('a deliberate quick reversal does not get lost during the transition',()=>{
 const state=new HeaderScroll();state.userIntent(100,10);assert.equal(state.scroll(100,1000,20),true);
 state.userIntent(-50,30);assert.equal(state.scroll(50,1000,40),false);
 assert.equal(state.scroll(100,1000,50),false);
});

test('explicit reveal works when collapsing made the whole page fit',()=>{
 const state=new HeaderScroll();state.userIntent(100,10);state.scroll(100,500,20);assert.equal(state.collapsed,true);
 state.scroll(0,0,450);state.reveal(500);assert.equal(state.collapsed,false);assert.equal(state.scroll(20,500,510),false);
 state.userIntent(100,1000);assert.equal(state.scroll(100,500,1010),true);
});
