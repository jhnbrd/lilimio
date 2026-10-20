import test from 'node:test';
import assert from 'node:assert/strict';
import { readStored,writeStored,removeStored } from '../src/lib/storage';

test('blocked browser storage produces explicit failure and safe defaults',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Storage disabled');}});
 try{assert.equal(readStored('city',null),null);assert.equal(writeStored('city',{id:'davao'}),false);assert.equal(removeStored('city'),false);}finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});
test('malformed and invalid saved values cannot bypass validation',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let raw='broken JSON';
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;},removeItem:()=>{raw='null';}}});
 try{assert.equal(readStored('unit','C'), 'C');raw='"Kelvin"';assert.equal(readStored('unit','C',v=>v==='C'||v==='F'),'C');assert.equal(writeStored('unit','F'),true);assert.equal(readStored('unit','C',v=>v==='C'||v==='F'),'F');}finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});
